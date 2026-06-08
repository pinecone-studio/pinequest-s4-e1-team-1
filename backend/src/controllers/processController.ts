import { Request, Response } from 'express';
import OpenAI from 'openai';

let openai: OpenAI | null = null;
const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

export const processEntry = async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text: string };
    if (!text) return res.status(400).json({ error: 'text is required' });

    const today = new Date().toISOString().slice(0, 10);

    const now = new Date().toISOString();

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Та Монгол хэлний текст задлан шинжлэгч.
Одоогийн цаг: ${now}
Өнөөдрийн огноо: ${today}

Хэрэглэгчийн ярианаас БҮГДИЙГ гарган JSON форматаар буцаа. Өөр текст нэмэхгүй:
{
  "tasks": [{ "title": "даалгаврын нэр", "due": "YYYY-MM-DDTHH:mm:ss эсвэл YYYY-MM-DD эсвэл хоосон" }],
  "events": [{ "title": "үйл явдлын нэр", "datetime": "ISO 8601 эсвэл хоосон мөр" }],
  "summary": "нэг өгүүлбэр хураангуй"
}

TASK гэж юу вэ — дараах БҮГДИЙГ tasks массивт нэм:
- Хийх, дуусгах, бичих, илгээх, авах, очих, залгах, шалгах зэрэг үйл хийх шаардлагатай аливаа зүйл
- Уулзалт, хурал, ярилцлага, захиалга зэрэг цагтай үйл явдал
- "хэрэгтэй", "ёстой", "болох", "мартаж болохгүй" гэх мэт үгтэй өгүүлбэр
- Тодорхой огноо, цаг дурдсан аливаа зүйл

ОГНОО, ЦАГ ДҮРМҮҮД:
- "маргааш" → өнөөдрөөс +1 өдөр
- "нөгөөдөр" → өнөөдрөөс +2 өдөр
- "дараа өдөр" → өнөөдрөөс +1 өдөр
- "энэ долоо хоногт" → ойрын ажлын өдөр
- "X цагт" гэвэл due-г YYYY-MM-DDTHH:mm:ss форматаар бич
- Зөвхөн огноо мэдэгдвэл YYYY-MM-DD форматаар бич
- Огноо тодорхойгүй бол due-г хоосон "" үлдээ`,
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
