import { Request, Response } from 'express';
import fs from 'fs';

export const transcribe = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Audio file required' });
      return;
    }

    const audioBuffer = fs.readFileSync(req.file.path);

    const response = await fetch('https://api.chimege.com/v1.2/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'punctuate': 'true',
        'token': process.env.CHIMEGE_API_KEY ?? '',
      },
      body: audioBuffer,
    });

    fs.unlinkSync(req.file.path);

    if (!response.ok) {
      res.status(response.status).json({ error: 'Chimege API error' });
      return;
    }

    const text = await response.text();
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
