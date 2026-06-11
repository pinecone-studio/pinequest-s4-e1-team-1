import { Request, Response } from 'express';
import FriendRequest from '../models/FriendRequest';
import User from '../models/User';
import Task from '../models/Task';
import Notification from '../models/Notification';
import { sendExpoPush } from '../utils/pushNotification';

// Send friend request by username
export const sendRequest = async (req: Request, res: Response) => {
  try {
    const { username } = req.body as { username: string };
    const target = await User.findOne({ username: username?.toLowerCase() });
    if (!target) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    if (target.uid === req.uid) return res.status(400).json({ error: 'Өөртөө хүсэлт илгээх боломжгүй' });

    const existing = await FriendRequest.findOne({
      $or: [
        { fromUid: req.uid, toUid: target.uid },
        { fromUid: target.uid, toUid: req.uid },
      ],
    });
    if (existing) {
      if (existing.status === 'accepted') return res.status(409).json({ error: 'Аль хэдийн найзууд байна' });
      if (existing.status === 'pending') return res.status(409).json({ error: 'Хүсэлт аль хэдийн явуулсан байна' });
      // rejected → allow re-send
      existing.status = 'pending';
      existing.fromUid = req.uid;
      existing.toUid = target.uid;
      await existing.save();
      return res.json({ success: true });
    }

    await FriendRequest.create({ fromUid: req.uid, toUid: target.uid });

    const sender = await User.findOne({ uid: req.uid });
    const fromUsername = sender?.username ?? req.uid;
    await Notification.create({ uid: target.uid, type: 'friend_request', fromUsername });
    if (target.expoPushToken) {
      await sendExpoPush(target.expoPushToken, 'Найзын хүсэлт', `${fromUsername} найзын хүсэлт илгээлээ`);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// Incoming pending requests
export const getRequests = async (req: Request, res: Response) => {
  try {
    const requests = await FriendRequest.find({ toUid: req.uid, status: 'pending' });
    const uids = requests.map(r => r.fromUid);
    const users = await User.find({ uid: { $in: uids } });
    const userMap = Object.fromEntries(users.map(u => [u.uid, u.username]));
    res.json(requests.map(r => ({
      id: r._id,
      fromUid: r.fromUid,
      username: userMap[r.fromUid] ?? r.fromUid,
    })));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// Accept
export const acceptRequest = async (req: Request, res: Response) => {
  try {
    const request = await FriendRequest.findOneAndUpdate(
      { _id: req.params.id, toUid: req.uid, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// Reject
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    await FriendRequest.findOneAndUpdate(
      { _id: req.params.id, toUid: req.uid, status: 'pending' },
      { status: 'rejected' }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// List accepted friends
export const getFriends = async (req: Request, res: Response) => {
  try {
    const accepted = await FriendRequest.find({
      $or: [{ fromUid: req.uid }, { toUid: req.uid }],
      status: 'accepted',
    });
    const friendUids = accepted.map(r => r.fromUid === req.uid ? r.toUid : r.fromUid);
    const users = await User.find({ uid: { $in: friendUids } });
    res.json(users.map(u => ({ uid: u.uid, username: u.username })));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// Remove friend
export const removeFriend = async (req: Request, res: Response) => {
  try {
    await FriendRequest.deleteOne({
      $or: [
        { fromUid: req.uid, toUid: req.params.friendUid },
        { fromUid: req.params.friendUid, toUid: req.uid },
      ],
      status: 'accepted',
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// Friend's availability calendar (privacy-safe: no task names, only counts + times)
export const getFriendCalendar = async (req: Request, res: Response) => {
  try {
    const { friendUid } = req.params;
    const { month } = req.query as { month?: string }; // YYYY-MM

    // Verify friendship
    const friendship = await FriendRequest.findOne({
      $or: [
        { fromUid: req.uid, toUid: friendUid },
        { fromUid: friendUid, toUid: req.uid },
      ],
      status: 'accepted',
    });
    if (!friendship) return res.status(403).json({ error: 'Найзууд биш байна' });

    const friendFilter: Record<string, unknown> = { uid: friendUid, sharedBy: null };
    if (month) friendFilter.due = { $regex: `^${month}` };

    const sharedFilter: Record<string, unknown> = { uid: req.uid, sharedBy: friendUid };
    if (month) sharedFilter.due = { $regex: `^${month}` };

    const [tasks, sharedTasks] = await Promise.all([
      Task.find(friendFilter).select('due status'),
      Task.find(sharedFilter).select('due title'),
    ]);

    const calendar: Record<string, { taskCount: number; busyTimes: string[]; sharedTasks: string[] }> = {};
    for (const task of tasks) {
      if (!task.due) continue;
      const dateKey = task.due.slice(0, 10);
      if (!calendar[dateKey]) calendar[dateKey] = { taskCount: 0, busyTimes: [], sharedTasks: [] };
      calendar[dateKey].taskCount++;
      if (task.due.includes('T')) {
        const time = task.due.slice(11, 16);
        if (time) calendar[dateKey].busyTimes.push(time);
      }
    }
    for (const task of sharedTasks) {
      if (!task.due) continue;
      const dateKey = task.due.slice(0, 10);
      if (!calendar[dateKey]) calendar[dateKey] = { taskCount: 0, busyTimes: [], sharedTasks: [] };
      calendar[dateKey].sharedTasks.push(task.title);
    }

    res.json(calendar);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
