import type { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Optional: subtitle text below value */
  sub?: string;
  /** Optional: color accent variant */
  variant?: 'default' | 'brand' | 'blue' | 'green' | 'purple';
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
  icon: Icon,
  sub,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className="glass-card p-5 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="label-upper mb-1">{label}</p>
        <p className="text-2xl font-bold text-surface-ink truncate">{value}</p>
        {sub && <p className="text-[11px] text-surface-sub font-medium mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${VARIANT_STYLES[variant]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
