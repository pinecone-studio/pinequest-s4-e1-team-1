import { Router } from 'express';
import { getReport } from '../controllers/reportController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.post('/', verifyAuth, getReport);
export default router;
