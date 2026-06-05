import { Request, Response } from 'express';
import mongoose from 'mongoose';
import OpenAI from 'openai';
import Entry from '../models/Entry';
import Task from '../models/Task';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const isDbReady = () => mongoose.connection.readyState === 1;

function getDateRange(period: string, date: string): { start: Date; end: Date; label: string } {
  const base = new Date(date);
  base.setHours(23, 59, 59, 999);

  if (period === 'week') {
    const start = new Date(date);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end: base, label: 'Сүүлийн 7 хоног' };
  }

  if (period === 'month') {
    const start = new Date(date);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end: base, label: 'Сүүлийн 1 сар' };
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return { start, end: base, label: date };
}

export const getReport = async (req: Request, res: Response) => {
  try {
    const { date, period = 'day' } = req.body as { date: string; period?: string };
    if (!date) return res.status(400).json({ error: 'date is required' });

    const { start, end, label } = getDateRange(period, date);

    if (!isDbReady()) {
      return res.json({
        period, label, startDate: start.toISOString().split('T')[0], endDate: date,
        entryCount: 0, taskCount: 0, completedTaskCount: 0, eventCount: 0,
        summary: `${label}-ны мэдээлэл олдсонгүй (mock mode).`,
      });
    }

    const [entries, allTasks] = await Promise.all([
      Entry.find({ uid: req.uid, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }),
      Task.find({ uid: req.uid }),
    ]);

    const taskCount = entries.reduce((acc, e) => acc + e.tasks.length, 0);
    const eventCount = entries.reduce((acc, e) => acc + e.events.length, 0);
    const completedTaskCount = allTasks.filter(t => t.status === 'done').length;
    const pendingTaskCount = allTasks.filter(t => t.status === 'pending').length;

    let summary = `${label}-нд бүртгэл олдсонгүй.`;

    if (entries.length > 0) {
      const entrySummaries = entries.map(e => `- ${e.summary || e.text.slice(0, 120)}`).join('\n');
      const taskTitles = entries.flatMap(e => e.tasks).map(t => t.title).join(', ');
      const eventTitles = entries.flatMap(e => e.events).map(ev => ev.title).join(', ');

      const periodLabel = period === 'day' ? 'өнөөдөр' : period === 'week' ? 'энэ 7 хоногт' : 'энэ сард';
      const prompt = `Та хэрэглэгчийн ${periodLabel}-ны үйл ажиллагааг үндэслэн түүнтэй шууд ярьдаг, дотно, урамшуулсан байдлаар монгол хэлээр 3-5 өгүүлбэрт дүгнэлт бич. "Та" гэж хандах хэрэгтэй. Сайн хийсэн зүйлийг тодорхой магт. Жишээ: "Та өнөөдөр 3 даалгаврыг гүйцэтгэсэн — үнэхээр сайн хичээлээ!" гэх мэт.

Статистик:
- Бүртгэсэн үйл явдал: ${entries.length}
- Үүсгэсэн даалгавар: ${taskCount}
- Гүйцэтгэсэн даалгавар: ${completedTaskCount}
- Хүлээгдэж буй даалгавар: ${pendingTaskCount}
- Үйл явдал: ${eventCount}

Бүртгэлүүд:
${entrySummaries}
${taskTitles ? `\nДаалгаврууд: ${taskTitles}` : ''}
${eventTitles ? `\nҮйл явдлууд: ${eventTitles}` : ''}`;

      const ai = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
      });
      summary = ai.choices[0]?.message?.content ?? summary;
    }

    res.json({
      period,
      label,
      startDate: start.toISOString().split('T')[0],
      endDate: date,
      entryCount: entries.length,
      taskCount,
      completedTaskCount,
      eventCount,
      summary,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
