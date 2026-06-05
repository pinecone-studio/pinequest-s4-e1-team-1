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

function buildPrompt(type: string, periodLabel: string, stats: Record<string, number>, entrySummaries: string, taskTitles: string, eventTitles: string) {
  if (type === 'work') {
    return `Та ажилтны ${periodLabel}-ны ажлын гүйцэтгэлийг үндэслэн монгол хэлээр 3-5 өгүүлбэрт мэргэжлийн, товч тайлан бич. "Та" гэж хандах. Гүйцэтгэсэн ажлыг онцол, дараагийн алхамыг санал болго.

Ажлын статистик:
- Ажлын даалгавар нийт: ${stats.taskCount}
- Гүйцэтгэсэн: ${stats.completedTaskCount}
- Хүлээгдэж буй: ${stats.pendingTaskCount}
- Бүртгэл: ${stats.entryCount}

Ажлын бүртгэлүүд:
${entrySummaries}
${taskTitles ? `\nАжлын даалгаврууд: ${taskTitles}` : ''}
${eventTitles ? `\nАжлын үйл явдлууд: ${eventTitles}` : ''}`;
  }

  return `Та хэрэглэгчийн ${periodLabel}-ны үйл ажиллагааг үндэслэн түүнтэй шууд ярьдаг, дотно, урамшуулсан байдлаар монгол хэлээр 3-5 өгүүлбэрт дүгнэлт бич. "Та" гэж хандах. Сайн хийсэн зүйлийг тодорхой магт.

Статистик:
- Бүртгэл: ${stats.entryCount}
- Үүсгэсэн даалгавар: ${stats.taskCount}
- Гүйцэтгэсэн: ${stats.completedTaskCount}
- Хүлээгдэж буй: ${stats.pendingTaskCount}
- Үйл явдал: ${stats.eventCount}

Бүртгэлүүд:
${entrySummaries}
${taskTitles ? `\nДаалгаврууд: ${taskTitles}` : ''}
${eventTitles ? `\nҮйл явдлууд: ${eventTitles}` : ''}`;
}

export const getReport = async (req: Request, res: Response) => {
  try {
    const { date, period = 'day', type = 'general' } = req.body as { date: string; period?: string; type?: string };
    if (!date) return res.status(400).json({ error: 'date is required' });

    const { start, end, label } = getDateRange(period, date);

    if (!isDbReady()) {
      return res.json({
        period, type, label, startDate: start.toISOString().split('T')[0], endDate: date,
        entryCount: 0, taskCount: 0, completedTaskCount: 0, pendingTaskCount: 0, eventCount: 0,
        summary: `${label}-ны мэдээлэл олдсонгүй (mock mode).`,
      });
    }

    const [entries, workTasks, allTasks] = await Promise.all([
      Entry.find({ uid: req.uid, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }),
      Task.find({ uid: req.uid, category: 'Ажил' }),
      Task.find({ uid: req.uid }),
    ]);

    const isWork = type === 'work';
    const relevantTasks = isWork ? workTasks : allTasks;
    const completedTaskCount = relevantTasks.filter(t => t.status === 'done').length;
    const pendingTaskCount = relevantTasks.filter(t => t.status === 'pending').length;
    const taskCount = isWork ? workTasks.length : entries.reduce((acc, e) => acc + e.tasks.length, 0);
    const eventCount = entries.reduce((acc, e) => acc + e.events.length, 0);

    let summary = `${label}-нд ${isWork ? 'ажлын ' : ''}бүртгэл олдсонгүй.`;

    if (entries.length > 0 || relevantTasks.length > 0) {
      const entrySummaries = entries.map(e => `- ${e.summary || e.text.slice(0, 120)}`).join('\n') || '- Бүртгэл байхгүй';
      const taskTitles = (isWork ? workTasks : entries.flatMap(e => e.tasks)).map((t: any) => t.title).join(', ');
      const eventTitles = entries.flatMap(e => e.events).map(ev => ev.title).join(', ');
      const periodLabel = period === 'day' ? 'өнөөдөр' : period === 'week' ? 'энэ 7 хоногт' : 'энэ сард';

      const prompt = buildPrompt(type, periodLabel, { entryCount: entries.length, taskCount, completedTaskCount, pendingTaskCount, eventCount }, entrySummaries, taskTitles, eventTitles);

      const ai = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
      });
      summary = ai.choices[0]?.message?.content ?? summary;
    }

    res.json({
      period, type, label,
      startDate: start.toISOString().split('T')[0],
      endDate: date,
      entryCount: entries.length,
      taskCount,
      completedTaskCount,
      pendingTaskCount,
      eventCount,
      summary,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
