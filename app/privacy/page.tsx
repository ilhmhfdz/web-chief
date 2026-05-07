import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | Chief Supplies',
  description: 'Kebijakan privasi Chief Supplies — Bagaimana kami mengumpulkan dan melindungi data Anda.',
};

export default function PrivacyPage() {
  return (
    <main className="section-container py-12 lg:py-16 max-w-3xl">
      <p className="label-upper mb-4">Legal</p>
      <h1 className="heading-lg mb-6">Kebijakan Privasi</h1>
      <div className="glass-card p-6 mb-6">
        <p className="text-sm text-surface-sub leading-relaxed">
          <strong className="text-surface-ink">Terakhir diperbarui:</strong> Mei 2026
        </p>
      </div>
      <div className="prose prose-sm max-w-none space-y-6 text-surface-sub text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold text-surface-ink text-base mb-2">1. Data yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan informasi yang Anda berikan saat mendaftar (nama, email), melakukan pembelian (alamat pengiriman, nomor telepon), dan menggunakan fitur AI (foto wajah yang diproses secara anonim dan tidak disimpan).</p>
        </section>
        <section>
          <h2 className="font-semibold text-surface-ink text-base mb-2">2. Penggunaan Data</h2>
          <p>Data Anda digunakan untuk memproses pesanan, mengirimkan konfirmasi, dan meningkatkan layanan kami. Kami tidak menjual data pribadi Anda kepada pihak ketiga.</p>
        </section>
        <section>
          <h2 className="font-semibold text-surface-ink text-base mb-2">3. Keamanan Data</h2>
          <p>Kami menggunakan enkripsi SSL/TLS untuk semua transmisi data. Password disimpan dalam bentuk hash yang aman.</p>
        </section>
        <section>
          <h2 className="font-semibold text-surface-ink text-base mb-2">4. Kontak</h2>
          <p>Untuk pertanyaan terkait privasi, hubungi kami di <a href="mailto:hello@chiefsupplies.id" className="text-surface-ink underline">hello@chiefsupplies.id</a>.</p>
        </section>
      </div>
      <div className="mt-8">
        <Link href="/terms" className="text-sm text-surface-sub hover:text-surface-ink underline underline-offset-2 transition-colors">
          Lihat Syarat &amp; Ketentuan →
        </Link>
      </div>
    </main>
  );
}
