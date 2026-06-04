import { Router } from 'express';
import { getTasks } from '../controllers/tasksController';

const router = Router();
router.get('/', getTasks);
export default router;
