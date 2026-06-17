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

const ANALYSIS_PROMPT = `Anda adalah barber profesional papan atas. Analisis foto wajah berikut dan berikan respons dalam bahasa Indonesia:
1. Identifikasi bentuk wajah (Bulat, Oval, Kotak, Berlian, Segitiga, dll) beserta alasannya berdasarkan proporsi wajah.
2. Rekomendasikan 3-5 gaya rambut spesifik yang paling cocok dan mengapa.
3. Sebutkan 2-3 gaya rambut yang sebaiknya dihindari dan alasannya.
Gunakan bahasa profesional, modern, dan langsung ke intinya. Maksimal 3 paragraf.`;

const IMAGE_PROMPT = `Buat grafis analisis gaya rambut pakai foto ini. Tampilkan perbandingannya berdampingan untuk menunjukkan
yang cocok buat subjek. Utamakan visual dengan label singkat. Desain elegan dan minimalis, gunakan latar belakang beige netral 
dengan gaya infografis bersih dan modern. Di kiri, tambah foto gaya studio ukuran besar pakai foto yang diunggah. Di kanan, buat panel dengan 
judul dan bagian Recommended. Di atas, tampilkan 4-5 gaya rambut dengan tanda centang. Di tengah, tambah bagian Okay dengan 4-5 gaya pakai ikon netral. 
Di bawah, tambah Less Flattering dengan 4-5 gaya pakai tanda X. Di footer, tambah tips styling. Pakai subjek yang konsisten, resolusi tinggi, rasio 4:5.`;

const MAX_REQUESTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

async function refundCredit(userId: string) {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { ai_credits: 1, ai_credits_used_total: -1 },
    });
  } catch (e) {
    console.error('Credit refund failed:', e);
  }
}

export async function POST(req: Request) {
  let userId: string | null = null;
  let role: string | null = null;
  let creditDeducted = false;

  try {
    // ── Step 1: Verify JWT Auth ──────────────────────────────────────
    const token = getTokenFromCookies();

    if (!token) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    try {
      const payload = await verifyJWT(token);
      userId = (payload.userId ?? payload.sub) as string;
      role = payload.role as string;
    } catch {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // ── Step 2: Validate Request Body ───────────────────────────────
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Data gambar tidak lengkap.' }, { status: 400 });
    }

    if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
      return NextResponse.json({ error: 'Format gambar tidak valid. Gunakan JPEG atau PNG.' }, { status: 400 });
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
          return NextResponse.json({ error: 'Terlalu banyak permintaan. Tunggu 1 menit.' }, { status: 429 });
        }
      }
      rateLimitMap.set(ip, rateRecord);
    }

    // ── Step 4: [BIZ-01] Atomic Credit Check & Deduct (customer only) ────────
    // Deduct AFTER validation so we don't charge for bad requests.
    // Track creditDeducted so we can refund on any subsequent error.
    if (role !== 'admin') {
      await dbConnect();

      const userAfterDeduct = await User.findOneAndUpdate(
        { _id: userId, ai_credits: { $gt: 0 } },
        { $inc: { ai_credits: -1, ai_credits_used_total: 1 } },
        { new: true }
      );

      if (!userAfterDeduct) {
        return NextResponse.json({ error: 'NO_CREDIT' }, { status: 402 });
      }

      creditDeducted = true; // mark so catch block can refund
    }

    // ── Step 5: Run text analysis + image generation in parallel ─────
    // Use gpt-4o for fast text analysis, and gpt-image-2 direct API for image.
    // Running in parallel cuts total time significantly vs sequential calls.
    const [analysisResult, imageResult] = await Promise.all([
      // Fast text analysis with vision
      openai.chat.completions.create({
        model: 'gpt-5.2',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: ANALYSIS_PROMPT },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'high' },
              },
            ],
          },
        ],
      }),
      // Direct image generation — GPT image models return b64_json by default
      openai.images.generate({
        model: 'gpt-image-1.5',
        prompt: IMAGE_PROMPT,
        n: 1,
        size: '1024x1536',
        quality: 'high',
        output_format: 'png',
      } as any),
    ]);

    const analysisText = analysisResult.choices[0]?.message?.content || '';
    const imageB64 = imageResult.data?.[0]?.b64_json;

    if (!imageB64) {
      // Refund if image generation produced nothing
      if (creditDeducted && userId) await refundCredit(userId);
      return NextResponse.json({ error: 'Gagal menghasilkan gambar.' }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageB64}`,
      analysisText,
    });

  } catch (error: any) {
    console.error('API Error:', error);

    // ── Refund credit on ANY unhandled error ─────────────────────────
    if (creditDeducted && userId) {
      await refundCredit(userId);
      console.log(`Credit refunded for user ${userId}`);
    }

    return NextResponse.json({ error: 'Gagal membuat visualisasi. Coba lagi.' }, { status: 500 });
  }
}
