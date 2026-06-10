import { Router } from 'express';
import { parseDatetime } from '../controllers/parseDatetimeController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.post('/', verifyAuth, parseDatetime);
export default router;
