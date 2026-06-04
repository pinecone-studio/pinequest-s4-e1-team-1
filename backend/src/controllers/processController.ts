import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const processEntry = async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text: string };
    if (!text) return res.status(400).json({ error: 'text is required' });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Та Монгол хэлний текст задлан шинжлэгч.
Хэрэглэгчийн ярианаас даалгавар, үйл явдал, хураангуй гарган JSON форматаар буцаа.
Заавал дараах JSON бүтэцтэй байна, өөр текст нэмэхгүй:
{
  "tasks": [{ "title": "даалгаврын нэр", "due": "хугацаа эсвэл хоосон мөр" }],
  "events": [{ "title": "үйл явдлын нэр", "datetime": "ISO 8601 эсвэл хоосон мөр" }],
  "summary": "нэг өгүүлбэр хураангуй"
}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(raw);

    res.json({
      tasks: parsed.tasks ?? [],
      events: parsed.events ?? [],
      summary: parsed.summary ?? '',
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
