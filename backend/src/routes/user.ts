import { Router } from 'express';
import { deleteUserData, setUsername, getMe, searchUser } from '../controllers/userController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.get('/me', verifyAuth, getMe);
router.post('/username', verifyAuth, setUsername);
router.get('/search', verifyAuth, searchUser);
router.delete('/', verifyAuth, deleteUserData);
export default router;
