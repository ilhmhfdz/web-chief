import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple in-memory rate limiter (IP -> { count, lastReset })
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 5;      // Max 5 requests per minute per IP

export async function POST(req: Request) {
  try {
    // ---- Rate Limiting Logic ----
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const now = Date.now();
    const rateLimitData = rateLimitMap.get(ip) ?? { count: 0, lastReset: now };

    if (now - rateLimitData.lastReset > RATE_LIMIT_WINDOW_MS) {
      rateLimitData.count = 1;
      rateLimitData.lastReset = now;
    } else {
      rateLimitData.count++;
    }

    rateLimitMap.set(ip, rateLimitData);

    if (rateLimitData.count > MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.' },
        { status: 429 }
      );
    }
    // ---- End Rate Limiting ----

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt tidak valid.' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Anda adalah pakar grooming pria premium untuk Chief Supplies Indonesia. 
Tugas Anda adalah memberikan analisis gaya rambut dan tips grooming khusus untuk pria dengan fokus pada karakteristik dan kontur wajah pria Indonesia (contoh: jenis rambut tebal/ikal/lurus Asia, struktur rahang, pipi, atau dahi khas Asia Tenggara).
Berikan jawaban dalam FORMAT JSON dengan struktur persis seperti berikut:
{
  "recommendation": "Analisis personal (2-3 paragraf pendek) kenapa bentuk wajah ini memiliki karakteristik tertentu dan gaya rambut apa yang cocok",
  "quickTips": ["Tip grooming 1", "Tip grooming 2", "Tip grooming 3"],
  "recommendedStyles": ["Nama Gaya 1", "Nama Gaya 2", "Nama Gaya 3"]
}
Hindari teks default yang kaku, jadikan ini terasa personal dan profesional.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { recommendation: content };
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[AI Recommend]', errorMessage);
    return NextResponse.json(
      { error: 'Gagal menghubungi AI. Periksa API key dan coba lagi.' },
      { status: 500 }
    );
  }
}
