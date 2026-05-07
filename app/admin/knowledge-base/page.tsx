'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import PDFUploader from '@/components/admin/PDFUploader';
import { apiFetch } from '@/lib/utils/apiFetch';

interface EmbeddedSource {
  source: string;
  chunkCount: number;
  createdAt: string;
}

export default function KnowledgeBasePage() {
  const [sources, setSources] = useState<EmbeddedSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSources = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ data: EmbeddedSource[] }>('/api/ai/embed');
      setSources(data.data);
    } catch {
      setSources([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">Knowledge Base</h1>
          <p className="text-surface-sub text-sm mt-1">
            Upload dokumen produk untuk melatih RAG AI WhatsApp Agent.
          </p>
        </div>
        <button
          onClick={fetchSources}
          disabled={isLoading}
          className="btn-ghost p-2.5"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Info card */}
      <div className="bg-surface-raised border-l-4 border-l-surface-ink border border-y-surface-muted border-r-surface-muted p-5 rounded-r-lg text-sm text-surface-sub leading-relaxed">
        <strong className="text-surface-ink font-semibold">Cara kerja:</strong> Dokumen yang diupload akan dipecah menjadi
        chunk-chunk kecil, diubah menjadi vector embedding oleh OpenAI, dan disimpan di MongoDB Atlas
        untuk digunakan oleh WhatsApp AI Agent saat menjawab pertanyaan pelanggan.
      </div>

      {/* Uploader */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-surface-ink" />
        </div>
      ) : (
        <div className="glass-card p-6 lg:p-8">
          <PDFUploader sources={sources} onRefresh={fetchSources} />
        </div>
      )}
    </div>
  );
}
