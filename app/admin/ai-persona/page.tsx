'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Save, RotateCcw, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { apiFetch } from '@/lib/utils/apiFetch';

// ============================================================
// Types
// ============================================================

interface PersonaData {
  _id: string;
  name: string;
  systemPrompt: string;
  updatedAt: string;
}

// ============================================================
// Tips card
// ============================================================

const PERSONA_TIPS = [
  { text: 'Tentukan nama dan kepribadian bot Anda (ramah, formal, santai, dll).' },
  { text: 'Tambahkan aturan yang jelas mengenai batasan jawaban bot.' },
  { text: 'Sebutkan bahasa yang digunakan untuk merespons pelanggan.' },
  { text: 'Definisikan cara bot menutup percakapan.' },
];

// ============================================================
// Page
// ============================================================

export default function AiPersonaPage() {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ---- Fetch current persona ----
  const fetchPersona = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ data: PersonaData }>('/api/admin/persona');
      setName(data.data.name);
      setSystemPrompt(data.data.systemPrompt);
      setOriginalPrompt(data.data.systemPrompt);
      setLastUpdated(data.data.updatedAt);
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersona();
  }, [fetchPersona]);

  // ---- Save persona ----
  const handleSave = async () => {
    if (!systemPrompt.trim()) return;
    setIsSaving(true);
    setStatus('idle');

    try {
      const data = await apiFetch<{ data: PersonaData }>('/api/admin/persona', {
        method: 'PUT',
        body: JSON.stringify({ name, systemPrompt }),
      });
      setOriginalPrompt(data.data.systemPrompt);
      setLastUpdated(data.data.updatedAt);
      setStatus('success');
      setStatusMessage('Persona berhasil disimpan. Aktif dalam 60 detik.');
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message);
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        if (isMounted.current) setStatus('idle');
      }, 5000);
    }
  };

  const handleReset = () => {
    setSystemPrompt(originalPrompt);
  };

  const isDirty = systemPrompt !== originalPrompt;
  const charCount = systemPrompt.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-surface-ink" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">AI Persona</h1>
          <p className="text-surface-sub text-sm mt-1">
            Kustomisasi karakter dan kepribadian WhatsApp AI Agent Anda.
          </p>
          {lastUpdated && (
            <p className="text-[11px] font-medium text-surface-border mt-1">
              TERAKHIR DIPERBARUI:{' '}
              {new Date(lastUpdated).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isDirty && (
            <button onClick={handleReset} className="btn-ghost flex-1 sm:flex-none">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty || !systemPrompt.trim()}
            className="btn-primary flex-1 sm:flex-none"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>

      {/* Status banner */}
      {status !== 'idle' && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded border text-sm font-medium ${
          status === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {status === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5 lg:p-6">
            <label className="block text-sm font-semibold text-surface-ink mb-3">Nama Bot</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border border-surface-muted bg-surface-raised flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-surface-ink" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Nama AI bot..."
              />
            </div>
          </div>

          <div className="glass-card p-5 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-surface-ink">System Prompt</label>
              <span className={`text-[11px] font-mono font-medium ${charCount > 3000 ? 'text-accent-dark' : 'text-surface-sub'}`}>
                {charCount.toLocaleString()} / 4000
              </span>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={18}
              className="input-field resize-y font-mono text-[13px] leading-relaxed w-full bg-surface-raised"
              placeholder="Tulis instruksi sistem untuk bot di sini..."
              spellCheck={false}
            />
            {isDirty && (
              <p className="text-[11px] font-medium text-accent-dark mt-3 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-dark" />
                Ada perubahan yang belum disimpan
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-surface-ink shrink-0" />
              <h3 className="text-sm font-semibold text-surface-ink">Cara Kerja</h3>
            </div>
            <p className="text-sm text-surface-sub leading-relaxed">
              Instruksi ini akan menjadi fondasi kepribadian bot. Perubahan memerlukan waktu sekitar <strong>60 detik</strong> untuk diterapkan ke WhatsApp.
            </p>
          </div>

          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-surface-ink">Panduan Penulisan</h3>
            <ul className="space-y-3">
              {PERSONA_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-surface-sub">
                  <span className="w-1 h-1 rounded-full bg-surface-border mt-2 shrink-0" />
                  <span className="leading-relaxed">{tip.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-surface-ink">Preview Respons</h3>
            <div className="bg-surface-raised border border-surface-muted rounded p-4 space-y-3">
              <div className="flex justify-start">
                <div className="bg-white border border-surface-muted text-surface-ink text-sm px-3.5 py-2.5 rounded-lg rounded-tl-sm max-w-[85%] shadow-sm">
                  Halo, ada produk styling apa saja?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-surface-ink text-white text-sm px-3.5 py-2.5 rounded-lg rounded-tr-sm max-w-[85%] shadow-sm">
                  Halo! Saya {name || 'Asisten Chief'}.<br />
                  <span className="text-white/70 mt-1 block">Tentu, kami memiliki beberapa pilihan produk premium untuk Anda...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
