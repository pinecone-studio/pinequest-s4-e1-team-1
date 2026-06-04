import { Request, Response } from 'express';

export const process = async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text: string };
    if (!text) return res.status(400).json({ error: 'text is required' });

    // TODO: replace with real OpenAI / NLP API call using text
    res.json({
      tasks: [
        { title: 'Демо бэлдэх', due: 'маргааш' },
        { title: 'Багийн хурал тэмдэглэл боловсруулах', due: 'өнөөдөр' },
      ],
      events: [
        { title: 'Багийн хурал', datetime: new Date().toISOString() },
      ],
      summary: 'Өнөөдөр багийн хурал болсон. Маргааш демо бэлдэх шаардлагатай.',
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
