import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Entry from '../models/Entry';

const isDbReady = () => mongoose.connection.readyState === 1;

export const getReport = async (req: Request, res: Response) => {
  try {
    const { date } = req.body as { date: string };
    if (!date) return res.status(400).json({ error: 'date is required' });

    if (!isDbReady()) {
      return res.json({
        date,
        entryCount: 0,
        taskCount: 0,
        eventCount: 0,
        summary: `${date}-нд бүртгэл олдсонгүй (mock mode).`,
        entries: [],
      });
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const entries = await Entry.find({ createdAt: { $gte: start, $lte: end } });

    res.json({
      date,
      entryCount: entries.length,
      taskCount: entries.reduce((acc, e) => acc + e.tasks.length, 0),
      eventCount: entries.reduce((acc, e) => acc + e.events.length, 0),
      summary: entries.length
        ? `${date}-ны тайлан: Нийт ${entries.length} бүртгэл, ${entries.reduce((a, e) => a + e.tasks.length, 0)} даалгавар.`
        : `${date}-нд бүртгэл олдсонгүй.`,
      entries,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
