'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Sparkles, MessageCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { label: 'Beranda', href: '/', icon: Home },
  { label: 'Katalog', href: '/catalog', icon: LayoutGrid },
  { label: 'AI', href: '/ai-recommendation', icon: Sparkles, highlight: true },
  { label: 'Kontak', href: '/support', icon: MessageCircle },
  { label: 'Akun', href: '/login', icon: User, isAuth: true },
];

/**
 * IMP-012: Mobile bottom navigation bar.
 * Only visible on mobile screens (lg:hidden).
 */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show on admin pages
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[45] lg:hidden bg-white border-t border-surface-muted safe-area-pb">
      <div className="flex items-center justify-around px-2 pt-1 pb-2">
        {NAV_ITEMS.map((item) => {
          const href = item.isAuth ? (user ? '/profile' : '/login') : item.href;
          const isActive = pathname === href ||
            (href !== '/' && pathname.startsWith(href));

          return (
            <Link
              key={item.href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 min-w-[52px] transition-colors ${
                item.highlight
                  ? isActive
                    ? 'text-accent-dark'
                    : 'text-accent'
                  : isActive
                    ? 'text-surface-ink'
                    : 'text-surface-border'
              }`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-active"
                  className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    item.highlight ? 'bg-accent' : 'bg-surface-ink'
                  }`}
                />
              )}

              {/* AI highlight circle */}
              {item.highlight ? (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg border-2 border-white ${
                  isActive ? 'bg-accent-dark' : 'bg-surface-ink'
                }`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
              ) : (
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              )}

              <span className={`text-[10px] font-medium leading-none ${item.highlight ? 'mt-0.5' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
