import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';

const isDbReady = () => mongoose.connection.readyState === 1;

// In-memory fallback for dev/mock mode
const mockTasks: { _id: string; uid: string; title: string; due: string; status: string; priority: string; category: string }[] = [];
let mockIdCounter = 1;

export const getTasks = async (req: Request, res: Response) => {
  try {
    if (!isDbReady()) return res.json(mockTasks.filter((t) => t.uid === req.uid).reverse());
    const tasks = await Task.find({ uid: req.uid }).sort({ _id: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, due = '', priority = 'medium', category = '' } = req.body as { title: string; due?: string; priority?: 'high' | 'medium' | 'low'; category?: string };
    if (!title) return res.status(400).json({ error: 'title is required' });

    if (!isDbReady()) {
      const task = { _id: `mock-${mockIdCounter++}`, uid: req.uid, title, due, status: 'pending', priority, category };
      mockTasks.push(task);
      return res.status(201).json(task);
    }

    const task = await Task.create({ uid: req.uid, title, due, priority, category });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { status, priority, category } = req.body as { status?: string; priority?: string; category?: string };
    const update: Record<string, string> = {};
    if (status !== undefined) update.status = status;
    if (priority !== undefined) update.priority = priority;
    if (category !== undefined) update.category = category;

    if (!isDbReady()) {
      const task = mockTasks.find((t) => t._id === req.params.id && t.uid === req.uid);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      Object.assign(task, update);
      return res.json(task);
    }
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, uid: req.uid },
      update,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    if (!isDbReady()) {
      const idx = mockTasks.findIndex((t) => t._id === req.params.id && t.uid === req.uid);
      if (idx === -1) return res.status(404).json({ error: 'Task not found' });
      mockTasks.splice(idx, 1);
      return res.json({ success: true });
    }
    const task = await Task.findOneAndDelete({ _id: req.params.id, uid: req.uid });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
