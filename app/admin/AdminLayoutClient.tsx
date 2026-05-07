'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar, MobileAdminSidebar } from '@/components/admin/Sidebar';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Mobile Sidebar */}
      <MobileAdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-muted bg-white">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="btn-ghost p-2"
            aria-label="Buka menu admin"
          >
            <Menu className="w-5 h-5" />
          </button>
          <p className="font-display font-bold text-surface-ink text-sm">Admin Panel</p>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
