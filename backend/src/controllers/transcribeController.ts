import { Request, Response } from 'express';
import fs from 'fs';

export const transcribe = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Audio file required' });
      return;
    }

    let audioBuffer = fs.readFileSync(req.file.path);

    if (audioBuffer.subarray(0, 4).toString('ascii') === 'RIFF') {
      let offset = 12;
      while (offset < audioBuffer.length - 8) {
        const chunkId = audioBuffer.subarray(offset, offset + 4).toString('ascii');
        const chunkSize = audioBuffer.readUInt32LE(offset + 4);
        if (chunkId === 'data') { audioBuffer = audioBuffer.subarray(offset + 8); break; }
        offset += 8 + chunkSize;
      }
    }

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
