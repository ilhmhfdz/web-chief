import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ | Chief Supplies',
  description: 'Pertanyaan yang sering ditanyakan tentang Chief Supplies — pengiriman, produk, pembayaran, dan AI recommendation.',
};

const FAQS = [
  {
    category: 'Produk',
    items: [
      { q: 'Apakah semua produk original?', a: '100% produk original bergaransi resmi dari brand grooming terpilih. Kami tidak menjual produk palsu (KW) dalam bentuk apapun.' },
      { q: 'Bagaimana cara mengetahui produk yang cocok untuk saya?', a: 'Gunakan fitur AI Recommendation kami! Upload atau ambil foto wajah Anda, dan AI kami akan menganalisis bentuk wajah serta merekomendasikan produk dan gaya rambut yang paling sesuai.' },
    ],
  },
  {
    category: 'Pengiriman',
    items: [
      { q: 'Berapa lama proses pengiriman?', a: 'Reguler: 3–5 hari kerja. Ekspres: 1–2 hari kerja. Same-day delivery khusus area Jakarta. Estimasi dimulai setelah pembayaran terkonfirmasi.' },
      { q: 'Apakah ada gratis ongkir?', a: 'Saat ini pengiriman dikenakan biaya sesuai jarak dan opsi yang dipilih. Promo gratis ongkir akan diumumkan secara berkala melalui media sosial kami.' },
      { q: 'Bagaimana cara melacak pesanan?', a: 'Setelah pesanan dikemas dan dikirim, tim kami akan mengirimkan nomor resi pengiriman via WhatsApp ke nomor yang terdaftar.' },
    ],
  },
  {
    category: 'Pembayaran',
    items: [
      { q: 'Metode pembayaran apa saja yang tersedia?', a: 'Transfer bank (BCA, BNI, Mandiri via Virtual Account), e-wallet (GoPay, OVO, DANA), QRIS, dan bayar di tempat (COD) untuk area tertentu.' },
      { q: 'Kapan pembayaran harus dilakukan?', a: 'Pembayaran harus dikonfirmasi dalam 1×24 jam setelah pesanan dibuat. Pesanan yang belum dibayar akan otomatis dibatalkan.' },
    ],
  },
  {
    category: 'Retur & Refund',
    items: [
      { q: 'Apakah bisa melakukan retur produk?', a: 'Retur dapat dilakukan dalam 7 hari setelah penerimaan untuk produk cacat, rusak, atau tidak sesuai pesanan. Produk yang sudah dibuka tidak dapat dikembalikan kecuali ada cacat produksi.' },
      { q: 'Bagaimana proses refund?', a: 'Refund diproses dalam 3–5 hari kerja setelah produk retur diterima dan diverifikasi oleh tim kami. Dana akan dikembalikan ke metode pembayaran asal.' },
    ],
  },
];

export default function FAQPage() {
  return (
    <main className="section-container py-12 lg:py-16">
      <div className="max-w-3xl">
        <p className="label-upper mb-4">FAQ</p>
        <h1 className="heading-lg mb-4">Pertanyaan yang Sering Ditanyakan</h1>
        <p className="text-surface-sub mb-10 leading-relaxed">
          Temukan jawaban untuk pertanyaan umum di bawah ini. Tidak menemukan jawaban? Hubungi kami langsung.
        </p>

        <div className="space-y-8">
          {FAQS.map((section) => (
            <div key={section.category}>
              <h2 className="label-upper mb-3">{section.category}</h2>
              <div className="space-y-2">
                {section.items.map((faq, i) => (
                  <details key={i} className="glass-card group overflow-hidden">
                    <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none list-none">
                      <span className="font-semibold text-surface-ink text-sm">{faq.q}</span>
                      <ChevronDown className="w-4 h-4 text-surface-sub shrink-0 group-open:rotate-180 transition-transform duration-200" />
                    </summary>
                    <div className="px-5 pb-4">
                      <p className="text-sm text-surface-sub leading-relaxed border-t border-surface-muted pt-3">
                        {faq.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-surface-ink rounded-lg text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Pertanyaan Anda tidak ada di sini?</p>
            <p className="text-sm text-white/60 mt-0.5">Chat langsung dengan tim kami via WhatsApp.</p>
          </div>
          <a
            href="https://wa.me/628123456789"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-surface-ink text-sm font-semibold rounded hover:bg-surface-raised transition-colors shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            Chat WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
