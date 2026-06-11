'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, X } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/types/product';
import type { Product } from '@/types/product';
import { apiFetch } from '@/lib/utils/apiFetch';

// ============================================================
// Types
// ============================================================

type ProductFormData = Omit<Product, '_id' | 'slug' | 'createdAt' | 'updatedAt'>;

interface ProductFormProps {
  /** Pass existing product to edit; omit for create mode */
  initialData?: Product;
  onSuccess?: () => void;
}

const DEFAULT_FORM: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: 'pomade',
  image_url: '',
  images: [],
  tags: [],
  is_active: true,
};

// ============================================================
// Component
// ============================================================

export default function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [form, setForm] = useState<ProductFormData>(
    initialData
      ? {
        name: initialData.name,
        description: initialData.description,
        price: initialData.price,
        stock: initialData.stock,
        category: initialData.category,
        image_url: initialData.image_url,
        images: initialData.images || [],
        tags: initialData.tags,
        is_active: initialData.is_active,
      }
      : DEFAULT_FORM
  );

  const [tagInput, setTagInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ---- Handlers ----

  const handleChange = useCallback(
    <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      handleChange('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    handleChange('tags', form.tags.filter((t) => t !== tag));
  };

  const addImage = () => {
    const url = imageInput.trim();
    if (url && !(form.images || []).includes(url)) {
      handleChange('images', [...(form.images || []), url]);
    }
    setImageInput('');
  };

  const removeImage = (url: string) => {
    handleChange('images', (form.images || []).filter((u) => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isEdit) {
        await apiFetch(`/api/products/${initialData._id}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }

      router.refresh();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Render ----

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-surface-ink mb-2">Nama Produk *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="input-field"
          placeholder="contoh: Pomade"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-surface-ink mb-2">Deskripsi *</label>
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="input-field resize-none"
          placeholder="Deskripsi singkat produk..."
        />
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-surface-ink mb-2">Harga (Rp) *</label>
          <input
            type="number"
            required
            min={0}
            value={form.price}
            onChange={(e) => handleChange('price', Number(e.target.value))}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-surface-ink mb-2">Stok *</label>
          <input
            type="number"
            required
            min={0}
            value={form.stock}
            onChange={(e) => handleChange('stock', Number(e.target.value))}
            className="input-field"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-surface-ink mb-2">Kategori *</label>
        <select
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value as Product['category'])}
          className="input-field appearance-none cursor-pointer"
        >
          {PRODUCT_CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.emoji} {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Image URL (Utama) */}
      <div>
        <label className="block text-sm font-semibold text-surface-ink mb-2">URL Gambar Utama *</label>
        <input
          type="url"
          required
          value={form.image_url}
          onChange={(e) => handleChange('image_url', e.target.value)}
          className="input-field"
          placeholder="https://..."
        />
        {form.image_url && (
          <div className="mt-3 relative w-20 h-20 rounded border border-surface-muted bg-surface-raised overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Galeri Gambar (Tambahan) */}
      <div>
        <label className="block text-sm font-semibold text-surface-ink mb-2">Galeri Gambar (Opsional)</label>
        
        {form.images && form.images.length > 0 && (
          <div className="flex gap-3 mb-3 flex-wrap">
            {form.images.map((imgUrl, i) => (
              <div key={i} className="relative w-20 h-20 rounded border border-surface-muted bg-surface-raised overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt={`gallery-${i}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(imgUrl)}
                  className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="url"
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addImage(); }
            }}
            className="input-field flex-1"
            placeholder="URL gambar tambahan, tekan Enter"
          />
          <button type="button" onClick={addImage} className="btn-secondary px-4">
            Tambah
          </button>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold text-surface-ink mb-2">Tags</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 bg-surface-raised text-surface-sub text-xs font-medium px-3 py-1 rounded border border-surface-muted"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-surface-border hover:text-red-600 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(); }
            }}
            className="input-field flex-1"
            placeholder="Tambah tag, tekan Enter"
          />
          <button type="button" onClick={addTag} className="btn-secondary px-4">
            Tambah
          </button>
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleChange('is_active', !form.is_active)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.is_active ? 'bg-surface-ink' : 'bg-surface-muted'
            }`}
          role="switch"
          aria-checked={form.is_active}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.is_active ? 'translate-x-5' : 'translate-x-0'
              }`}
          />
        </button>
        <span className="text-sm font-medium text-surface-ink">
          Produk {form.is_active ? 'Aktif' : 'Tidak Aktif'}
        </span>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4 border-t border-surface-muted">
        <button
          type="button"
          onClick={() => onSuccess?.()}
          className="btn-ghost flex-1"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEdit ? 'Simpan' : 'Tambah'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
