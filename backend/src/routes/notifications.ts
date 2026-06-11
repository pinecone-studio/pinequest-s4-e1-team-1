import { Router } from 'express';
import { getNotifications, markAllRead, savePushToken } from '../controllers/notificationsController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.get('/',         verifyAuth, getNotifications);
router.post('/read',    verifyAuth, markAllRead);
router.post('/token',   verifyAuth, savePushToken);
export default router;
