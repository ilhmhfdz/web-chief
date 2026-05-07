'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Package } from 'lucide-react';
import Image from 'next/image';
import ProductForm from '@/components/admin/ProductForm';
import { formatPrice } from '@/lib/utils/format';
import { apiFetch } from '@/lib/utils/apiFetch';
import type { Product, ProductsApiResponse } from '@/types/product';

// ============================================================
// Modal wrapper
// ============================================================

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-card p-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-5">
          <h3 className="heading-md">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState<'create' | 'edit' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<ProductsApiResponse>('/api/products?limit=48&sort=newest');
      setProducts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreate = () => { setSelectedProduct(null); setModalOpen('create'); };
  const openEdit = (p: Product) => { setSelectedProduct(p); setModalOpen('edit'); };
  const closeModal = () => { setModalOpen(null); setSelectedProduct(null); };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Yakin hapus produk "${product.name}"?`)) return;
    setDeletingId(product._id);
    try {
      await apiFetch(`/api/products/${product._id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">Manajemen Produk</h1>
          <p className="text-surface-sub text-sm mt-1">{products.length} produk terdaftar</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-surface-ink" />
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-surface-border mx-auto" />
          <p className="text-surface-sub">Belum ada produk. Klik "Tambah Produk" untuk mulai.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-clean">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">Stok</th>
                  <th className="text-center">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="group">
                    <td className="w-1/3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded border border-surface-muted bg-surface-raised shrink-0 overflow-hidden">
                          <Image src={product.image_url} alt={product.name} fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-surface-ink truncate">{product.name}</p>
                          <p className="text-[11px] text-surface-border font-mono truncate">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-surface-sub capitalize">{product.category}</td>
                    <td className="text-right font-semibold text-surface-ink">{formatPrice(product.price)}</td>
                    <td className="text-right">
                      <span className={product.stock === 0 ? 'text-red-600 font-semibold' : product.stock <= 5 ? 'text-accent-dark font-semibold' : 'text-surface-ink'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={product.is_active ? 'badge-dark' : 'badge-default'}>
                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(product)} className="btn-ghost p-1.5 hover:text-surface-ink">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product._id}
                          className="btn-ghost p-1.5 hover:text-red-600 disabled:opacity-40"
                        >
                          {deletingId === product._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

      {/* Modal */}
      {modalOpen && (
        <Modal title={modalOpen === 'create' ? 'Tambah Produk Baru' : 'Edit Produk'} onClose={closeModal}>
          <ProductForm
            initialData={selectedProduct ?? undefined}
            onSuccess={() => { closeModal(); fetchProducts(); }}
          />
        </Modal>
      )}
    </div>
  );
}
