'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import {
  Menu, X, Search, User, ShoppingBag,
  LayoutDashboard, LogOut, ChevronDown, ChevronRight, Sparkles,
  Flame, Clock, Trophy, TrendingDown, TrendingUp, SlidersHorizontal,
} from 'lucide-react';
import CartButton from '@/components/shop/CartButton';
import MobileFilterDrawer from '@/components/shop/MobileFilterDrawer';
import type { ProductsQueryParams } from '@/types/product';
import { useAuth, refreshAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/utils/apiFetch';

// ── Nav links (bottom row) ────────────────────────────────────
const NAV_LINKS = [
  { label: 'Beranda', href: '/' },
  { label: 'Katalog', href: '/catalog' },
  { label: 'AI Recommendation', href: '/ai-recommendation', icon: Sparkles },
  { label: 'Artikel', href: '/articles' },
];

const SORT_PILLS = [
  { value: 'popular',    label: 'Populer',   Icon: Flame,        color: 'orange' },
  { value: 'newest',     label: 'Terbaru',   Icon: Clock,        color: 'blue'   },
  { value: 'bestseller', label: 'Terlaris',  Icon: Trophy,       color: 'amber'  },
  { value: 'price_asc',  label: 'Termurah',  Icon: TrendingDown, color: 'green'  },
  { value: 'price_desc', label: 'Termahal',  Icon: TrendingUp,   color: 'purple' },
] as const;

const ACTIVE_COLORS: Record<string, string> = {
  orange: 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-orange-400/25',
  blue:   'bg-gradient-to-r from-blue-500 to-sky-400 text-white border-blue-500 shadow-blue-400/25',
  amber:  'bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-amber-500 shadow-amber-400/25',
  green:  'bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-emerald-500 shadow-emerald-400/25',
  purple: 'bg-gradient-to-r from-violet-500 to-purple-400 text-white border-violet-500 shadow-violet-400/25',
};

const ICON_COLORS: Record<string, string> = {
  orange: 'text-orange-500',
  blue:   'text-blue-500',
  amber:  'text-amber-500',
  green:  'text-emerald-500',
  purple: 'text-violet-500',
};

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
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-white border-b border-surface-muted/30'
        }`}
      >
        <div className="section-container relative">
          {showCatalogHeader && (
            /* Custom double-row sticky layout for mobile catalog */
            <div className="lg:hidden flex flex-col gap-2 py-3 px-1">
              <div className="flex items-center gap-2 w-full">
                <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-sub" />
                  <input
                    type="text"
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    placeholder="Cari produk..."
                    className="w-full h-10 pl-9 pr-8 text-xs font-semibold bg-surface-raised border border-surface-muted/60 rounded-xl focus:bg-white focus:border-surface-ink outline-none transition-all placeholder:text-surface-border text-surface-ink"
                  />
                  {navSearch && (
                    <button
                      type="button"
                      onClick={() => { setNavSearch(''); applyFilters({ search: '' }); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-sub hover:text-surface-ink"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
                <MobileFilterDrawer initialParams={currentParams} />
                <CartButton />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4">
                {SORT_PILLS.map((pill) => {
                  const isActive = sortParam === pill.value;
                  const Icon = pill.Icon;
                  return (
                    <button
                      key={pill.value}
                      onClick={() => applyFilters({ sort: pill.value })}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap shadow-sm ${
                        isActive
                          ? `${ACTIVE_COLORS[pill.color]} shadow-md`
                          : 'bg-white text-surface-sub border-surface-muted/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ICON_COLORS[pill.color]}`} />
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
                    <Link href="/catalog?category=pomade" className="px-3 py-2.5 text-sm font-semibold text-surface-sub hover:text-surface-ink hover:bg-surface-raised rounded-lg transition-colors">Pomade</Link>
                    <Link href="/catalog?category=shampoo" className="px-3 py-2.5 text-sm font-semibold text-surface-sub hover:text-surface-ink hover:bg-surface-raised rounded-lg transition-colors">Shampoo</Link>
                    <Link href="/catalog?category=tools" className="px-3 py-2.5 text-sm font-semibold text-surface-sub hover:text-surface-ink hover:bg-surface-raised rounded-lg transition-colors">Tools</Link>
                    <Link href="/catalog?category=accessories" className="px-3 py-2.5 text-sm font-semibold text-surface-sub hover:text-surface-ink hover:bg-surface-raised rounded-lg transition-colors">Aksesoris</Link>
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
                  className="flex items-center gap-3 w-full max-w-3xl xl:max-w-4xl"
                >
                  {/* Search Input */}
                  <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="relative flex-1 max-w-xs xl:max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-sub" />
                    <input
                      type="text"
                      value={navSearch}
                      onChange={(e) => setNavSearch(e.target.value)}
                      placeholder="Cari produk..."
                      className="w-full h-10 pl-10 pr-8 text-xs font-semibold bg-surface-raised border border-surface-muted/60 rounded-xl focus:bg-white focus:border-surface-ink focus:ring-1 focus:ring-surface-ink outline-none transition-all placeholder:text-surface-border text-surface-ink"
                    />
                    {navSearch && (
                      <button
                        type="button"
                        onClick={() => { setNavSearch(''); applyFilters({ search: '' }); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-sub hover:text-surface-ink"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </form>

                  {/* Filter Button */}
                  <MobileFilterDrawer initialParams={currentParams} />

                  {/* Sort Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {SORT_PILLS.map((pill) => {
                      const isActive = sortParam === pill.value;
                      const Icon = pill.Icon;
                      return (
                        <button
                          key={pill.value}
                          onClick={() => applyFilters({ sort: pill.value })}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap shadow-sm ${
                            isActive
                              ? `${ACTIVE_COLORS[pill.color]} shadow-md ring-1 ring-offset-1 ring-${pill.color}-500/20`
                              : 'bg-white text-surface-sub border-surface-muted/60 hover:text-surface-ink hover:border-surface-border'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ICON_COLORS[pill.color]}`} />
                          {pill.label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <LayoutGroup>
                  <nav className="flex items-center gap-1 bg-surface-raised/50 p-1.5 rounded-full border border-surface-muted/30 shadow-sm shadow-black/5">
                    {NAV_LINKS.map((link) => {
                      const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`relative px-5 py-2 text-sm font-semibold transition-colors duration-200 rounded-full flex items-center gap-1.5 ${
                            isActive ? 'text-white' : 'text-surface-sub hover:text-surface-ink'
                          }`}
                        >
                          {link.icon && <link.icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent-light' : ''}`} />}
                          <span className="relative z-10">{link.label}</span>
                          {isActive && (
                            <motion.div
                              layoutId="nav-pill"
                              className="absolute inset-0 bg-surface-ink rounded-full"
                              initial={false}
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </LayoutGroup>
              )}
            </div>

            {/* Right — Actions */}
            <div className="flex items-center justify-end gap-1 sm:gap-2 w-32">
              {!showSearchHeader && !showCatalogHeader && (
                <button
                  onClick={() => setSearchOpen((s) => !s)}
                  className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-raised transition-colors"
                  aria-label="Cari"
                >
                  <Search className="w-5 h-5 text-surface-ink" strokeWidth={1.5} />
                </button>
              )}

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
                  {mobileOpen ? <X className="w-5 h-5 text-surface-ink" /> : <Menu className="w-5 h-5 text-surface-ink" />}
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
                      {link.icon && <link.icon className="w-4 h-4 text-accent" />}
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
