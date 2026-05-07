import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kontak | Chief Supplies',
  description: 'Hubungi Chief Supplies untuk pertanyaan, keluhan, atau kerjasama bisnis.',
};

export default function ContactPage() {
  return (
    <main className="section-container py-12 lg:py-16 max-w-2xl">
      <p className="label-upper mb-4">Kontak</p>
      <h1 className="heading-lg mb-4">Hubungi Kami</h1>
      <p className="text-surface-sub mb-8 leading-relaxed">
        Punya pertanyaan atau keluhan? Kami dengan senang hati membantu Anda.
      </p>
      <div className="glass-card p-6 mb-6 flex items-center gap-4">
        <MessageCircle className="w-6 h-6 text-green-600 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-surface-ink">WhatsApp (Respon Tercepat)</p>
          <p className="text-sm text-surface-sub">+62 812-3456-789 — Senin s/d Sabtu, 08.00–20.00 WIB</p>
        </div>
        <a
          href="https://wa.me/628123456789"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm shrink-0"
        >
          Chat <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <p className="text-sm text-surface-sub">
        Atau kunjungi halaman <Link href="/support" className="text-surface-ink underline underline-offset-2 hover:text-accent-dark transition-colors">Pusat Bantuan</Link> untuk FAQ lengkap.
      </p>
    </main>
  );
}
