import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tentang Kami | Chief Supplies',
  description: 'Chief Supplies — Toko perlengkapan grooming pria premium dengan teknologi AI recommendation.',
};

export default function AboutPage() {
  return (
    <main className="section-container py-12 lg:py-16 max-w-3xl">
      <p className="label-upper mb-4">Tentang Kami</p>
      <h1 className="heading-xl mb-6 text-balance">
        Chief Barber &amp;<br />
        <span className="italic text-accent">Supplies Co.</span>
      </h1>
      <p className="text-lg text-surface-sub leading-relaxed mb-8">
        Chief Supplies adalah toko perlengkapan grooming pria premium yang lahir dari kecintaan terhadap gaya hidup maskulin modern.
        Kami menghadirkan produk-produk pilihan dari brand terpercaya, dipadukan dengan teknologi AI untuk memberikan rekomendasi yang dipersonalisasi sesuai bentuk wajah Anda.
      </p>
      <div className="divider mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[
          { label: '2.000+', desc: 'Pelanggan puas' },
          { label: '100%', desc: 'Produk original' },
          { label: 'AI-Powered', desc: 'Rekomendasi personal' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5 text-center">
            <p className="font-display text-2xl font-bold text-surface-ink">{s.label}</p>
            <p className="text-sm text-surface-sub mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Link href="/catalog" className="btn-primary">Jelajahi Katalog <ArrowRight className="w-4 h-4" /></Link>
        <Link href="/support" className="btn-secondary">Hubungi Kami</Link>
      </div>
    </main>
  );
}
