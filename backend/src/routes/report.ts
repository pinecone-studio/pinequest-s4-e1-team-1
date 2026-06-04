import { Router } from 'express';
import { getReport } from '../controllers/reportController';

const router = Router();
router.post('/', getReport);
export default router;
