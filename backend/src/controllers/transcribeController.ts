import { Request, Response } from 'express';
import fs from 'fs';

export const transcribe = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Audio file required' });
      return;
    }

    let audioBuffer = fs.readFileSync(req.file.path);


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
      const errBody = await response.text();
      console.error('Chimege error', response.status, errBody);
      res.status(response.status).json({ error: `Chimege API error: ${errBody}` });
      return;
    }

    const text = await response.text();
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
