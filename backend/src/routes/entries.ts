import { Router } from 'express';
import { createEntry, getEntries } from '../controllers/entriesController';

const router = Router();
router.post('/', createEntry);
router.get('/', getEntries);
export default router;
