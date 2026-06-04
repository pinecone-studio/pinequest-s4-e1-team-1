import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Entry from '../models/Entry';
import Task from '../models/Task';

const isDbReady = () => mongoose.connection.readyState === 1;

export const createEntry = async (req: Request, res: Response) => {
  try {
    const { text, tasks = [], events = [], summary = '' } = req.body as {
      text: string;
      tasks: { title: string; due: string }[];
      events: { title: string; datetime: string }[];
      summary: string;
    };

    if (!text) return res.status(400).json({ error: 'text is required' });

    if (!isDbReady()) {
      return res.status(201).json({ _id: 'mock-id', text, tasks, events, summary, createdAt: new Date() });
    }

    const entry = await Entry.create({ text, tasks, events, summary });

    if (tasks.length) {
      await Task.insertMany(
        tasks.map((t) => ({ title: t.title, due: t.due, entryId: entry._id }))
      );
    }

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getEntries = async (_req: Request, res: Response) => {
  try {
    if (!isDbReady()) {
      return res.json([]);
    }
    const entries = await Entry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
