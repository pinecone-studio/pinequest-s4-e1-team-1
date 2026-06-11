import { Request, Response } from 'express';
import Task from '../models/Task';
import Entry from '../models/Entry';
import User from '../models/User';
import FriendRequest from '../models/FriendRequest';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export const setUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.body as { username: string };
    if (!username || !USERNAME_RE.test(username.toLowerCase())) {
      return res.status(400).json({ error: 'Username 3-20 тэмдэгт, зөвхөн a-z, 0-9, _ байх ёстой' });
    }
    const taken = await User.findOne({ username: username.toLowerCase() });
    if (taken && taken.uid !== req.uid) {
      return res.status(409).json({ error: 'Username аль хэдийн ашиглагдаж байна' });
    }
    const user = await User.findOneAndUpdate(
      { uid: req.uid },
      { uid: req.uid, username: username.toLowerCase() },
      { upsert: true, new: true }
    );
    res.json({ username: user.username });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    res.json({ username: user?.username ?? null });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const searchUser = async (req: Request, res: Response) => {
  try {
    const q = (req.query.username as string ?? '').toLowerCase().trim();
    if (!q) return res.json([]);
    const users = await User.find({
      username: { $regex: `^${q}`, $options: 'i' },
      uid: { $ne: req.uid },
    }).limit(5).select('uid username');
    res.json(users.map(u => ({ uid: u.uid, username: u.username })));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteUserData = async (req: Request, res: Response) => {
  try {
    await Promise.all([
      Task.deleteMany({ uid: req.uid }),
      Entry.deleteMany({ uid: req.uid }),
      User.deleteOne({ uid: req.uid }),
      FriendRequest.deleteMany({ $or: [{ fromUid: req.uid }, { toUid: req.uid }] }),
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
