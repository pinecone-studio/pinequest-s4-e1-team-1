import { Request, Response } from 'express';
import Notification from '../models/Notification';
import User from '../models/User';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notes = await Notification.find({ uid: req.uid, read: false }).sort({ createdAt: -1 }).limit(20);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const markAllRead = async (req: Request, res: Response) => {
  try {
    await Notification.updateMany({ uid: req.uid, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const savePushToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body as { token: string };
    if (!token) return res.status(400).json({ error: 'token required' });
    await User.findOneAndUpdate({ uid: req.uid }, { expoPushToken: token });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
