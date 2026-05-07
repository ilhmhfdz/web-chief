import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Mail, Phone, Instagram, MessageCircle } from 'lucide-react';

const LINKS = {
  toko: [
    { label: 'Semua Produk',     href: '/catalog' },
    { label: 'AI Recommendation', href: '/ai-recommendation' },
  ],
  perusahaan: [
    { label: 'Tentang Kami', href: '/about' },
    { label: 'Kontak',       href: '/contact' },
    { label: 'FAQ',          href: '/faq' },
  ],
  legal: [
    { label: 'Kebijakan Privasi', href: '/privacy' },
    { label: 'Syarat & Ketentuan', href: '/terms' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-surface-muted bg-surface-raised">
      <div className="section-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 py-14">

          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-start w-fit">
              <Image
                src="/images/chief-logo.png"
                alt="Chief Barber & Supplies Co."
                width={80}
                height={50}
                className="h-10 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-sm text-surface-sub leading-relaxed max-w-xs">
              Toko perlengkapan grooming pria terlengkap. Dipersonalisasi oleh AI berdasarkan bentuk wajah Anda.
            </p>
            <div className="flex items-center gap-2">
              {[
                { href: 'https://instagram.com', icon: Instagram, label: 'Instagram' },
                { href: 'https://wa.me/', icon: MessageCircle, label: 'WhatsApp' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                   aria-label={s.label}
                   className="w-8 h-8 rounded border border-surface-muted flex items-center justify-center text-surface-sub hover:text-surface-ink hover:border-surface-border transition-colors">
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Toko */}
          <div>
            <p className="label-upper mb-4">Toko</p>
            <ul className="space-y-2.5">
              {LINKS.toko.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-surface-sub hover:text-surface-ink transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Perusahaan */}
          <div>
            <p className="label-upper mb-4">Perusahaan</p>
            <ul className="space-y-2.5">
              {LINKS.perusahaan.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-surface-sub hover:text-surface-ink transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <p className="label-upper mb-4">Hubungi Kami</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-surface-sub">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-surface-border" />
                Jakarta, Indonesia
              </li>
              <li>
                <a href="mailto:hello@chiefsupplies.id"
                   className="flex items-center gap-2.5 text-sm text-surface-sub hover:text-surface-ink transition-colors">
                  <Mail className="w-4 h-4 shrink-0 text-surface-border" />
                  hello@chiefsupplies.id
                </a>
              </li>
              <li>
                <a href="tel:+628123456789"
                   className="flex items-center gap-2.5 text-sm text-surface-sub hover:text-surface-ink transition-colors">
                  <Phone className="w-4 h-4 shrink-0 text-surface-border" />
                  +62 812-3456-789
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5 border-t border-surface-muted">
          <p className="text-xs text-surface-border">&copy; {year} Chief Supplies. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {LINKS.legal.map(l => (
              <Link key={l.href} href={l.href} className="text-xs text-surface-border hover:text-surface-sub transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
