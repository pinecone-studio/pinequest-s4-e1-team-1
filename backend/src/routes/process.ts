import { Router } from 'express';
import { process } from '../controllers/processController';

const router = Router();
router.post('/', process);
export default router;
