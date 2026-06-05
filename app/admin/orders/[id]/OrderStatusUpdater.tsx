'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, CreditCard, Settings2, Truck,
  CheckCircle2, XCircle, Loader2, CheckCircle, AlertCircle,
} from 'lucide-react';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUSES = [
  {
    value: 'pending',
    label: 'Menunggu',
    sublabel: 'Pembayaran',
    icon: Clock,
    dot: '#f59e0b',        // amber-400
    activeText: 'text-amber-800',
    activeBg: 'bg-amber-50',
    activeBorder: 'border-amber-400',
    activeRing: 'ring-amber-200',
    activeDot: 'bg-amber-400',
  },
  {
    value: 'paid',
    label: 'Dibayar',
    sublabel: '',
    icon: CreditCard,
    dot: '#3b82f6',        // blue-500
    activeText: 'text-blue-800',
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-400',
    activeRing: 'ring-blue-200',
    activeDot: 'bg-blue-400',
  },
  {
    value: 'processing',
    label: 'Diproses',
    sublabel: '',
    icon: Settings2,
    dot: '#a855f7',        // purple-500
    activeText: 'text-purple-800',
    activeBg: 'bg-purple-50',
    activeBorder: 'border-purple-400',
    activeRing: 'ring-purple-200',
    activeDot: 'bg-purple-400',
  },
  {
    value: 'shipped',
    label: 'Dikirim',
    sublabel: '',
    icon: Truck,
    dot: '#06b6d4',        // cyan-500
    activeText: 'text-cyan-800',
    activeBg: 'bg-cyan-50',
    activeBorder: 'border-cyan-400',
    activeRing: 'ring-cyan-200',
    activeDot: 'bg-cyan-400',
  },
  {
    value: 'delivered',
    label: 'Tiba',
    sublabel: 'di Tujuan',
    icon: CheckCircle2,
    dot: '#22c55e',        // green-500
    activeText: 'text-green-800',
    activeBg: 'bg-green-50',
    activeBorder: 'border-green-400',
    activeRing: 'ring-green-200',
    activeDot: 'bg-green-400',
  },
  {
    value: 'cancelled',
    label: 'Dibatalkan',
    sublabel: '',
    icon: XCircle,
    dot: '#ef4444',        // red-500
    activeText: 'text-red-800',
    activeBg: 'bg-red-50',
    activeBorder: 'border-red-400',
    activeRing: 'ring-red-200',
    activeDot: 'bg-red-400',
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isDirty = selected !== currentStatus;
  const selectedConfig = STATUSES.find((s) => s.value === selected);

  const handleSave = async () => {
    if (!isDirty) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selected }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Gagal mengubah status');
      }

      setMessage({ type: 'success', text: 'Status berhasil diperbarui!' });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-surface-muted bg-surface-raised/50">
        <p className="text-xs font-semibold uppercase tracking-widest text-surface-sub">
          Ubah Status Pesanan
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* 
          Semantic approach: visually styled as cards but uses proper 
          radio input semantics for accessibility (WCAG 2.1) 
        */}
        <fieldset className="border-0 p-0 m-0" aria-label="Status pesanan">
          <legend className="sr-only">Pilih status pesanan baru</legend>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => {
              const isSelected = selected === s.value;
              const Icon = s.icon;
              return (
                <label
                  key={s.value}
                  className={`
                    relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                    transition-all duration-150 ease-out select-none
                    ${isSelected
                      ? `${s.activeBg} ${s.activeBorder} ${s.activeText} ring-2 ${s.activeRing}`
                      : 'bg-white border-surface-muted text-surface-sub hover:border-surface-border hover:bg-surface-raised/60'
                    }
                  `}
                >
                  {/* Visually hidden native radio — preserves semantics & keyboard nav */}
                  <input
                    type="radio"
                    name="order-status"
                    value={s.value}
                    checked={isSelected}
                    onChange={() => { setSelected(s.value); setMessage(null); }}
                    className="sr-only"
                  />

                  {/* Status icon */}
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-all ${
                      isSelected ? 'bg-white/70 shadow-sm' : 'bg-surface-raised'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? s.activeText : 'text-surface-border'}`} />
                  </span>

                  {/* Label text */}
                  <span className="flex-1 min-w-0 leading-tight">
                    <span className={`block text-xs font-semibold ${isSelected ? s.activeText : 'text-surface-ink'}`}>
                      {s.label}
                    </span>
                    {s.sublabel && (
                      <span className={`block text-[10px] ${isSelected ? s.activeText : 'text-surface-sub'} opacity-70`}>
                        {s.sublabel}
                      </span>
                    )}
                  </span>

                  {/* Selection indicator dot */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                      isSelected ? s.activeDot : 'bg-surface-muted'
                    }`}
                  />
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Selected status preview */}
        {isDirty && selectedConfig && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${selectedConfig.activeBg} ${selectedConfig.activeBorder} ${selectedConfig.activeText}`}>
            <selectedConfig.icon className="w-3.5 h-3.5 shrink-0" />
            <span>Akan diubah ke: <strong>{selectedConfig.label}{selectedConfig.sublabel ? ' ' + selectedConfig.sublabel : ''}</strong></span>
          </div>
        )}

        {/* Feedback message */}
        {message && (
          <div className={`flex items-center gap-2 text-xs p-3 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.type === 'success'
              ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!isDirty || loading}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
            text-sm font-semibold tracking-wide transition-all duration-150 ease-out
            ${isDirty && !loading
              ? 'bg-surface-ink text-white hover:bg-surface-ink/85 active:scale-[0.98] shadow-sm'
              : 'bg-surface-raised text-surface-border cursor-not-allowed'
            }
          `}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></>
          ) : isDirty ? (
            <><CheckCircle className="w-4 h-4" /><span>Simpan Status</span></>
          ) : (
            <span>Pilih status baru untuk menyimpan</span>
          )}
        </button>
      </div>
    </div>
  );
}
