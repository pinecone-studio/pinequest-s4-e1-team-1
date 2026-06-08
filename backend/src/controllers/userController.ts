import { Request, Response } from 'express';
import Task from '../models/Task';
import Entry from '../models/Entry';

export const deleteUserData = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).uid as string;
    await Promise.all([
      Task.deleteMany({ uid }),
      Entry.deleteMany({ uid }),
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
