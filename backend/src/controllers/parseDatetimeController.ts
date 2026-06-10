import { Request, Response } from 'express';
import OpenAI from 'openai';

let openai: OpenAI | null = null;
const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

export const parseDatetime = async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text: string };
    if (!text) return res.status(400).json({ error: 'text required' });

    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Одоогийн цаг: ${now}. Өнөөдрийн огноо: ${today}.
Хэрэглэгчийн хэлсэн огноо/цагийг задлан JSON буцаа. Өөр текст нэмэхгүй:
{ "due": "YYYY-MM-DDTHH:mm:ss эсвэл YYYY-MM-DD эсвэл хоосон мөр" }
- Зөвхөн огноо мэдэгдвэл: YYYY-MM-DD
- Огноо + цаг хоёул мэдэгдвэл: YYYY-MM-DDTHH:mm:ss
- "маргааш" = өнөөдрөөс +1 өдөр
- "нөгөөдөр" = өнөөдрөөс +2 өдөр
- "энэ долоо хоногт" = ойрын ажлын өдөр
- Тодорхойгүй бол: ""`,
        },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0].message.content ?? '{}');
    res.json({ due: parsed.due ?? '' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
