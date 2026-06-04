import { Router } from 'express';
import { createEntry, getEntries } from '../controllers/entriesController';
import { verifyAuth } from '../middleware/verifyAuth';

const router = Router();
router.post('/', verifyAuth, createEntry);
router.get('/', verifyAuth, getEntries);
export default router;
