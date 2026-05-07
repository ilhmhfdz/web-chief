'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Loader2, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { apiFetch } from '@/lib/utils/apiFetch';

// ============================================================
// Types
// ============================================================

interface EmbeddedSource {
  source: string;
  chunkCount: number;
  createdAt: string;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
}

interface PDFUploaderProps {
  sources: EmbeddedSource[];
  onRefresh: () => void;
}

// ============================================================
// Subcomponents
// ============================================================

function DropZone({
  onFileDrop,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
}: {
  onFileDrop: (file: File) => void;
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileDrop(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileDrop(file);
    e.target.value = ''; // reset input
  };

  return (
    <div
      onDrop={handleDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 p-10 rounded border-2 border-dashed transition-all duration-200 cursor-pointer ${
        isDragging
          ? 'border-surface-ink bg-surface-raised'
          : 'border-surface-muted hover:border-surface-border hover:bg-surface-raised/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className={`w-12 h-12 rounded flex items-center justify-center transition-colors ${isDragging ? 'bg-surface-ink text-white' : 'bg-surface-raised border border-surface-muted text-surface-sub'}`}>
        <Upload className="w-5 h-5" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-surface-ink">
          {isDragging ? 'Lepaskan file di sini' : 'Drag & drop atau klik untuk upload'}
        </p>
        <p className="text-xs text-surface-sub mt-1">Mendukung file .txt dan .pdf</p>
      </div>
    </div>
  );
}

function UploadStatusBanner({ state, onDismiss }: { state: UploadState; onDismiss: () => void }) {
  if (state.status === 'idle') return null;

  const styles = {
    uploading: 'bg-surface-raised border-surface-muted text-surface-ink',
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
  };

  const icons = {
    uploading: <Loader2 className="w-4 h-4 animate-spin shrink-0" />,
    success: <CheckCircle className="w-4 h-4 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 shrink-0" />,
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded border text-sm font-medium ${styles[state.status]}`}>
      {icons[state.status]}
      <span className="flex-1">{state.message}</span>
      {state.status !== 'uploading' && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function PDFUploader({ sources, onRefresh }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', message: '' });
  const [deletingSource, setDeletingSource] = useState<string | null>(null);

  // ---- Upload ----

  const uploadFile = useCallback(async (file: File) => {
    setUploadState({ status: 'uploading', message: `Memproses "${file.name}"...` });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ai/embed', {
        method: 'POST',
        body: formData, // No Content-Type header — browser sets multipart boundary
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setUploadState({
        status: 'success',
        message: `✓ "${file.name}" berhasil diproses (${data.chunkCount} chunks)`,
      });
      onRefresh();
    } catch (err: any) {
      setUploadState({ status: 'error', message: err.message ?? 'Upload gagal' });
    }
  }, [onRefresh]);

  // ---- Delete ----

  const deleteSource = useCallback(async (source: string) => {
    setDeletingSource(source);
    try {
      await apiFetch('/api/ai/embed', {
        method: 'DELETE',
        body: JSON.stringify({ source }),
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingSource(null);
    }
  }, [onRefresh]);

  // ---- Drag events ----

  const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  return (
    <div className="space-y-6">
      <DropZone
        onFileDrop={uploadFile}
        isDragging={isDragging}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
      />

      <UploadStatusBanner
        state={uploadState}
        onDismiss={() => setUploadState({ status: 'idle', message: '' })}
      />

      {/* Source list */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <p className="label-upper mb-2">
            Dokumen Tersimpan ({sources.length})
          </p>
          {sources.map((src) => (
            <div
              key={src.source}
              className="flex items-center gap-3 px-4 py-3 glass-card"
            >
              <FileText className="w-4 h-4 text-surface-ink shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-ink truncate">{src.source}</p>
                <p className="text-xs font-medium text-surface-sub">{src.chunkCount} chunks</p>
              </div>
              <button
                onClick={() => deleteSource(src.source)}
                disabled={deletingSource === src.source}
                className="text-surface-sub hover:text-red-600 transition-colors disabled:opacity-40"
                aria-label={`Hapus ${src.source}`}
              >
                {deletingSource === src.source ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
