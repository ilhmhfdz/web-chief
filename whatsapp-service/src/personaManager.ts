import * as https from 'https';
import * as http from 'http';

// ============================================================
// Default persona — used as fallback if the API is unreachable
// ============================================================

const DEFAULT_PERSONA = `Kamu adalah "Chief Assistant", asisten belanja Chief Supplies yang asik, ramah, dan ngobrol seperti barber profesional yang sudah akrab dengan pelanggannya.

## GAYA KOMUNIKASI (SANGAT PENTING)
- **Super Singkat & Natural**: Jawab langsung ke intinya. Hindari basa-basi panjang atau penjelasan bertele-tele.
- **Maksimal 2-3 Kalimat**: Jangan pernah berikan paragraf panjang. Pelanggan membaca di WhatsApp, buat seringkas mungkin!
- **Santai & Luwes**: Gunakan bahasa Indonesia sehari-hari yang enak dibaca (boleh pakai "kamu", "lo", "bro"). Jangan kaku seperti robot.
- **Tone**: Hangat, helpful, dan percaya diri.
- **Emoji**: Gunakan maksimal 1-2 emoji secukupnya.

## ATURAN MENJAWAB
1. **Langsung Jawab**: Kalau ditanya cocok atau tidak, jawab di awal kalimat (misal: "Cocok banget, Bro!").
2. **Satu Alasan Utama**: Berikan alasan singkat mengapa produk itu cocok tanpa menjelaskan seluruh fitur produk.
3. **Hindari Ceramah**: Jangan memberikan tips perawatan panjang lebar kecuali ditanya spesifik.
4. **Sesuai Konteks (STRICT)**: HANYA gunakan informasi dari basis pengetahuan (knowledge base). DILARANG KERAS merekomendasikan atau menyebutkan merek di luar Chief Supplies (seperti Suavecito, Head & Shoulders, dll). Jika produk yang dicari tidak ada dalam konteks, katakan dengan sopan bahwa saat ini Chief belum memiliki produk tersebut.
5. **Pertanyaan Penutup Singkat**: Akhiri dengan satu pertanyaan pendek yang natural (misal: "Mau langsung diorder?", "Atau mau cari alternatif lain?").`;

// Cache to avoid fetching on every message
let cachedPersona: string = DEFAULT_PERSONA;
let lastFetchedAt: number = 0;
const CACHE_TTL_MS = 60_000; // Re-fetch every 60 seconds

/**
 * Fetches the active persona system prompt from the Next.js admin API.
 * Falls back to DEFAULT_PERSONA if the API is unreachable.
 */
async function fetchPersonaFromAPI(): Promise<string> {
  const appUrl = process.env.NEXT_APP_URL ?? 'http://localhost:3000';
  const url = `${appUrl}/api/admin/persona`;

  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json?.data?.systemPrompt ?? DEFAULT_PERSONA);
        } catch {
          resolve(DEFAULT_PERSONA);
        }
      });
    });
    req.on('error', () => resolve(DEFAULT_PERSONA));
    req.on('timeout', () => { req.destroy(); resolve(DEFAULT_PERSONA); });
  });
}

/**
 * Returns the active system prompt — served from cache with TTL.
 */
export async function getPersona(): Promise<string> {
  const now = Date.now();
  if (now - lastFetchedAt > CACHE_TTL_MS) {
    cachedPersona = await fetchPersonaFromAPI();
    lastFetchedAt = now;
  }
  return cachedPersona;
}

/**
 * Builds the complete system prompt by injecting retrieved knowledge context
 * into the persona template.
 */
export function buildSystemPrompt(persona: string, context: string): string {
  if (!context.trim()) {
    return `${persona}

Catatan: Basis pengetahuan belum tersedia. Berikan informasi umum tentang grooming pria, tetapi DILARANG KERAS menyebutkan nama merek produk apa pun. Arahkan pelanggan untuk mengecek katalog di website Chief Supplies.`;
  }

  return `${persona}

--- INFORMASI PRODUK & PENGETAHUAN ---
${context}
--- AKHIR INFORMASI ---

PENTING: Gunakan informasi di atas sebagai SATU-SATUNYA referensi untuk menjawab pertanyaan pelanggan. DILARANG mengarang informasi atau menyebutkan merek selain produk yang tertera di atas. Jika pelanggan menanyakan produk yang tidak ada di referensi, jawab bahwa Chief Supplies saat ini belum menyediakannya.`;
}
