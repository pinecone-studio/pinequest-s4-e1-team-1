import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';
import FriendRequest from '../models/FriendRequest';

const isDbReady = () => mongoose.connection.readyState === 1;

// In-memory fallback for dev/mock mode
const mockTasks: { _id: string; uid: string; title: string; due: string; status: string; priority: string; category: string }[] = [];
let mockIdCounter = 1;

export const getTasks = async (req: Request, res: Response) => {
  try {
    if (!isDbReady()) return res.json(mockTasks.filter((t) => t.uid === req.uid).reverse());
    const tasks = await Task.find({ uid: req.uid, sharedBy: null }).sort({ _id: -1 });
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
    const { status, priority, category, title, due } = req.body as { status?: string; priority?: string; category?: string; title?: string; due?: string };
    const update: Record<string, string> = {};
    if (title    !== undefined) update.title    = title;
    if (status   !== undefined) update.status   = status;
    if (priority !== undefined) update.priority = priority;
    if (category !== undefined) update.category = category;
    if (due      !== undefined) update.due      = due;

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

export const shareTask = async (req: Request, res: Response) => {
  try {
    const { toUid } = req.body as { toUid: string };
    if (!toUid) return res.status(400).json({ error: 'toUid is required' });

    const friendship = await FriendRequest.findOne({
      $or: [{ fromUid: req.uid, toUid }, { fromUid: toUid, toUid: req.uid }],
      status: 'accepted',
    });
    if (!friendship) return res.status(403).json({ error: 'Найзууд биш байна' });

    const task = await Task.findOne({ _id: req.params.id, uid: req.uid });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await Task.create({ uid: toUid, title: task.title, due: task.due, priority: task.priority, category: task.category, sharedBy: req.uid });
    res.json({ success: true });
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
