import { Router } from 'express';
import { processEntry } from '../controllers/processController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.post('/', verifyAuth, processEntry);
export default router;
