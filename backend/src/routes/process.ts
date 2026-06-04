import { Router } from 'express';
import { processEntry } from '../controllers/processController';

const router = Router();
router.post('/', processEntry);
export default router;
