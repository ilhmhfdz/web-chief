'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Sparkles, ExternalLink, CheckCircle, XCircle,
  Trash2, X, Loader2, ChevronDown, ChevronUp, Globe,
  FileText, PenLine, Eye, EyeOff, Edit
} from 'lucide-react';
import { toast } from 'sonner';
import RichTextEditor from '@/components/admin/RichTextEditor';

// ============================================================
// Types
// ============================================================

export interface ArticleRow {
  _id: string;
  slug: string;
  title: string;
  current_content?: string;
  meta_description?: string;
  is_active: boolean;
  last_adapted_at: string | null;
  geo_keywords: string[];
  version_count: number;
}

// ============================================================
// Helpers
// ============================================================

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="badge-default text-green-700 bg-green-50 border-green-200">
      <CheckCircle className="w-3 h-3" /> Aktif
    </span>
  ) : (
    <span className="badge-default text-amber-700 bg-amber-50 border-amber-200">
      <FileText className="w-3 h-3" /> Draft
    </span>
  );
}

// ============================================================
// Modal — Create Article (Manual)
// ============================================================

function CreateArticleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: '',
    slug: '',
    current_content: '',
    meta_description: '',
    geo_keywords: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug || undefined,
          current_content: form.current_content,
          meta_description: form.meta_description,
          geo_keywords: form.geo_keywords.split(',').map((k) => k.trim()).filter(Boolean),
          is_active: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Artikel draft berhasil dibuat!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const autoSlug = form.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-ink/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-muted/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-ink flex items-center justify-center">
              <PenLine className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-surface-ink">Buat Artikel Manual</h2>
              <p className="text-xs text-surface-sub">Akan disimpan sebagai Draft</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="label-upper mb-1.5 block">Judul Artikel *</label>
            <input
              className="input-field"
              placeholder="Cara Merawat Rambut Pria Secara Alami"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label-upper mb-1.5 block">Slug URL</label>
            <input
              className="input-field font-mono text-sm"
              placeholder={autoSlug || 'cara-merawat-rambut-pria'}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <p className="text-xs text-surface-sub mt-1">
              Kosongkan untuk auto-generate dari judul:{' '}
              <code className="bg-surface-raised px-1 py-0.5 rounded">{autoSlug || '...'}</code>
            </p>
          </div>

          <div>
            <label className="label-upper mb-1.5 block">GEO Keywords</label>
            <input
              className="input-field"
              placeholder="pomade pria, cara styling rambut, gaya rambut 2024"
              value={form.geo_keywords}
              onChange={(e) => setForm({ ...form, geo_keywords: e.target.value })}
            />
            <p className="text-xs text-surface-sub mt-1">Pisahkan dengan koma</p>
          </div>

          <div>
            <label className="label-upper mb-1.5 block">Meta Description</label>
            <input
              className="input-field"
              placeholder="Panduan lengkap... (maks 160 karakter)"
              maxLength={160}
              value={form.meta_description}
              onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
            />
            <p className="text-xs text-surface-sub mt-1">{form.meta_description.length}/160 karakter</p>
          </div>

          <div>
            <label className="label-upper mb-1.5 block">Konten Artikel (HTML) *</label>
            <RichTextEditor
              content={form.current_content}
              onChange={(content) => setForm({ ...form, current_content: content })}
            />
            <p className="text-xs text-surface-sub mt-1">
              Gunakan editor untuk memformat teks dan menyisipkan gambar.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Batal
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              ) : (
                <><FileText className="w-4 h-4" /> Simpan Draft</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Modal — Edit Article
// ============================================================

function EditArticleModal({ article, onClose, onSuccess }: { article: ArticleRow; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: article.title,
    slug: article.slug,
    current_content: article.current_content || '',
    meta_description: article.meta_description || '',
    geo_keywords: article.geo_keywords.join(', '),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: article._id,
          title: form.title,
          slug: form.slug || undefined,
          current_content: form.current_content,
          meta_description: form.meta_description,
          geo_keywords: form.geo_keywords.split(',').map((k) => k.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Artikel berhasil diperbarui!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-ink/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-muted/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-ink flex items-center justify-center">
              <Edit className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-surface-ink">Edit Artikel</h2>
              <p className="text-xs text-surface-sub">Perbarui konten dan metadata</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="label-upper mb-1.5 block">Judul Artikel *</label>
            <input
              className="input-field"
              placeholder="Cara Merawat Rambut Pria Secara Alami"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label-upper mb-1.5 block">Slug URL</label>
            <input
              className="input-field font-mono text-sm"
              placeholder={article.slug}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>

          <div>
            <label className="label-upper mb-1.5 block">GEO Keywords</label>
            <input
              className="input-field"
              placeholder="pomade pria, cara styling rambut, gaya rambut 2024"
              value={form.geo_keywords}
              onChange={(e) => setForm({ ...form, geo_keywords: e.target.value })}
            />
            <p className="text-xs text-surface-sub mt-1">Pisahkan dengan koma</p>
          </div>

          <div>
            <label className="label-upper mb-1.5 block">Meta Description</label>
            <input
              className="input-field"
              placeholder="Panduan lengkap... (maks 160 karakter)"
              maxLength={160}
              value={form.meta_description}
              onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
            />
            <p className="text-xs text-surface-sub mt-1">{form.meta_description.length}/160 karakter</p>
          </div>

          <div>
            <label className="label-upper mb-1.5 block">Konten Artikel (HTML) *</label>
            <RichTextEditor
              content={form.current_content}
              onChange={(content) => setForm({ ...form, current_content: content })}
            />
            <p className="text-xs text-surface-sub mt-1">
              Gunakan editor untuk memformat teks dan menyisipkan gambar.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Batal
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              ) : (
                <><FileText className="w-4 h-4" /> Simpan Perubahan</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Modal — Generate Draft via AI
// ============================================================

function GenerateDraftModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    topic: '',
    geo_keywords: '',
    tone: 'profesional dan maskulin',
    referenceUrls: ['', '', ''],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUrls, setShowUrls] = useState(false);

  const handleUrlChange = (idx: number, val: string) => {
    const updated = [...form.referenceUrls];
    updated[idx] = val;
    setForm({ ...form, referenceUrls: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const validUrls = form.referenceUrls.filter((u) => u.trim());
      const res = await fetch('/api/admin/articles/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: form.topic,
          geo_keywords: form.geo_keywords.split(',').map((k) => k.trim()).filter(Boolean),
          tone: form.tone,
          referenceUrls: validUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Draft AI berhasil dibuat! Silakan review sebelum publish.', {
        duration: 5000,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-ink/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-muted/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-surface-ink">Generate Draft via AI</h2>
              <p className="text-xs text-surface-sub">Claude akan menulis artikel lengkap untukmu</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5" disabled={loading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* AI writing notice */}
          <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3 text-xs text-surface-sub leading-relaxed">
            <strong className="text-surface-ink">Human-in-the-Loop:</strong> Artikel akan disimpan
            sebagai <strong>Draft</strong> dan tidak langsung tayang. Kamu perlu review dan klik
            "Publish" setelah yakin kontennya sesuai.
          </div>

          <div>
            <label className="label-upper mb-1.5 block">Topik / Prompt Artikel *</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Cara memilih pomade yang tepat untuk rambut tebal dan bergelombang agar tahan seharian"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              required
              disabled={loading}
            />
            <p className="text-xs text-surface-sub mt-1">
              Semakin spesifik topiknya, semakin baik hasilnya
            </p>
          </div>

          <div>
            <label className="label-upper mb-1.5 block">Target Keywords</label>
            <input
              className="input-field"
              placeholder="pomade rambut tebal, hold kuat, gaya tahan lama"
              value={form.geo_keywords}
              onChange={(e) => setForm({ ...form, geo_keywords: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-surface-sub mt-1">Pisahkan dengan koma</p>
          </div>

          <div>
            <label className="label-upper mb-1.5 block">Tone Penulisan</label>
            <select
              className="input-field"
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
              disabled={loading}
            >
              <option value="profesional dan maskulin">Profesional & Maskulin (default)</option>
              <option value="santai dan friendly">Santai & Friendly</option>
              <option value="teknikal dan detail">Teknikal & Detail</option>
              <option value="inspiratif dan motivatif">Inspiratif & Motivatif</option>
            </select>
          </div>

          {/* Reference URLs (collapsible) */}
          <div>
            <button
              type="button"
              className="flex items-center gap-2 text-xs font-semibold text-surface-sub hover:text-surface-ink transition-colors"
              onClick={() => setShowUrls(!showUrls)}
              disabled={loading}
            >
              <Globe className="w-3.5 h-3.5" />
              URL Referensi (opsional)
              {showUrls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showUrls && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-surface-sub">
                  Tambahkan artikel referensi yang akan di-scrape AI sebagai bahan riset (maks 3 URL)
                </p>
                {form.referenceUrls.map((url, idx) => (
                  <input
                    key={idx}
                    className="input-field text-sm"
                    type="url"
                    placeholder={`https://example.com/artikel-referensi-${idx + 1}`}
                    value={url}
                    onChange={(e) => handleUrlChange(idx, e.target.value)}
                    disabled={loading}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Batal
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI sedang menulis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Draft
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Main Client Component
// ============================================================

export default function ArticlesPageClient({ initialArticles }: { initialArticles: ArticleRow[] }) {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleRow[]>(initialArticles);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  // Toggle is_active
  const handleToggle = async (article: ArticleRow) => {
    setTogglingId(article._id);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: article._id, is_active: !article.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setArticles((prev) =>
        prev.map((a) => (a._id === article._id ? { ...a, is_active: !a.is_active } : a))
      );
      toast.success(
        !article.is_active ? `"${article.title}" dipublikasikan!` : `"${article.title}" dijadikan Draft`
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete article
  const handleDelete = async (article: ArticleRow) => {
    if (!confirm(`Hapus artikel "${article.title}"?\nTindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingId(article._id);
    try {
      const res = await fetch(`/api/admin/articles?id=${article._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setArticles((prev) => prev.filter((a) => a._id !== article._id));
      toast.success('Artikel berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // After modal success, refresh server data
  const handleModalSuccess = () => {
    refresh();
    // Optimistic: refresh after short delay to catch DB write
    setTimeout(refresh, 1500);
  };

  return (
    <>
      {/* Modals */}
      {showCreateModal && (
        <CreateArticleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
      {editingArticle && (
        <EditArticleModal
          article={editingArticle}
          onClose={() => setEditingArticle(null)}
          onSuccess={handleModalSuccess}
        />
      )}
      {showGenerateModal && (
        <GenerateDraftModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn-primary gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate Draft AI
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-secondary gap-2"
        >
          <Plus className="w-4 h-4" />
          Buat Artikel Manual
        </button>
      </div>

      {/* Article Table */}
      {articles.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <FileText className="w-10 h-10 text-surface-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-surface-ink">Belum ada artikel</p>
          <p className="text-xs text-surface-sub mt-1 mb-5">
            Mulai dengan Generate Draft AI atau buat artikel manual
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowGenerateModal(true)} className="btn-primary gap-2 text-sm">
              <Sparkles className="w-3.5 h-3.5" /> Generate Draft AI
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-secondary gap-2 text-sm">
              <Plus className="w-3.5 h-3.5" /> Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-clean">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Terakhir Diadaptasi</th>
                  <th>Versi</th>
                  <th>Keywords</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article._id}>
                    {/* Title */}
                    <td className="max-w-[200px]">
                      <p className="font-semibold text-surface-ink truncate" title={article.title}>
                        {article.title}
                      </p>
                    </td>

                    {/* Slug */}
                    <td>
                      <code className="text-xs font-mono text-surface-sub bg-surface-raised px-1.5 py-0.5 rounded">
                        {article.slug}
                      </code>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge isActive={article.is_active} />
                    </td>

                    {/* Last Adapted */}
                    <td>
                      {article.last_adapted_at ? (
                        <div>
                          <p className="text-sm text-surface-ink">
                            {new Date(article.last_adapted_at).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-surface-sub mt-0.5">
                            {new Date(article.last_adapted_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-surface-border italic">Belum pernah</span>
                      )}
                    </td>

                    {/* Version count */}
                    <td>
                      <span className="badge-default">{article.version_count} versi</span>
                    </td>

                    {/* Keyword count */}
                    <td>
                      <span className="text-sm text-surface-sub">
                        {article.geo_keywords.length} keywords
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle publish/draft */}
                        <button
                          onClick={() => handleToggle(article)}
                          disabled={togglingId === article._id}
                          title={article.is_active ? 'Jadikan Draft' : 'Publish'}
                          className={`p-1.5 rounded transition-colors ${
                            article.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-surface-sub hover:bg-surface-raised'
                          }`}
                        >
                          {togglingId === article._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : article.is_active ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>

                        {/* View live */}
                        {article.is_active && (
                          <Link
                            href={`/articles/${article.slug}`}
                            target="_blank"
                            className="p-1.5 rounded text-surface-sub hover:text-surface-ink hover:bg-surface-raised transition-colors"
                            title="Lihat artikel"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => setEditingArticle(article)}
                          title="Edit artikel"
                          className="p-1.5 rounded text-surface-sub hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(article)}
                          disabled={deletingId === article._id}
                          title="Hapus artikel"
                          className="p-1.5 rounded text-surface-sub hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          {deletingId === article._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
