import { Router } from 'express';
import upload from '../middleware/upload';
import { transcribe } from '../controllers/transcribeController';

const router = Router();
router.post('/', upload.single('audio'), transcribe);
export default router;
