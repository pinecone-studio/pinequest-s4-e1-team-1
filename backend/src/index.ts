import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';

import transcribeRouter from './routes/transcribe';
import processRouter from './routes/process';
import entriesRouter from './routes/entries';
import tasksRouter from './routes/tasks';
import reportRouter from './routes/report';
import userRouter from './routes/user';
import parseDatetimeRouter from './routes/parse-datetime';

const app = express();
const PORT = process.env.PORT || 4000;

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => { console.log(`${req.method} ${req.path} auth:${req.headers.authorization ? 'yes' : 'NO'}`); next(); });

app.use('/api/transcribe', transcribeRouter);
app.use('/api/process', processRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/report', reportRouter);
app.use('/api/user', userRouter);
app.use('/api/parse-datetime', parseDatetimeRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || '';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    console.log('Starting server without DB (mock mode)...');
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (no DB)`));
  });
