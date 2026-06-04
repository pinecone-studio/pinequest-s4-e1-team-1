import { Router } from 'express';
import { getTasks } from '../controllers/tasksController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.get('/', verifyAuth, getTasks);
export default router;
