import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyJWT } from '@/lib/auth/jwt';
import { getTokenFromCookies } from '@/lib/auth/getToken';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';

// Vercel Pro Configuration: Increase timeout for long-running AI analysis
export const maxDuration = 300; // 5 minutes (max for Vercel Pro)
export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FIXED_PROMPT = `Buat grafis analisis gaya rambut pakai foto ini. Tampilkan perbandingannya berdampingan untuk menunjukkan yang cocok buat subjek. Utamakan visual dengan label singkat. Desain elegan dan minimalis, gunakan latar belakang beige netral dengan gaya infografis bersih dan modern. Di kiri, tambah foto gaya studio ukuran besar pakai foto yang diunggah. Di kanan, buat panel dengan judul dan bagian Recommended. Di atas, tampilkan 4-5 gaya rambut dengan tanda centang. Di tengah, tambah bagian Okay dengan 4-5 gaya pakai ikon netral. Di bawah, tambah Less Flattering dengan 4-5 gaya pakai tanda X. Di footer, tambah tips styling. Pakai subjek yang konsisten, resolusi tinggi, rasio 4:5`;

const MAX_REQUESTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export async function POST(req: Request) {
  try {
    // ── Step 1: Verify JWT Auth ──────────────────────────────────────
    // [SEC-06] Use standardized cookie helper instead of manual string-split
    const token = getTokenFromCookies();

    if (!token) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    let userId: string;
    let role: string;
    try {
      const payload = await verifyJWT(token);
      userId = (payload.userId ?? payload.sub) as string;
      role = payload.role as string;
    } catch {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // ── Step 2: [BIZ-01] Atomic Credit Check & Deduct (customer only) ────────
    // Single findOneAndUpdate with condition prevents race condition:
    // Two simultaneous requests cannot both pass — only one will find ai_credits > 0.
    if (role !== 'admin') {
      await dbConnect();

      const userAfterDeduct = await User.findOneAndUpdate(
        { _id: userId, ai_credits: { $gt: 0 } },  // Condition: must have credit
        { $inc: { ai_credits: -1, ai_credits_used_total: 1 } },
        { new: true }
      );

      if (!userAfterDeduct) {
        return NextResponse.json({ error: 'NO_CREDIT' }, { status: 402 });
      }
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
