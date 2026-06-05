import { Request, Response } from 'express';
import mongoose from 'mongoose';
import OpenAI from 'openai';
import Entry from '../models/Entry';
import Task from '../models/Task';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const isDbReady = () => mongoose.connection.readyState === 1;

function getDateRange(period: string, date: string) {
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

async function buildExecutiveReport(stats: Record<string, number>, taskTitles: string, completedTitles: string, pendingTitles: string, periodLabel: string) {
  const prompt = `Та доорх өгөгдөл дээр үндэслэн захирал, менежерт зориулсан мэргэжлийн гүйцэтгэлийн тайланг монгол хэлээр JSON форматаар бич.

Өгөгдөл:
- Тайлант хугацаа: ${periodLabel}
- Нийт ажлын даалгавар: ${stats.total}
- Гүйцэтгэсэн: ${stats.done} (${stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%)
- Хүлээгдэж буй: ${stats.pending}
- Өндөр ач холбогдолтой: ${stats.high}
- Дунд: ${stats.medium}
- Бага: ${stats.low}
${completedTitles ? `- Гүйцэтгэсэн ажлууд: ${completedTitles}` : ''}
${pendingTitles ? `- Хүлээгдэж буй ажлууд: ${pendingTitles}` : ''}

Дараах JSON бүтцийг ЯНДАРЛАЛГҮЙ буцаа (markdown хэрэглэхгүй):
{
  "executiveSummary": "2-3 өгүүлбэр. Товч, баримтад тулгуурласан.",
  "insights": "Гүйцэтгэлийн шинжилгээ. Сайн тал, хандлага. 2-3 өгүүлбэр.",
  "risks": "Эрсдэл, саатал, анхааруулга. Байхгүй бол 'Тайлант хугацаанд ноцтой эрсдэл илрээгүй.'",
  "recommendations": "3 товч зөвлөмж. Жагсаалт хэлбэрээр."
}`;

  const ai = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 700,
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(ai.choices[0]?.message?.content ?? '{}');
  } catch {
    return { executiveSummary: ai.choices[0]?.message?.content ?? '', insights: '', risks: '', recommendations: '' };
  }
}

async function buildGeneralSummary(stats: Record<string, number>, entrySummaries: string, taskTitles: string, periodLabel: string) {
  const prompt = `Та хэрэглэгчийн ${periodLabel}-ны үйл ажиллагааг үндэслэн дотно, урамшуулсан байдлаар монгол хэлээр 3-4 өгүүлбэрт дүгнэлт бич. "Та" гэж хандах. Сайн хийсэн зүйлийг магт.

Статистик: бүртгэл ${stats.entryCount}, даалгавар ${stats.taskCount}, гүйцэтгэл ${stats.done}, үлдсэн ${stats.pending}
${entrySummaries}${taskTitles ? `\nДаалгаврууд: ${taskTitles}` : ''}`;

  const ai = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 350,
  });
  return ai.choices[0]?.message?.content ?? '';
}

export const getReport = async (req: Request, res: Response) => {
  try {
    const { date, period = 'day', type = 'general' } = req.body as { date: string; period?: string; type?: string };
    if (!date) return res.status(400).json({ error: 'date is required' });

    const { start, end, label } = getDateRange(period, date);

    if (!isDbReady()) {
      return res.json({ period, type, label, startDate: start.toISOString().split('T')[0], endDate: date, entryCount: 0, taskCount: 0, completedTaskCount: 0, pendingTaskCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, eventCount: 0, summary: '', executiveSummary: '', insights: '', risks: '', recommendations: '' });
    }

    const [entries, workTasks, allTasks] = await Promise.all([
      Entry.find({ uid: req.uid, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }),
      Task.find({ uid: req.uid, category: 'Ажил' }),
      Task.find({ uid: req.uid }),
    ]);

    const isWork = type === 'work';
    const relevant = isWork ? workTasks : allTasks;
    const completedTaskCount = relevant.filter(t => t.status === 'done').length;
    const pendingTaskCount = relevant.filter(t => t.status === 'pending').length;
    const highCount = relevant.filter(t => t.priority === 'high').length;
    const mediumCount = relevant.filter(t => t.priority === 'medium').length;
    const lowCount = relevant.filter(t => t.priority === 'low').length;
    const taskCount = isWork ? workTasks.length : entries.reduce((acc, e) => acc + e.tasks.length, 0);
    const eventCount = entries.reduce((acc, e) => acc + e.events.length, 0);
    const periodLabel = period === 'day' ? 'өнөөдөр' : period === 'week' ? 'энэ 7 хоногт' : 'энэ сард';

    let summary = '', executiveSummary = '', insights = '', risks = '', recommendations = '';

    if (isWork && relevant.length > 0) {
      const completedTitles = relevant.filter(t => t.status === 'done').map(t => t.title).join(', ');
      const pendingTitles = relevant.filter(t => t.status === 'pending').map(t => t.title).join(', ');
      const exec = await buildExecutiveReport({ total: relevant.length, done: completedTaskCount, pending: pendingTaskCount, high: highCount, medium: mediumCount, low: lowCount }, relevant.map(t => t.title).join(', '), completedTitles, pendingTitles, label);
      executiveSummary = exec.executiveSummary ?? '';
      insights = exec.insights ?? '';
      risks = exec.risks ?? '';
      recommendations = exec.recommendations ?? '';
    } else if (!isWork && (entries.length > 0 || allTasks.length > 0)) {
      const entrySummaries = entries.map(e => `- ${e.summary || e.text.slice(0, 100)}`).join('\n');
      const taskTitles = entries.flatMap(e => e.tasks).map(t => t.title).join(', ');
      summary = await buildGeneralSummary({ entryCount: entries.length, taskCount, done: completedTaskCount, pending: pendingTaskCount }, entrySummaries, taskTitles, periodLabel);
    }

    res.json({ period, type, label, startDate: start.toISOString().split('T')[0], endDate: date, entryCount: entries.length, taskCount, completedTaskCount, pendingTaskCount, highCount, mediumCount, lowCount, eventCount, summary, executiveSummary, insights, risks, recommendations });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
