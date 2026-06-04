import { Router } from 'express';
import upload from '../middleware/upload';
import { transcribe } from '../controllers/transcribeController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.post('/', verifyAuth, upload.single('audio'), transcribe);
export default router;
