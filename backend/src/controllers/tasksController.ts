import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';

const isDbReady = () => mongoose.connection.readyState === 1;

export const getTasks = async (_req: Request, res: Response) => {
  try {
    if (!isDbReady()) return res.json([]);
    const tasks = await Task.find().sort({ _id: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
