import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle, Mail, Phone, Clock, ArrowRight, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bantuan & Kontak | Chief Supplies',
  description: 'Hubungi tim Chief Supplies melalui WhatsApp, email, atau telepon. Kami siap membantu Anda.',
};

const FAQS = [
  {
    q: 'Berapa lama proses pengiriman?',
    a: 'Pengiriman reguler 3–5 hari kerja, ekspres 1–2 hari kerja, dan same-day delivery untuk area Jakarta.',
  },
  {
    q: 'Apakah semua produk original?',
    a: '100% produk original bergaransi resmi dari brand grooming terpilih. Kami tidak menjual produk KW.',
  },
  {
    q: 'Bagaimana cara melacak pesanan saya?',
    a: 'Setelah pesanan dikonfirmasi, tim kami akan mengirimkan nomor resi pengiriman via WhatsApp.',
  },
  {
    q: 'Apakah bisa retur/tukar produk?',
    a: 'Produk dapat dikembalikan dalam 7 hari setelah penerimaan jika terdapat kerusakan atau kesalahan produk.',
  },
  {
    q: 'Metode pembayaran apa saja yang tersedia?',
    a: 'Kami menerima transfer bank (BCA, BNI, Mandiri), e-wallet (GoPay, OVO, DANA), QRIS, dan bayar di tempat (COD).',
  },
];

const CONTACTS = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    desc: 'Respon tercepat — Senin s/d Sabtu, 08.00–20.00 WIB',
    action: 'Chat Sekarang',
    href: 'https://wa.me/628123456789?text=Halo%20Chief%20Supplies%2C%20saya%20butuh%20bantuan',
    color: 'bg-green-50 border-green-200 text-green-700',
    iconColor: 'text-green-600',
  },
  {
    icon: Mail,
    label: 'Email',
    desc: 'hello@chiefsupplies.id — Dibalas dalam 1×24 jam',
    action: 'Kirim Email',
    href: 'mailto:hello@chiefsupplies.id',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    iconColor: 'text-blue-600',
  },
  {
    icon: Phone,
    label: 'Telepon',
    desc: '+62 812-3456-789 — Senin s/d Jumat, 09.00–17.00 WIB',
    action: 'Hubungi',
    href: 'tel:+628123456789',
    color: 'bg-surface-raised border-surface-muted text-surface-ink',
    iconColor: 'text-surface-ink',
  },
];

export default function SupportPage() {
  return (
    <main className="section-container py-12 lg:py-16">
      {/* Header */}
      <div className="max-w-2xl mb-12">
        <p className="label-upper mb-3">Pusat Bantuan</p>
        <h1 className="heading-xl mb-4 text-balance">
          Ada yang bisa<br />
          <span className="italic text-accent">kami bantu?</span>
        </h1>
        <p className="text-lg text-surface-sub leading-relaxed">
          Tim Chief Supplies siap membantu Anda. Pilih cara yang paling nyaman untuk menghubungi kami.
        </p>
      </div>

      <div className="divider mb-12" />

      {/* Contact Cards */}
      <section className="mb-16">
        <h2 className="heading-md mb-6">Hubungi Kami</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CONTACTS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`group flex flex-col gap-4 p-6 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${c.color}`}
            >
              <div className={`w-10 h-10 rounded-full bg-white/60 flex items-center justify-center ${c.iconColor}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-surface-ink">{c.label}</p>
                <p className="text-sm text-surface-sub mt-1 leading-relaxed">{c.desc}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all">
                {c.action} <ArrowRight className="w-4 h-4" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Operating Hours */}
      <section className="mb-16">
        <div className="glass-card p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded border border-surface-muted bg-surface-raised flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-surface-ink" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-ink mb-2">Jam Operasional</h3>
            <div className="space-y-1 text-sm text-surface-sub">
              <p>Senin – Jumat: <span className="font-medium text-surface-ink">08.00 – 20.00 WIB</span></p>
              <p>Sabtu: <span className="font-medium text-surface-ink">09.00 – 17.00 WIB</span></p>
              <p>Minggu & Hari Libur: <span className="text-surface-border">Tutup</span></p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider mb-12" />

      {/* FAQ */}
      <section>
        <h2 className="heading-md mb-2">Pertanyaan Umum</h2>
        <p className="text-surface-sub mb-8">Jawaban untuk pertanyaan yang paling sering kami terima.</p>
        <div className="space-y-3 max-w-3xl">
          {FAQS.map((faq, i) => (
            <details key={i} className="glass-card group overflow-hidden">
              <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer select-none list-none">
                <span className="font-semibold text-surface-ink text-sm">{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-surface-sub shrink-0 group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="px-6 pb-5">
                <p className="text-sm text-surface-sub leading-relaxed border-t border-surface-muted pt-4">
                  {faq.a}
                </p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 p-6 bg-surface-ink rounded-lg text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Masih butuh bantuan?</p>
            <p className="text-sm text-white/60 mt-0.5">Tim kami siap menjawab pertanyaan Anda via WhatsApp.</p>
          </div>
          <a
            href="https://wa.me/628123456789?text=Halo%20Chief%20Supplies%2C%20saya%20butuh%20bantuan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-surface-ink text-sm font-semibold rounded hover:bg-surface-raised transition-colors shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            Chat WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
