'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface Address {
  _id?: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  district: string;
  district_id: string;
  postal_code: string;
  is_default: boolean;
}



interface Props {
  initialAddresses: Address[];
}

export default function ProfileAddressList({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Address>({
    recipient_name: '', phone: '', address: '', city: '', province: '', district: '', district_id: '', postal_code: '', is_default: false
  });
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<{id: string, name: string}[]>([]);
  const [cities, setCities] = useState<{id: string, name: string}[]>([]);
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([]);
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');

  React.useEffect(() => {
    fetch('/api/shipping/wilayah?type=province')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProvinces(data);
      })
      .catch(console.error);
  }, []);

  React.useEffect(() => {
    if (selectedProvId) {
      fetch(`/api/shipping/wilayah?type=kabupaten&id=${selectedProvId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setCities(data);
        })
        .catch(console.error);
    } else {
      setCities([]);
      setSelectedCityId('');
    }
  }, [selectedProvId]);

  React.useEffect(() => {
    if (selectedCityId) {
      fetch(`/api/shipping/wilayah?type=kecamatan&id=${selectedCityId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setDistricts(data);
        })
        .catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [selectedCityId]);

  const handleOpenForm = (addr?: Address) => {
    if (addr) {
      setFormData(addr);
      setEditingId(addr._id || null);
      // Try to find province ID to load cities
      const prov = provinces.find(p => p.name === addr.province);
      if (prov) {
        setSelectedProvId(prov.id);
        fetch(`/api/shipping/wilayah?type=kabupaten&id=${prov.id}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setCities(data);
              const city = data.find((c: any) => c.name === addr.city);
              if (city) setSelectedCityId(city.id);
            }
          });
      }
    } else {
      setFormData({ recipient_name: '', phone: '', address: '', city: '', province: '', district: '', district_id: '', postal_code: '', is_default: addresses.length === 0 });
      setEditingId(null);
      setSelectedProvId('');
      setSelectedCityId('');
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `/api/user/addresses/${editingId}` : '/api/user/addresses';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
      
      setAddresses(data.addresses);
      toast.success(editingId ? 'Alamat berhasil diperbarui' : 'Alamat berhasil ditambahkan');
      handleCloseForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus alamat ini?')) return;
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAddresses(data.addresses);
      toast.success('Alamat berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAddresses(data.addresses);
      toast.success('Alamat utama berhasil diubah');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isFormOpen) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-surface-ink">{editingId ? 'Ubah Alamat' : 'Tambah Alamat Baru'}</h3>
          <button onClick={handleCloseForm} className="text-sm text-surface-sub hover:text-surface-ink transition-colors">Batal</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-surface-sub uppercase mb-1.5">Alamat Lengkap</label>
              <textarea required rows={3} className="input-field resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-sub uppercase mb-1.5">Provinsi</label>
              <select required className="input-field appearance-none" value={formData.province} onChange={e => {
                const name = e.target.value;
                setFormData({...formData, province: name, city: '', district: '', district_id: ''});
                const prov = provinces.find(p => p.name === name);
                setSelectedProvId(prov ? prov.id : '');
              }}>
                <option value="">-- Pilih Provinsi --</option>
                {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-sub uppercase mb-1.5">Kota/Kabupaten</label>
              <select required className="input-field appearance-none" value={formData.city} onChange={e => {
                const name = e.target.value;
                setFormData({...formData, city: name, district: '', district_id: ''});
                const city = cities.find(c => c.name === name);
                setSelectedCityId(city ? city.id : '');
              }} disabled={!selectedProvId}>
                <option value="">-- Pilih Kota/Kabupaten --</option>
                {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-sub uppercase mb-1.5">Kecamatan</label>
              <select required className="input-field appearance-none" value={formData.district} onChange={e => {
                const name = e.target.value;
                const district = districts.find(d => d.name === name);
                setFormData({...formData, district: name, district_id: district ? `district_${district.id}` : ''});
              }} disabled={!selectedCityId}>
                <option value="">-- Pilih Kecamatan --</option>
                {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-sub uppercase mb-1.5">Kode Pos</label>
              <input required className="input-field" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value.replace(/\D/g, '')})} maxLength={5} />
            </div>
            <div className="hidden md:block"></div>
            <div>
              <label className="block text-xs font-semibold text-surface-sub uppercase mb-1.5">Nama Penerima</label>
              <input required className="input-field" value={formData.recipient_name} onChange={e => setFormData({...formData, recipient_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-sub uppercase mb-1.5">Nomor Telepon</label>
              <input required type="tel" className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="is_default" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} className="w-4 h-4 rounded border-surface-muted text-surface-ink focus:ring-surface-ink" />
            <label htmlFor="is_default" className="text-sm text-surface-ink cursor-pointer">Jadikan alamat utama</label>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={handleCloseForm} className="btn-secondary">Batal</button>
            <button type="submit" disabled={loading} className="btn-primary min-w-[120px] justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Alamat'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-surface-ink">Daftar Alamat</h3>
          <p className="text-sm text-surface-sub">Kelola alamat pengiriman Anda</p>
        </div>
        <button onClick={() => handleOpenForm()} className="btn-primary text-sm px-4 py-2">
          <Plus className="w-4 h-4" /> Tambah Alamat
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-surface-muted rounded-xl bg-surface-raised/50">
          <MapPin className="w-12 h-12 text-surface-sub mx-auto mb-3 opacity-50" />
          <h4 className="text-surface-ink font-medium">Belum ada alamat</h4>
          <p className="text-sm text-surface-sub mt-1 mb-4">Tambahkan alamat pengiriman untuk mempermudah checkout</p>
          <button onClick={() => handleOpenForm()} className="btn-secondary text-sm mx-auto">
            Mulai Tambah Alamat
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((addr) => (
            <div key={addr._id} className={`p-4 rounded-xl border transition-colors ${addr.is_default ? 'border-surface-ink bg-surface-ink/5' : 'border-surface-muted hover:border-surface-border'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-surface-ink">{addr.recipient_name}</span>
                    {addr.is_default && (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Utama
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-sub">{addr.phone}</p>
                  <p className="text-sm text-surface-ink leading-relaxed">
                    {addr.address}<br />
                    Kec. {addr.district}, {addr.city}, {addr.province} {addr.postal_code}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleOpenForm(addr)} className="text-xs font-medium text-surface-sub hover:text-surface-ink flex items-center gap-1 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" /> Ubah
                    </button>
                    <button onClick={() => addr._id && handleDelete(addr._id)} className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                  {!addr.is_default && addr._id && (
                    <button onClick={() => handleSetDefault(addr._id!)} className="text-xs font-medium text-surface-ink underline underline-offset-2 mt-2 transition-colors">
                      Jadikan Utama
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
