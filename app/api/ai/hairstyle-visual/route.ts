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

/**
 * Builds a tightly-engineered image prompt that grounds the generation
 * in the subject's real face features extracted from the text analysis.
 * Explicit identity anchors are the key to face consistency.
 */
function buildImagePrompt(analysisText: string): string {
  // Identity anchors prepended — these instruct the model to preserve the
  // subject's real face from the uploaded reference photo before any layout rules.
  const identityRules =
    'PENTING — IDENTITAS WAJAH (wajib diikuti):\n' +
    '- Gunakan wajah, warna kulit, bentuk mata, hidung, dan rahang yang 100% IDENTIK dengan foto referensi yang diunggah\n' +
    '- Hanya ubah gaya rambut, semua fitur wajah tetap sama persis\n' +
    '- Hasil harus fotorealistis, bukan ilustrasi atau kartun\n' +
    '- JANGAN buat wajah orang lain — selalu pakai wajah dari foto yang diunggah\n\n';

  // Original layout prompt kept verbatim as requested by user
  const layoutPrompt =
    'Buat grafis analisis gaya rambut pakai foto ini. Tampilkan perbandingannya berdampingan untuk menunjukkan\n' +
    'yang cocok buat subjek. Utamakan visual dengan label singkat. Desain elegan dan minimalis, gunakan latar belakang beige netral\n' +
    'dengan gaya infografis bersih dan modern. Di kiri, tambah foto gaya studio ukuran besar pakai foto yang diunggah. Di kanan, buat panel dengan\n' +
    'judul dan bagian Recommended. Di atas, tampilkan 4-5 gaya rambut dengan tanda centang. Di tengah, tambah bagian Okay dengan 4-5 gaya pakai ikon netral.\n' +
    'Di bawah, tambah Less Flattering dengan 4-5 gaya pakai tanda X. Di footer, tambah tips styling. Pakai subjek yang konsisten, resolusi tinggi, rasio 4:5.';

  // Analysis context appended so hairstyle names in the graphic match the text analysis
  const contextSection =
    '\n\nKONTEKS ANALISIS WAJAH (gunakan nama gaya rambut dari sini):\n' +
    analysisText.slice(0, 600);

  return identityRules + layoutPrompt + contextSection;
}

export async function POST(req: Request) {
  let userId: string | null = null;
  let role: string | null = null;
  let creditDeducted = false;

  try {
    // Step 1: Verify JWT Auth
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

    // Step 2: Validate Request Body
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Data gambar tidak lengkap.' }, { status: 400 });
    }

    if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
      return NextResponse.json({ error: 'Format gambar tidak valid. Gunakan JPEG atau PNG.' }, { status: 400 });
    }

    // Step 3: IP Rate Limiting (secondary protection)
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

    // Step 4: Atomic Credit Check and Deduct (customer only)
    // Deduct AFTER validation so we don't charge for bad requests.
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

      creditDeducted = true;
    }

    // Step 5: Text analysis FIRST (sequential, not parallel)
    // Run analysis first so the recommended hairstyle names can be
    // injected into the image prompt for better relevance and consistency.
    const analysisResult = await openai.chat.completions.create({
      model: 'gpt-5.2',
      max_completion_tokens: 500,
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
    });

    const analysisText = analysisResult.choices[0]?.message?.content || '';

    // Step 6: Image editing — feed the real photo back to the model
    // CRITICAL FIX: The previous images.generate() call never received the
    // user's uploaded photo, so the model invented a random face.
    // images.edit() passes the actual photo so the model can preserve the
    // subject's real facial identity while changing only the hairstyle.
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const { toFile } = await import('openai');
    const imageFile = await toFile(imageBuffer, 'face.png', { type: 'image/png' });

    const imageResult = await (openai.images.edit as any)({
      model: 'gpt-image-2',
      image: imageFile,
      prompt: buildImagePrompt(analysisText),
      n: 1,
      size: '1024x1536',
    });

    const imageB64 = imageResult.data?.[0]?.b64_json;

    if (!imageB64) {
      if (creditDeducted && userId) await refundCredit(userId);
      return NextResponse.json({ error: 'Gagal menghasilkan gambar.' }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageB64}`,
      analysisText,
    });

  } catch (error: any) {
    console.error('API Error:', error);

    if (creditDeducted && userId) {
      await refundCredit(userId);
      console.log(`Credit refunded for user ${userId}`);
    }

    return NextResponse.json({ error: 'Gagal membuat visualisasi. Coba lagi.' }, { status: 500 });
  }
}
