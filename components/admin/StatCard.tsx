"use client";

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  /** Optional: subtitle text below value */
  sub?: string;
  /** Optional: color accent variant */
  variant?: 'default' | 'brand' | 'blue' | 'green' | 'purple';
  /** Optional: delay for stagger animation */
  delay?: number;
}

const VARIANT_STYLES: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'bg-surface-raised border border-surface-muted text-surface-sub',
  brand: 'bg-surface-ink text-white',
  blue: 'bg-blue-50 border border-blue-200 text-blue-700',
  green: 'bg-green-50 border border-green-200 text-green-700',
  purple: 'bg-purple-50 border border-purple-200 text-purple-700',
};

export default function StatCard({
  label,
  value,
  icon,
  sub,
  variant = 'default',
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay, ease: 'easeOut' }}
      className="glass-card p-5 flex items-start justify-between gap-4 card-hover hover:-translate-y-1 transition-transform"
    >
      <div className="flex-1 min-w-0">
        <p className="label-upper mb-1">{label}</p>
        <p className="text-3xl font-bold text-surface-ink truncate tracking-tight">{value}</p>
        {sub && <p className="text-xs text-surface-sub font-medium mt-1.5">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${VARIANT_STYLES[variant]}`}>
        {icon}
      </div>
    </motion.div>
  );
}
