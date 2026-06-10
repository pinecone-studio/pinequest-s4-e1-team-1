import { Router } from 'express';
import {
  sendRequest, getRequests, acceptRequest,
  rejectRequest, getFriends, removeFriend, getFriendCalendar,
} from '../controllers/friendsController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.get('/',                          verifyAuth, getFriends);
router.post('/request',                  verifyAuth, sendRequest);
router.get('/requests',                  verifyAuth, getRequests);
router.post('/accept/:id',               verifyAuth, acceptRequest);
router.post('/reject/:id',               verifyAuth, rejectRequest);
router.delete('/:friendUid',             verifyAuth, removeFriend);
router.get('/:friendUid/calendar',       verifyAuth, getFriendCalendar);
export default router;
