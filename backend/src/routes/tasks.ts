import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/tasksController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.get('/', verifyAuth, getTasks);
router.post('/', verifyAuth, createTask);
router.patch('/:id', verifyAuth, updateTask);
router.delete('/:id', verifyAuth, deleteTask);
export default router;
