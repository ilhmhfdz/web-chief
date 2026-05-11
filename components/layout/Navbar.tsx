'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu, X, Search, User, ShoppingBag,
  LayoutDashboard, LogOut, ChevronDown, ChevronRight, Sparkles,
} from 'lucide-react';
import CartButton from '@/components/shop/CartButton';
import { useAuth, refreshAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/utils/apiFetch';

// ── Nav links (bottom row) ────────────────────────────────────
const NAV_LINKS = [
  { label: 'Beranda', href: '/' },
  { label: 'Katalog', href: '/catalog' },
  { label: 'AI Recommendation', href: '/ai-recommendation', icon: Sparkles },
  { label: 'Kontak', href: '/support' },
];

// ── Search bar ────────────────────────────────────────────────
function SearchBar({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/catalog?search=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-x-0 top-full bg-white border-b border-surface-muted shadow-md z-50 px-4 py-3"
    >
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex items-center gap-3">
        <Search className="w-4 h-4 text-surface-sub shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Cari produk…"
          className="flex-1 bg-transparent text-sm text-surface-ink placeholder:text-surface-border outline-none"
        />
        <button type="button" onClick={onClose} className="text-surface-sub hover:text-surface-ink transition-colors">
          <X className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}

// ── User dropdown ─────────────────────────────────────────────
function UserDropdown() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
    refreshAuth();
    router.push('/login');
  };

  return (
    <div ref={ref} className="relative">
      <Link
        href={user ? '#' : '/login'}
        onClick={user ? (e) => { e.preventDefault(); setOpen(o => !o); } : undefined}
        className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-raised transition-colors"
        aria-label="Akun"
      >
        <User className="w-5 h-5 text-surface-ink" strokeWidth={1.5} />
      </Link>

      <AnimatePresence>
        {open && user && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-white border border-surface-muted rounded-lg shadow-xl py-1.5 z-50"
          >
            <div className="px-4 py-2.5 border-b border-surface-muted mb-1">
              <p className="text-xs text-surface-sub">Login sebagai</p>
              <p className="text-sm font-semibold text-surface-ink truncate">
                {user.role === 'admin' ? 'Administrator' : 'Pelanggan'}
              </p>
              <p className="text-[11px] text-surface-border truncate mt-0.5">
                ID: {user.userId.slice(-8).toUpperCase()}
              </p>
            </div>
            
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-ink hover:bg-surface-raised transition-colors"
            >
              <User className="w-4 h-4" />
              Profil Saya
            </Link>
            
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-ink hover:bg-surface-raised transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Transaksi
            </Link>

            {user.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-ink hover:bg-surface-raised transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-sub hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Admin banner ──────────────────────────────────────────────
function AdminBanner() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user || user.role !== 'admin' || pathname.startsWith('/admin')) return null;
  return (
    <div className="bg-surface-ink text-white text-xs flex items-center justify-between px-4 py-2">
      <span className="flex items-center gap-2">
        <LayoutDashboard className="w-3.5 h-3.5" />
        Mode Admin — Anda melihat tampilan toko
      </span>
      <Link href="/admin" className="font-semibold hover:underline underline-offset-2">
        Kembali ke Admin Panel &rarr;
      </Link>
    </div>
  );
}

// ── Main Navbar ───────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname]);

  return (
    <>
      <AdminBanner />

      <header
        className={`sticky top-0 left-0 right-0 z-40 bg-white transition-shadow duration-200 ${scrolled ? 'shadow-sm' : ''
          }`}
      >
        {/* ── Row 1: Search | Logo | Actions ── */}
        <div className="relative border-b border-surface-muted">
          <div className="section-container">
            <div className="flex items-center justify-between h-[60px]">

              {/* Left — Search */}
              <div className="flex items-center gap-1 w-24 lg:w-32">
                <button
                  onClick={() => setSearchOpen(s => !s)}
                  className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-raised transition-colors"
                  aria-label="Cari"
                >
                  <Search className="w-5 h-5 text-surface-ink" strokeWidth={1.5} />
                </button>
              </div>

              {/* Center — Logo */}
              <Link href="/" className="absolute left-1/2 -translate-x-1/2 group">
                <Image
                  src="/images/chief-logo.png"
                  alt="Chief Barber & Supplies Co."
                  width={100}
                  height={64}
                  priority
                  className="h-12 w-auto object-contain transition-opacity duration-200 group-hover:opacity-75"
                />
              </Link>

              {/* Right — User + Cart */}
              <div className="flex items-center gap-0.5 w-24 lg:w-32 justify-end">
                {/* Desktop: User + Cart */}
                <div className="hidden lg:flex items-center gap-0.5">
                  <UserDropdown />
                  <CartButton />
                </div>
                {/* Mobile: Cart + Hamburger */}
                <div className="flex lg:hidden items-center gap-1">
                  <CartButton />
                  <button
                    className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-raised transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Menu"
                  >
                    {mobileOpen
                      ? <X className="w-5 h-5 text-surface-ink" />
                      : <Menu className="w-5 h-5 text-surface-ink" />
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search dropdown */}
          <AnimatePresence>
            {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}
          </AnimatePresence>
        </div>

        {/* ── Row 2: Nav links (desktop only) ── */}
        <div className="hidden lg:block border-b border-surface-muted">
          <nav className="section-container">
            <ul className="flex items-center justify-center gap-0">
              {NAV_LINKS.map(link => {
                const isActive = pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`relative flex items-center gap-1.5 px-4 py-3 text-sm transition-colors duration-150 ${isActive
                        ? 'text-surface-ink font-semibold'
                        : 'text-surface-sub hover:text-surface-ink font-medium'
                        }`}
                    >
                      {link.icon && <link.icon className="w-3.5 h-3.5" />}
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline"
                          className="absolute bottom-0 inset-x-3 h-[2px] bg-surface-ink rounded-full"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden bg-white border-t border-surface-muted"
            >
              <div className="section-container py-3 space-y-0.5">
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium text-surface-sub hover:text-surface-ink hover:bg-surface-raised transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {link.icon && <link.icon className="w-4 h-4" />}
                      {link.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-surface-muted" />
                  </Link>
                ))}
                {user && (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium text-surface-ink hover:bg-surface-raised"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profil Saya
                      </span>
                      <ChevronRight className="w-4 h-4 text-surface-border" />
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium text-surface-ink hover:bg-surface-raised"
                    >
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Transaksi
                      </span>
                      <ChevronRight className="w-4 h-4 text-surface-border" />
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium text-surface-ink bg-surface-raised"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Panel
                    </span>
                    <ChevronRight className="w-4 h-4 text-surface-border" />
                  </Link>
                )}
                <div className="divider my-2" />
                <div className="px-1 pb-1">
                  {user ? (
                    <MobileLogout />
                  ) : (
                    <Link href="/login" className="btn-primary w-full justify-center text-sm">
                      <User className="w-4 h-4" /> Masuk
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

function MobileLogout() {
  const router = useRouter();
  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
    refreshAuth();
    router.push('/login');
  };
  return (
    <button onClick={handleLogout} className="w-full btn-ghost text-sm text-red-600 hover:bg-red-50 justify-start">
      <LogOut className="w-4 h-4" /> Keluar
    </button>
  );
}
