import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[85vh] flex items-center justify-center section-container py-16">
      <div className="text-center max-w-md">
        {/* Large 404 */}
        <div className="relative mb-8 inline-block">
          <p className="font-display text-[120px] sm:text-[160px] font-bold text-surface-muted/40 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-surface-muted flex items-center justify-center shadow-sm">
              <Search className="w-7 h-7 text-surface-border" />
            </div>
          </div>
        </div>

        <h1 className="heading-md mb-3">Halaman Tidak Ditemukan</h1>
        <p className="text-surface-sub text-sm leading-relaxed mb-8">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
          Cek kembali URL atau kembali ke beranda.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4" />
            Ke Beranda
          </Link>
          <Link href="/catalog" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Lihat Katalog
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-10 pt-8 border-t border-surface-muted">
          <p className="text-xs text-surface-border uppercase tracking-wider mb-4">Halaman Populer</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: 'Katalog', href: '/catalog' },
              { label: 'AI Recommendation', href: '/ai-recommendation' },
              { label: 'Bantuan', href: '/support' },
              { label: 'Tentang Kami', href: '/about' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 text-xs font-medium text-surface-sub hover:text-surface-ink border border-surface-muted hover:border-surface-border rounded-full transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
