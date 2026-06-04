import { Request, Response, NextFunction } from 'express';
import admin from '../firebaseAdmin';

export async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    req.uid = 'dev-user';
    req.email = 'dev@local';
    return next();
  }
  if (!admin.apps.length) {
    return res.status(503).json({ error: 'Auth not configured (missing Firebase credentials)' });
  }
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = auth.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email ?? '';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
