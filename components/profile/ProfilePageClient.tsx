'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProfileSidebar from './ProfileSidebar';
import ProfileTabs from './ProfileTabs';
import ProfileContent from './ProfileContent';
import TransactionDropdown from './TransactionDropdown';
import type { OrderSummary } from '@/app/(shop)/profile/page';
import dynamic from 'next/dynamic';

const UserChat = dynamic(() => import('@/components/profile/UserChat'), { ssr: false });

interface ProfilePageClientProps {
  user: {
    name: string;
    email: string;
    role: string;
    ai_credits: number;
  };
  orders: OrderSummary[];
}

export default function ProfilePageClient({ user, orders }: ProfilePageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialTab = searchParams?.get('tab') || 'Biodata Diri';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <ProfileSidebar user={user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        <TransactionDropdown orders={orders} />

        <div className="bg-white rounded-xl border border-surface-muted shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <ProfileTabs activeTab={activeTab} onChangeTab={handleTabChange} />
          
          <div className="p-0 border-t-0 flex-1 flex flex-col">
            {activeTab === 'Biodata Diri' && <ProfileContent user={user} />}
            {activeTab === 'Chat' && <UserChat />}
            {activeTab !== 'Biodata Diri' && activeTab !== 'Chat' && (
              <div className="p-8 text-center text-surface-sub">
                <p>Konten untuk {activeTab} akan segera hadir.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
