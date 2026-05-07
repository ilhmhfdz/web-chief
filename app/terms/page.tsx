import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | Chief Supplies',
  description: 'Syarat dan ketentuan penggunaan layanan Chief Supplies.',
};

export default function TermsPage() {
  return (
    <main className="section-container py-12 lg:py-16 max-w-3xl">
      <p className="label-upper mb-4">Legal</p>
      <h1 className="heading-lg mb-6">Syarat &amp; Ketentuan</h1>
      <div className="glass-card p-6 mb-6">
        <p className="text-sm text-surface-sub leading-relaxed">
          <strong className="text-surface-ink">Terakhir diperbarui:</strong> Mei 2026
        </p>
      </div>
      <div className="space-y-6 text-surface-sub text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold text-surface-ink text-base mb-2">1. Penerimaan Syarat</h2>
          <p>Dengan menggunakan layanan Chief Supplies, Anda menyetujui syarat dan ketentuan ini. Jika tidak setuju, harap hentikan penggunaan layanan kami.</p>
        </section>
        <section>
          <h2 className="font-semibold text-surface-ink text-base mb-2">2. Pemesanan &amp; Pembayaran</h2>
          <p>Pesanan dianggap valid setelah konfirmasi pembayaran. Kami berhak membatalkan pesanan jika terjadi kehabisan stok atau indikasi penipuan.</p>
        </section>
        <section>
          <h2 className="font-semibold text-surface-ink text-base mb-2">3. Pengiriman</h2>
          <p>Estimasi pengiriman bersifat perkiraan. Keterlambatan akibat kondisi di luar kendali kami (bencana alam, mogok kurir) bukan tanggung jawab Chief Supplies.</p>
        </section>
        <section>
          <h2 className="font-semibold text-surface-ink text-base mb-2">4. Retur &amp; Refund</h2>
          <p>Retur dapat dilakukan dalam 7 hari setelah penerimaan untuk produk cacat atau salah kirim. Produk yang sudah dibuka tidak dapat dikembalikan kecuali ada kerusakan manufaktur.</p>
        </section>
        <section>
          <h2 className="font-semibold text-surface-ink text-base mb-2">5. Layanan AI</h2>
          <p>Fitur AI Recommendation bersifat rekomendasi dan tidak menjamin hasil yang spesifik. Foto yang diunggah diproses secara anonim dan tidak disimpan oleh sistem kami.</p>
        </section>
        <section>
          <h2 className="font-semibold text-surface-ink text-base mb-2">6. Perubahan Syarat</h2>
          <p>Kami dapat memperbarui syarat ini sewaktu-waktu. Perubahan signifikan akan dikomunikasikan melalui email atau notifikasi di aplikasi.</p>
        </section>
      </div>
      <div className="mt-8">
        <Link href="/privacy" className="text-sm text-surface-sub hover:text-surface-ink underline underline-offset-2 transition-colors">
          Lihat Kebijakan Privasi →
        </Link>
      </div>
    </main>
  );
}
