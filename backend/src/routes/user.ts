import { Router } from 'express';
import { deleteUserData } from '../controllers/userController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.delete('/', verifyAuth, deleteUserData);
export default router;
