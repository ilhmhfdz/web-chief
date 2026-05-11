'use client';

import React from 'react';
import { User, Wallet, CreditCard, Mail, Settings, MessageSquare, Star, HelpCircle, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ProfileSidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    ai_credits: number;
  };
}

export default function ProfileSidebar({ user }: ProfileSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast.success('Logged out successfully');
        window.location.href = '/login';
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  return (
    <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
      {/* User Card */}
      <div className="bg-surface rounded-xl border border-surface-muted p-4 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 bg-brand-200 rounded-full flex items-center justify-center text-brand-700 font-bold text-xl overflow-hidden">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-col flex">
          <span className="font-semibold text-brand-900 truncate w-32">{user.name}</span>
          <span className="text-xs text-surface-sub">{user.role}</span>
        </div>
      </div>

      {/* Balance & Cards */}
      <div className="bg-surface rounded-xl border border-surface-muted p-4 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-500" />
            <span className="text-sm font-medium text-brand-900">AI Credits</span>
          </div>
          <span className="text-sm font-bold text-brand-500">{user.ai_credits}</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-surface rounded-xl border border-surface-muted shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-brand-50 border-b border-surface-muted flex items-center justify-between">
          <span className="font-semibold text-brand-900 text-sm">Kotak Masuk</span>
        </div>
        <div className="flex flex-col py-2">
          <Link href="/profile?tab=Chat" className="flex items-center px-4 py-2 hover:bg-brand-50 transition-colors gap-3 group">
            <MessageSquare className="w-4 h-4 text-surface-sub group-hover:text-brand-500" />
            <span className="text-sm text-brand-800 group-hover:text-brand-900">Chat</span>
          </Link>
          <Link href="#" className="flex items-center px-4 py-2 hover:bg-brand-50 transition-colors gap-3 group">
            <Star className="w-4 h-4 text-surface-sub group-hover:text-brand-500" />
            <span className="text-sm text-brand-800 group-hover:text-brand-900">Ulasan</span>
          </Link>
          <Link href="#" className="flex items-center px-4 py-2 hover:bg-brand-50 transition-colors gap-3 group">
            <HelpCircle className="w-4 h-4 text-surface-sub group-hover:text-brand-500" />
            <span className="text-sm text-brand-800 group-hover:text-brand-900">Pesan Bantuan</span>
          </Link>
          <Link href="#" className="flex items-center px-4 py-2 hover:bg-brand-50 transition-colors gap-3 group">
            <AlertCircle className="w-4 h-4 text-surface-sub group-hover:text-brand-500" />
            <span className="text-sm text-brand-800 group-hover:text-brand-900">Pesanan Dikomplain</span>
          </Link>
          <Link href="#" className="flex items-center px-4 py-2 hover:bg-brand-50 transition-colors gap-3 group">
            <RefreshCw className="w-4 h-4 text-surface-sub group-hover:text-brand-500" />
            <span className="text-sm text-brand-800 group-hover:text-brand-900">Update</span>
          </Link>
        </div>
      </div>
      
      {/* Settings / Logout */}
      <div className="bg-surface rounded-xl border border-surface-muted shadow-sm overflow-hidden flex flex-col py-2">
        <Link href="#" className="flex items-center px-4 py-2 hover:bg-brand-50 transition-colors gap-3 group">
          <Settings className="w-4 h-4 text-surface-sub group-hover:text-brand-500" />
          <span className="text-sm text-brand-800 group-hover:text-brand-900">Pengaturan Akun</span>
        </Link>
        <button onClick={handleLogout} className="flex items-center px-4 py-2 hover:bg-red-50 transition-colors gap-3 group w-full text-left">
          <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600" />
          <span className="text-sm text-red-500 group-hover:text-red-600">Keluar</span>
        </button>
      </div>
    </div>
  );
}
