'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import {
  Menu, X, Search, User, ShoppingBag,
  LayoutDashboard, LogOut, ChevronDown, ChevronRight, Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import CartButton from '@/components/shop/CartButton';
import MobileFilterDrawer from '@/components/shop/MobileFilterDrawer';
import type { ProductsQueryParams } from '@/types/product';
import { PRODUCT_CATEGORIES } from '@/types/product';
import { useAuth, refreshAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/utils/apiFetch';

const NAV_LINKS = [
  { label: 'Products', href: '/catalog' },
  { label: 'Artikel', href: '/articles' },
  { label: 'AI Hairstyle', href: '/ai-recommendation' },
  { label: 'Booking', href: '/booking' },
];

const SORT_PILLS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'New' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
] as const;

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
                {user.role === 'admin' ? 'Administrator' : (user.name || 'Pelanggan')}
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
  const router = useRouter();

  // Search parameters for catalog page
  const searchParams = useSearchParams();
  const searchValParam = searchParams.get('search') ?? '';
  const sortParam = (searchParams.get('sort') as ProductsQueryParams['sort']) ?? 'popular';

  const [navSearch, setNavSearch] = useState(searchValParam);

  useEffect(() => {
    setNavSearch(searchValParam);
  }, [searchValParam]);

  const currentParams: ProductsQueryParams = {
    category: (searchParams.get('category') as any) ?? 'all',
    search: searchValParam,
    sort: sortParam,
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
  };

  const applyFilters = (overrides: Partial<ProductsQueryParams> = {}) => {
    const params = {
      page: 1,
      category: searchParams.get('category') ?? 'all',
      search: overrides.search !== undefined ? overrides.search : navSearch,
      sort: overrides.sort !== undefined ? overrides.sort : sortParam,
      minRating: overrides.minRating !== undefined ? overrides.minRating : searchParams.get('minRating'),
    };

    const entries = Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all'
    );
    const qs = entries.length === 0 ? '' : `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
    router.push(`/catalog${qs}`);
  };

  const isCatalog = pathname === '/catalog';
  const showCatalogHeader = isCatalog && scrolled;

  const isProductDetail = pathname.startsWith('/catalog/') && pathname.length > '/catalog/'.length;
  const showSearchHeader = isProductDetail && scrolled;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname]);

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <AdminBanner />

      <header
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : (pathname === '/' ? 'bg-[#f3efe8] border-none' : 'bg-white border-b border-surface-muted/30')
          }`}
      >
        <div className="section-container relative">
          {showCatalogHeader && (
            /* Mobile: minimal double-row sticky catalog bar */
            <div className="lg:hidden flex flex-col gap-2 py-3 px-1">
              <div className="flex items-center gap-2 w-full">
                <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="relative flex-1">
                  <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8b82]" />
                  <input
                    type="text"
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full h-9 pl-6 pr-6 text-[13px] bg-transparent border-0 border-b border-[#d6d2c9] focus:border-[#1a1a1a] outline-none placeholder:text-[#c0bdb7] transition-colors text-[#1a1a1a]"
                  />
                  {navSearch && (
                    <button
                      type="button"
                      onClick={() => { setNavSearch(''); applyFilters({ search: '' }); }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-[#8e8b82] hover:text-[#1a1a1a]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
                <MobileFilterDrawer initialParams={currentParams} />
                <CartButton />
              </div>
              {/* Sort tabs — minimal text */}
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
                {SORT_PILLS.map((pill) => {
                  const isActive = sortParam === pill.value;
                  return (
                    <button
                      key={pill.value}
                      onClick={() => applyFilters({ sort: pill.value })}
                      className={`text-[11px] font-semibold whitespace-nowrap pb-1 border-b transition-all duration-200 ${isActive
                          ? 'text-[#1a1a1a] border-[#1a1a1a]'
                          : 'text-[#8e8b82] border-transparent hover:text-[#1a1a1a]'
                        }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={`${showCatalogHeader ? 'hidden lg:flex' : 'flex'} items-center justify-between h-16 lg:h-20`}>
            {/* Left — Logo & Kategori */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="group w-32 shrink-0">
                <Image
                  src="/images/chief-logo.png"
                  alt="Chief Barber & Supplies Co."
                  width={90}
                  height={56}
                  priority
                  className="h-10 w-auto object-contain transition-opacity duration-200 group-hover:opacity-75"
                />
              </Link>

              {/* Kategori Dropdown (Desktop) */}
              <div className="hidden lg:block relative ml-2 group/cat">
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-surface-sub hover:text-surface-ink hover:bg-surface-raised rounded-lg transition-colors">
                  Kategori
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-200 z-50">
                  <div className="w-48 bg-white rounded-xl shadow-xl border border-surface-muted p-2 flex flex-col gap-1">
                    {PRODUCT_CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                      <Link key={cat.value} href={`/catalog?category=${cat.value}`} className="px-3 py-2.5 text-sm font-semibold text-surface-sub hover:text-surface-ink hover:bg-surface-raised rounded-lg transition-colors">
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Center — Nav Links (Desktop) */}
            <div className="hidden lg:flex flex-1 justify-center px-4">
              {showSearchHeader ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-2xl flex items-center h-10 border border-surface-muted rounded-xl bg-surface-raised px-4 focus-within:bg-white focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600 transition-all"
                >
                  <Search className="w-4 h-4 text-surface-sub shrink-0" />
                  <input
                    type="text"
                    placeholder="Cari di Chief Barber..."
                    className="flex-1 bg-transparent px-3 text-sm text-surface-ink placeholder:text-surface-sub outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        router.push(`/catalog?search=${encodeURIComponent(e.currentTarget.value.trim())}`);
                      }
                    }}
                  />
                </motion.div>
              ) : showCatalogHeader ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-6 w-full max-w-3xl xl:max-w-4xl"
                >
                  {/* Underline Search */}
                  <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="relative w-56">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8b82]" />
                    <input
                      type="text"
                      value={navSearch}
                      onChange={(e) => setNavSearch(e.target.value)}
                      placeholder="Search products..."
                      className="w-full h-9 pl-6 pr-6 text-[13px] bg-transparent border-0 border-b border-[#d6d2c9] focus:border-[#1a1a1a] outline-none placeholder:text-[#c0bdb7] transition-colors text-[#1a1a1a]"
                    />
                    {navSearch && (
                      <button
                        type="button"
                        onClick={() => { setNavSearch(''); applyFilters({ search: '' }); }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-[#8e8b82] hover:text-[#1a1a1a]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </form>

                  {/* Vertical divider */}
                  <div className="w-px h-5 bg-[#e8e4de] shrink-0" />

                  {/* Sort tabs — minimal text with underline active state */}
                  <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
                    {SORT_PILLS.map((pill) => {
                      const isActive = sortParam === pill.value;
                      return (
                        <button
                          key={pill.value}
                          onClick={() => applyFilters({ sort: pill.value })}
                          className={`relative text-[12px] font-semibold whitespace-nowrap pb-1 border-b-[1.5px] transition-all duration-200 ${isActive
                              ? 'text-[#1a1a1a] border-[#1a1a1a]'
                              : 'text-[#8e8b82] border-transparent hover:text-[#1a1a1a] hover:border-[#d6d2c9]'
                            }`}
                        >
                          {pill.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Filter drawer trigger */}
                  <MobileFilterDrawer initialParams={currentParams} />
                </motion.div>
              ) : (
                <LayoutGroup>
                  <nav className="flex items-center gap-6">
                    {NAV_LINKS.map((link) => {
                      const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`relative text-[13px] transition-colors duration-200 ${isActive ? 'text-[#1a1a1a] font-bold' : 'text-[#8e8b82] font-medium hover:text-[#1a1a1a]'
                            }`}
                        >
                          <span className="relative z-10">{link.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </LayoutGroup>
              )}
            </div>

            {/* Right — Actions */}
            <div className="flex items-center justify-end gap-1 sm:gap-2">
              {/* Desktop User + Cart */}
              <div className="hidden lg:flex items-center gap-1">
                <UserDropdown />
                <CartButton />
              </div>

              {/* Mobile Cart + Menu */}
              <div className="flex lg:hidden items-center gap-1">
                <CartButton />
                <button
                  className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-raised transition-colors"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Menu"
                >
                  {mobileOpen ? <X className="w-5 h-5 text-[#1a1a1a]" /> : <Menu className="w-5 h-5 text-[#1a1a1a]" />}
                </button>
              </div>
            </div>
          </div>

          {/* Search Dropdown */}
          <AnimatePresence>
            {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}
          </AnimatePresence>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-md border-t border-surface-muted"
            >
              <div className="section-container py-4 space-y-1">
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold text-surface-ink hover:bg-surface-raised transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      {link.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-surface-muted" />
                  </Link>
                ))}

                <div className="divider my-3" />

                {user && (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold text-surface-sub hover:text-surface-ink hover:bg-surface-raised transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <User className="w-4 h-4" />
                        Profil Saya
                      </span>
                      <ChevronRight className="w-4 h-4 text-surface-muted" />
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold text-surface-sub hover:text-surface-ink hover:bg-surface-raised transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4" />
                        Transaksi
                      </span>
                      <ChevronRight className="w-4 h-4 text-surface-muted" />
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold text-surface-ink bg-surface-raised mt-2"
                  >
                    <span className="flex items-center gap-3">
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Panel
                    </span>
                    <ChevronRight className="w-4 h-4 text-surface-muted" />
                  </Link>
                )}

                <div className="px-2 pt-2">
                  {user ? (
                    <MobileLogout />
                  ) : (
                    <Link href="/login" className="btn-primary w-full justify-center text-sm py-3 mt-2">
                      <User className="w-4 h-4" /> Masuk ke Akun
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
    <button onClick={handleLogout} className="w-full btn-ghost text-sm text-red-600 hover:bg-red-50 justify-start py-3 mt-1">
      <LogOut className="w-4 h-4" /> Keluar
    </button>
  );
}
