import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Rate limit ────────────────────────────────────────────────────────────────
const RATE_LIMIT = 5;          // max requests
const RATE_WINDOW_MS = 60_000; // per 60 seconds
const rateMap = new Map<string, { count: number; ts: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = rateMap.get(ip) ?? { count: 0, ts: now };
  if (now - rec.ts > RATE_WINDOW_MS) {
    rec.count = 1; rec.ts = now;
  } else {
    rec.count += 1;
  }
  rateMap.set(ip, rec);
  return rec.count > RATE_LIMIT;
}

const SYSTEM_PROMPT = `
You are an expert barber and men's grooming specialist at Chief Barber & Supplies, a premium barbershop.
A customer is describing their hair condition, hair type, and perhaps some complaints.
Your task is to recommend 1-2 suitable haircuts and provide a brief styling tip.

Rules for response:
- Output in Indonesian language (Bahasa Indonesia).
- Tone must be professional, elegant, minimalist, and premium.
- Be concise. Avoid long-winded explanations. Provide the recommendation straight to the point.
- Do NOT use markdown bolding excessively, keep it clean.
- Format the response as a single, elegant paragraph or max 2 short paragraphs.
`.trim();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (ip !== 'unknown' && isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.' },
      { status: 429 }
    );
  }

  let textInput: string;
  try {
    const body = await req.json();
    textInput = (body.textInput ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid.' }, { status: 400 });
  }

  if (!textInput || textInput.length < 5) {
    return NextResponse.json(
      { error: 'Ceritakan kondisi atau tipe rambut Anda minimal 5 karakter.' },
      { status: 400 }
    );
  }

  if (textInput.length > 300) {
    return NextResponse.json(
      { error: 'Deskripsi terlalu panjang. Maksimal 300 karakter.' },
      { status: 400 }
    );
  }

  try {
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Kondisi/Tipe Rambut: "${textInput}"` },
      ],
    });

    const recommendation = gptResponse.choices[0]?.message?.content?.trim() ?? 'Maaf, saya tidak dapat menganalisis gaya rambut saat ini. Silakan coba lagi.';

    return NextResponse.json({ recommendation });
  } catch (error: any) {
    console.error('[haircut-advisor] Error:', error);
    return NextResponse.json(
      { error: 'Gagal menganalisis kondisi rambut. Coba lagi.' },
      { status: 500 }
    );
  }
}
