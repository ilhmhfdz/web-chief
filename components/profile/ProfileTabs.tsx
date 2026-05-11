'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TABS = [
  'Biodata Diri',
  'Chat',
  'Daftar Alamat',
  'Pembayaran',
  'Notifikasi',
  'Mode Tampilan',
  'Keamanan'
];

interface ProfileTabsProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

export default function ProfileTabs({ activeTab, onChangeTab }: ProfileTabsProps) {
  return (
    <div className="w-full border-b border-surface-muted overflow-x-auto no-scrollbar bg-white rounded-t-xl mt-4 md:mt-0">
      <div className="flex w-max min-w-full">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onChangeTab(tab)}
              className={`relative px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap focus:outline-none ${
                isActive ? 'text-brand-600' : 'text-surface-sub hover:text-brand-900'
              }`}
            >
              {tab}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
