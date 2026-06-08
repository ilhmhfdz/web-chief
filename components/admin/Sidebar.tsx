'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, BookOpen, Bot,
  LogOut, ShoppingBag, X, Eye, MessageSquare, FileText,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils/apiFetch';

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/admin',                icon: LayoutDashboard, exact: true },
  { label: 'Produk',        href: '/admin/products',       icon: Package },
  { label: 'Pesanan',       href: '/admin/orders',         icon: ShoppingCart },
  { label: 'Chat',          href: '/admin/chat',           icon: MessageSquare },
  { label: 'Knowledge Base', href: '/admin/knowledge-base', icon: BookOpen },
  { label: 'AI Persona',    href: '/admin/ai-persona',     icon: Bot },
  { label: 'Artikel GEO',   href: '/admin/adaptive-articles', icon: FileText },
];

async function handleLogout() {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  window.location.href = '/login';
}

function NavItem({ item, onClick }: { item: typeof NAV_ITEMS[0]; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-surface-ink text-white'
          : 'text-surface-sub hover:text-surface-ink hover:bg-surface-overlay'
      }`}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-surface-muted">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-surface-ink rounded flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-sm text-surface-ink leading-none block">CHIEF</span>
            <span className="text-[9px] uppercase tracking-widest text-surface-border leading-none">Admin</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        <p className="label-upper px-3 mb-3">Menu</p>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} item={item} onClick={onNavClick} />
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-surface-muted space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-surface-sub hover:text-surface-ink hover:bg-surface-overlay transition-colors"
        >
          <Eye className="w-4 h-4" />
          Lihat Toko
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-surface-sub hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </div>
  );
}

/* ---- Desktop Sidebar ---- */
export function AdminSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 min-h-screen bg-white border-r border-surface-muted">
      <SidebarContent />
    </aside>
  );
}

/* ---- Mobile Drawer ---- */
export function MobileAdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-surface-ink/40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-56 bg-white border-r border-surface-muted lg:hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-3 btn-ghost p-1.5" aria-label="Tutup">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onNavClick={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
