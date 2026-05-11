'use client';

import React from 'react';
import { Camera, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileContentProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const handleEdit = (field: string) => {
    toast.info(`Fitur ubah ${field} akan segera hadir.`);
  };

  return (
    <div className="bg-surface rounded-xl border border-surface-muted p-6 flex flex-col md:flex-row gap-8 shadow-sm">
      {/* Profile Picture Section */}
      <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
        <div className="w-64 h-64 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 font-bold text-6xl shadow-inner border border-brand-200 overflow-hidden relative group">
          {/* Mock Avatar - taking first letter */}
          {user.name.charAt(0).toUpperCase()}
          
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
            <Camera className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Ubah Foto</span>
          </div>
        </div>
        
        <button 
          onClick={() => handleEdit('Foto Profil')}
          className="w-full py-2.5 px-4 bg-white border border-brand-300 text-brand-700 rounded-lg font-semibold hover:bg-brand-50 transition-colors shadow-sm"
        >
          Pilih Foto
        </button>
        
        <p className="text-xs text-surface-sub text-center mt-2 leading-relaxed">
          Besar file: maksimum 10.000.000 bytes (10 Megabytes). Ekstensi file yang diperbolehkan: .JPG .JPEG .PNG
        </p>
      </div>

      {/* Profile Data Section */}
      <div className="flex flex-col flex-1 gap-8">
        {/* Ubah Biodata Diri */}
        <div>
          <h3 className="font-bold text-brand-900 text-lg mb-4">Ubah Biodata Diri</h3>
          
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 md:col-span-3 text-sm text-surface-sub">Nama</div>
              <div className="col-span-8 md:col-span-9 flex items-center gap-4">
                <span className="text-sm text-brand-900 font-medium">{user.name}</span>
                <button onClick={() => handleEdit('Nama')} className="text-xs font-semibold text-brand-500 hover:text-brand-700 transition-colors">Ubah</button>
              </div>
            </div>
            
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 md:col-span-3 text-sm text-surface-sub">Tanggal Lahir</div>
              <div className="col-span-8 md:col-span-9 flex items-center gap-4">
                <span className="text-sm text-brand-900 font-medium">-</span>
                <button onClick={() => handleEdit('Tanggal Lahir')} className="text-xs font-semibold text-brand-500 hover:text-brand-700 transition-colors">Ubah Tanggal Lahir</button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 md:col-span-3 text-sm text-surface-sub">Jenis Kelamin</div>
              <div className="col-span-8 md:col-span-9 flex items-center gap-4">
                <span className="text-sm text-brand-900 font-medium">-</span>
                <button onClick={() => handleEdit('Jenis Kelamin')} className="text-xs font-semibold text-brand-500 hover:text-brand-700 transition-colors">Ubah</button>
              </div>
            </div>
          </div>
        </div>

        {/* Ubah Kontak */}
        <div>
          <h3 className="font-bold text-brand-900 text-lg mb-4">Ubah Kontak</h3>
          
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 md:col-span-3 text-sm text-surface-sub">Email</div>
              <div className="col-span-8 md:col-span-9 flex items-center flex-wrap gap-2 md:gap-4">
                <span className="text-sm text-brand-900 font-medium">{user.email}</span>
                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  Terverifikasi
                </span>
                <button onClick={() => handleEdit('Email')} className="text-xs font-semibold text-brand-500 hover:text-brand-700 transition-colors">Ubah</button>
              </div>
            </div>
            
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 md:col-span-3 text-sm text-surface-sub">Nomor HP</div>
              <div className="col-span-8 md:col-span-9 flex items-center flex-wrap gap-2 md:gap-4">
                <span className="text-sm text-brand-900 font-medium">-</span>
                <button onClick={() => handleEdit('Nomor HP')} className="text-xs font-semibold text-brand-500 hover:text-brand-700 transition-colors">Ubah</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
