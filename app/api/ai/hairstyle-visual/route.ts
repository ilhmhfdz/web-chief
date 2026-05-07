import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyJWT } from '@/lib/auth/jwt';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';

// Vercel Pro Configuration: Increase timeout for long-running AI analysis
export const maxDuration = 300; // 5 minutes (max for Vercel Pro)
export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FIXED_PROMPT = `Using the uploaded portrait as a FACE REFERENCE, Create a hairstyle analysis graphic using this portrait. Show side-by-side hairstyles comparisons to highlight which hairstyles suit the subject best. Make it visual-first, with short labels only and add little teks, made by Chief.

Selain memanggil tool untuk membuat gambar di atas, berikan juga analisis teks (maksimal 2-3 paragraf) dalam bahasa Indonesia secara langsung:
1. Identifikasi bentuk wajah subjek (misal: Bulat, Oval, Kotak, dll) beserta alasannya.
2. Rekomendasi gaya rambut spesifik yang paling cocok.
3. Gaya rambut yang sebaiknya dihindari dan alasannya.
Pastikan bahasa Anda profesional, modern, dan langsung ke intinya layaknya seorang barber papan atas.`;

const MAX_REQUESTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export async function POST(req: Request) {
  try {
    // ── Step 1: Verify JWT Auth ──────────────────────────────────────
    const token = req.headers
      .get('cookie')
      ?.split('; ')
      .find((c) => c.startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    let userId: string;
    let role: string;
    try {
      const payload = await verifyJWT(token);
      userId = payload.userId as string;
      role = payload.role as string;
    } catch {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // ── Step 2: Credit Check (customer only, admin bypasses) ─────────
    if (role !== 'admin') {
      await dbConnect();
      const user = await User.findById(userId).select('ai_credits');

      if (!user || user.ai_credits <= 0) {
        return NextResponse.json({ error: 'NO_CREDIT' }, { status: 402 });
      }

      // Atomic deduct — prevent race condition on double-click
      await User.findByIdAndUpdate(userId, {
        $inc: { ai_credits: -1, ai_credits_used_total: 1 },
      });
    }

    // ── Step 3: IP Rate Limiting (secondary protection) ──────────────
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    if (ip !== 'unknown') {
      const windowStart = now - RATE_LIMIT_WINDOW_MS;
      const rateRecord = rateLimitMap.get(ip) || { count: 0, timestamp: now };

      if (rateRecord.timestamp < windowStart) {
        rateRecord.count = 1;
        rateRecord.timestamp = now;
      } else {
        rateRecord.count += 1;
        if (rateRecord.count > MAX_REQUESTS_PER_WINDOW) {
          // Refund credit if rate-limited (customer only)
          if (role !== 'admin') {
            await User.findByIdAndUpdate(userId, {
              $inc: { ai_credits: 1, ai_credits_used_total: -1 },
            });
          }
          return NextResponse.json({ error: 'Terlalu banyak permintaan. Tunggu 1 menit.' }, { status: 429 });
        }
      }
      rateLimitMap.set(ip, rateRecord);
    }

    // ── Step 4: Validate Request Body ───────────────────────────────
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Data gambar tidak lengkap.' }, { status: 400 });
    }

    if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
      return NextResponse.json({ error: 'Format gambar tidak valid. Gunakan JPEG atau PNG.' }, { status: 400 });
    }

    // ── Step 5: Generate AI Visual ───────────────────────────────────
    const response = await (openai as any).responses.create({
      model: 'gpt-5.2',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: FIXED_PROMPT },
            {
              type: 'input_image',
              image_url: `data:${mimeType};base64,${imageBase64}`,
            },
          ],
        },
      ],
      tools: [
        {
          type: 'image_generation',
          model: 'gpt-image-1.5',
          quality: 'high',
          size: '1536x1024',
          input_fidelity: 'high',
        },
      ],
    });

    const imageOutput = response.output
      ?.filter((o: any) => o.type === 'image_generation_call')
      ?.map((o: any) => o.result) || [];

    const textOutput = response.output_text || '';

    if (imageOutput.length > 0) {
      return NextResponse.json({
        imageUrl: `data:image/png;base64,${imageOutput[0]}`,
        analysisText: textOutput,
      });
    }

    return NextResponse.json({ error: 'No image generated' }, { status: 500 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Gagal membuat visualisasi. Coba lagi.' }, { status: 500 });
  }
}
