import { Request, Response } from 'express';

export const transcribe = async (req: Request, res: Response) => {
  try {
    // TODO: replace with real Chimege / Whisper API call using req.file
    res.json({ text: 'өнөөдөр багийн хуралд орлоо, маргааш демо бэлдэх хэрэгтэй' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
