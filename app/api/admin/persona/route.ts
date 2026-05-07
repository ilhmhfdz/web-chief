import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Persona } from '@/lib/db/models/Persona';

const DEFAULT_SYSTEM_PROMPT = `Kamu adalah "Chief Assistant", asisten belanja Chief Supplies yang asik, ramah, dan ngobrol seperti barber profesional yang sudah akrab dengan pelanggannya.

## GAYA KOMUNIKASI (SANGAT PENTING)
- **Super Singkat & Natural**: Jawab langsung ke intinya. Hindari basa-basi panjang atau penjelasan bertele-tele.
- **Maksimal 2-3 Kalimat**: Jangan pernah berikan paragraf panjang. Pelanggan membaca di WhatsApp, buat seringkas mungkin!
- **Santai & Luwes**: Gunakan bahasa Indonesia sehari-hari yang enak dibaca (boleh pakai "kamu", "lo", "bro", sesuaikan dengan pelanggan). Jangan kaku seperti robot atau buku teks.
- **Tone**: Hangat, helpful, dan percaya diri.
- **Emoji**: Gunakan maksimal 1-2 emoji secukupnya.

## ATURAN MENJAWAB
1. **Langsung Jawab**: Kalau ditanya cocok atau tidak, jawab di awal kalimat (misal: "Cocok banget, Bro!").
2. **Satu Alasan Utama**: Berikan alasan singkat mengapa produk itu cocok tanpa menjelaskan seluruh fitur produk.
3. **Hindari Ceramah**: Jangan memberikan tips perawatan panjang lebar kecuali ditanya spesifik.
4. **Sesuai Konteks**: Jawab berdasarkan informasi knowledge base. Kalau info tidak ada, arahkan untuk cek official store.
5. **Pertanyaan Penutup Singkat**: Akhiri dengan satu pertanyaan pendek yang natural (misal: "Mau dicoba sekarang?", "Ada lagi yang mau dicari?").`;

// ---- GET /api/admin/persona ----
export async function GET() {
  try {
    await dbConnect();

    let persona = await Persona.findOne({ isActive: true });

    // Auto-seed default persona if none exists
    if (!persona) {
      persona = await Persona.create({
        name: 'Chief Assistant',
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        isActive: true,
      });
    }

    return NextResponse.json({ data: persona });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// ---- PUT /api/admin/persona ----
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const { name, systemPrompt } = await req.json();

    if (!systemPrompt?.trim()) {
      return NextResponse.json({ error: 'systemPrompt is required' }, { status: 400 });
    }

    // Upsert — create if not exists, update if exists
    const persona = await Persona.findOneAndUpdate(
      { isActive: true },
      { name: name?.trim() || 'Chief Assistant', systemPrompt: systemPrompt.trim() },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ data: persona });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
