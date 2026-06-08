'use client';

import { useState, useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, CreditCard, Truck, ChevronRight, ChevronDown,
  Loader2, ShieldCheck, Check, AlertCircle, Phone, User, Home
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';

// ── Types ──────────────────────────────────────────────────────
interface ShippingAddress {
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  district: string;
  district_id: string;
  postal_code: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  logo: string;      // emoji or svg path
  logoType: 'emoji' | 'svg';
  badge?: string;
  disabled?: boolean;
}

// ── Payment methods (dummy — ready for Midtrans) ───────────────
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'bca_va',
    name: 'BCA Virtual Account',
    description: 'Transfer via ATM, m-Banking, atau i-Banking BCA',
    logo: 'BCA',
    logoType: 'svg',
    badge: 'Populer',
  },
  {
    id: 'bni_va',
    name: 'BNI Virtual Account',
    description: 'Transfer via ATM, m-Banking, atau i-Banking BNI',
    logo: 'BNI',
    logoType: 'svg',
  },
  {
    id: 'mandiri_va',
    name: 'Mandiri Virtual Account',
    description: 'Transfer via ATM, m-Banking, atau i-Banking Mandiri',
    logo: 'MDR',
    logoType: 'svg',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    description: 'Bayar dengan saldo GoPay di aplikasi Gojek',
    logo: 'GP',
    logoType: 'svg',
    badge: 'Cashback 5%',
  },
  {
    id: 'ovo',
    name: 'OVO',
    description: 'Bayar dengan saldo OVO',
    logo: 'OVO',
    logoType: 'svg',
  },
  {
    id: 'dana',
    name: 'DANA',
    description: 'Bayar dengan saldo DANA',
    logo: 'DANA',
    logoType: 'svg',
  },
  {
    id: 'qris',
    name: 'QRIS',
    description: 'Scan QR dari aplikasi bank atau e-wallet apapun',
    logo: 'QR',
    logoType: 'svg',
    badge: 'Universal',
  },
  {
    id: 'cod',
    name: 'Bayar di Tempat (COD)',
    description: 'Bayar tunai saat paket tiba di tangan kamu',
    logo: 'COD',
    logoType: 'svg',
  },
];




// ── Step indicator ─────────────────────────────────────────────
const STEPS = ['Pengiriman', 'Pembayaran', 'Konfirmasi'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-green-600 text-white' : active ? 'bg-surface-ink text-white' : 'bg-surface-raised border border-surface-muted text-surface-sub'
              }`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${active ? 'text-surface-ink' : 'text-surface-sub'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 -mt-4 ${i < current ? 'bg-green-600' : 'bg-surface-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────
function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-bold text-surface-ink flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-surface-sub" /> {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ── Input helper ───────────────────────────────────────────────
function Field({
  label, required, error, children, className,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-surface-ink mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

// ── Payment logo ───────────────────────────────────────────────
const PM_LOGOS: Record<string, string> = {
  bca_va:     'BCA',
  bni_va:     'BNI',
  mandiri_va: 'MDR',
  gopay:      'GP',
  ovo:        'OVO',
  dana:       'DANA',
  qris:       'QRIS',
  cod:        'COD',
};
const PM_COLORS: Record<string, string> = {
  bca_va: 'bg-blue-600', bni_va: 'bg-orange-600', mandiri_va: 'bg-yellow-500',
  gopay: 'bg-green-500', ovo: 'bg-purple-600', dana: 'bg-blue-500',
  qris: 'bg-red-600', cod: 'bg-gray-700',
};

// ── Payment card ───────────────────────────────────────────────
function PaymentCard({ method, selected, onSelect }: { method: PaymentMethod; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
        selected
          ? 'border-surface-ink bg-surface-ink/5 ring-1 ring-surface-ink'
          : 'border-surface-muted hover:border-surface-ink/30 hover:bg-surface-raised/30'
      }`}
    >
      {/* Logo badge */}
      <div className={`w-12 h-8 rounded flex items-center justify-center text-white text-[10px] font-black shrink-0 ${PM_COLORS[method.id] ?? 'bg-gray-500'}`}>
        {PM_LOGOS[method.id]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-surface-ink">{method.name}</span>
          {method.badge && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{method.badge}</span>
          )}
        </div>
        <p className="text-xs text-surface-sub mt-0.5 line-clamp-1">{method.description}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
        selected ? 'border-surface-ink' : 'border-surface-muted'
      }`}>
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-surface-ink" />}
      </div>
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Step: 0=shipping 1=payment 2=confirm
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Shipping
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [saveAddress, setSaveAddress] = useState(false);
  
  const [address, setAddress] = useState<ShippingAddress>({
    recipient_name: '', phone: '', address: '', city: '', province: '', district: '', district_id: '', postal_code: '',
  });
  
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingOption, setShippingOption] = useState<any>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  
  const [addrErrors, setAddrErrors] = useState<Partial<ShippingAddress>>({});

  const [provinces, setProvinces] = useState<{id: string, name: string}[]>([]);
  const [cities, setCities] = useState<{id: string, name: string}[]>([]);
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([]);
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');

  useEffect(() => {
    fetch('/api/shipping/wilayah?type=province')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProvinces(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
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

  useEffect(() => {
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

  useEffect(() => {
    if (address.district_id) {
      setLoadingShipping(true);
      fetch('/api/shipping/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination_district_id: address.district_id })
      })
      .then(res => res.json())
      .then(data => {
        if (data.results) {
          const options: any[] = [];
          const seen = new Set();
          
          data.results.forEach((courier: any) => {
            const allowed = ['jne', 'jnt', 'sicepat'];
            if (!allowed.includes(courier.code.toLowerCase())) return;

            if (courier.costs) {
              courier.costs.forEach((cost: any) => {
                const s = cost.service.toUpperCase();
                const t = (cost.type || '').toUpperCase();
                
                if (s.includes('TRUCK') || t.includes('TRUCK') || s.includes('JTR') || s.includes('CARGO') || s.includes('GOKIL') || s.includes('DOC') || t.includes('DOKUMEN')) {
                  return;
                }

                let category = 'Standard';
                if (s.includes('SAME') || s.includes('SPS') || t.includes('SAME') || s.includes('INSTANT')) {
                  category = 'Same Day';
                } else if (s.includes('NEXT') || s.includes('YES') || s.includes('BEST') || t.includes('NEXT') || s.includes('ONS')) {
                  category = 'Next Day';
                }

                const id = `${courier.code}_${cost.service}`;
                if (seen.has(id)) return;
                seen.add(id);

                options.push({
                  id,
                  label: `${courier.name} - ${cost.service}`,
                  estimated: cost.estimated ? `${cost.estimated.replace(' hari', '')} hari` : '',
                  cost: parseInt(cost.price, 10),
                  category
                });
              });
            }
          });

          const catWeight: any = { 'Same Day': 1, 'Next Day': 2, 'Standard': 3 };
          options.sort((a, b) => {
            if (catWeight[a.category] !== catWeight[b.category]) {
              return catWeight[a.category] - catWeight[b.category];
            }
            return a.cost - b.cost;
          });

          setShippingOptions(options);
          if (options.length > 0) {
            setShippingOption(options[0]);
          } else {
            setShippingOption(null);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingShipping(false));
    } else {
      setShippingOptions([]);
      setShippingOption(null);
    }
  }, [address.district_id]);

  useEffect(() => {
    if (user) {
      fetch('/api/user/addresses')
        .then(res => res.json())
        .then(data => {
          if (data.addresses && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            const defaultAddr = data.addresses.find((a: any) => a.is_default) || data.addresses[0];
            setSelectedAddressId(defaultAddr._id);
            setAddress(defaultAddr);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'new') {
      setAddress({ recipient_name: '', phone: '', address: '', city: '', province: '', district: '', district_id: '', postal_code: '' });
      setSaveAddress(false);
      setSelectedProvId('');
      setSelectedCityId('');
    } else {
      const addr = savedAddresses.find(a => a._id === id);
      if (addr) {
        setAddress(addr);
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
      }
    }
  };

  // Payment
  const [paymentId, setPaymentId] = useState('bca_va');

  // Validate step 0 — must be ABOVE all early returns (Rules of Hooks)
  const validateAddress = useCallback(() => {
    const errs: Partial<ShippingAddress> = {};
    if (!address.recipient_name.trim()) errs.recipient_name = 'Wajib diisi';
    if (!address.phone.trim() || !/^[0-9]{9,15}$/.test(address.phone)) errs.phone = 'Nomor tidak valid';
    if (!address.address.trim()) errs.address = 'Wajib diisi';
    if (!address.city.trim()) errs.city = 'Wajib diisi';
    if (!address.province) errs.province = 'Pilih provinsi';
    if (!address.postal_code.trim() || !/^\d{5}$/.test(address.postal_code)) errs.postal_code = 'Kode pos 5 digit';
    setAddrErrors(errs);
    if (!shippingOption) {
      setError('Harap pilih alamat yang valid untuk memuat opsi pengiriman');
      return false;
    }
    return Object.keys(errs).length === 0;
  }, [address, shippingOption]);

  const handleNext = useCallback(() => {
    setError('');
    if (step === 0 && !validateAddress()) return;
    setStep(s => s + 1);
  }, [step, validateAddress]);

  // Auth + cart guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login?callbackUrl=/checkout'); return; }
    if (items.length === 0) { router.replace('/catalog'); }
  }, [authLoading, user, items, router]);

  // Derived values — safe to compute before early return
  const subtotal = totalPrice;
  const shippingCost = shippingOption?.cost || 0;
  const total = subtotal + shippingCost;

  if (authLoading || !user || items.length === 0) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        items: items.map(i => ({
          product_id: i.product._id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          image_url: i.product.image_url,
        })),
        shipping_address: address,
        save_address: selectedAddressId === 'new' && saveAddress,
        payment_method: paymentId,
        shipping_cost: shippingCost,
      };
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal membuat pesanan');
      router.push(`/order-success?orderId=${data.orderId}`);
    } catch (e: any) {
      setError(e.message);
      setIsSubmitting(false);
    }
  };

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentId)!;

  return (
    <div className="section-container py-8 lg:py-14">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs text-surface-sub hover:text-surface-ink transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Kembali
            </button>
          </div>
          <h1 className="heading-lg mb-1">Checkout</h1>
          <p className="text-surface-sub text-sm">Lengkapi detail pesananmu</p>
        </div>

        <StepBar current={step} />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left column ────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">

              {/* STEP 0: Shipping */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }}>
                  <Section icon={MapPin} title="Alamat Pengiriman">
                    {savedAddresses.length > 0 && (
                      <div className="mb-6 space-y-3">
                        {savedAddresses.map(addr => (
                          <div 
                            key={addr._id}
                            onClick={() => handleAddressSelect(addr._id)}
                            className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${selectedAddressId === addr._id ? 'border-surface-ink bg-surface-ink/5 ring-1 ring-surface-ink' : 'border-surface-muted hover:border-surface-border'}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm text-surface-ink">{addr.recipient_name}</span>
                              {addr.is_default && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Utama</span>}
                            </div>
                            <p className="text-xs text-surface-sub mb-0.5">{addr.phone}</p>
                            <p className="text-xs text-surface-ink line-clamp-2">{addr.address}, {addr.city}, {addr.province} {addr.postal_code}</p>
                          </div>
                        ))}
                        <div
                          onClick={() => handleAddressSelect('new')}
                          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${selectedAddressId === 'new' ? 'border-surface-ink bg-surface-ink/5 ring-1 ring-surface-ink' : 'border-surface-muted hover:border-surface-border'}`}
                        >
                          <span className="font-semibold text-sm text-surface-ink">Tambah Alamat Baru</span>
                        </div>
                      </div>
                    )}
                    
                    {selectedAddressId === 'new' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* BUG-002 fix: col-span-2 applied to the Field wrapper, not inner div */}
                          <Field label="Alamat Lengkap" required error={addrErrors.address} className="sm:col-span-2">
                            <div className="relative">
                              <Home className="absolute left-3 top-3 w-4 h-4 text-surface-sub" />
                              <textarea className="input-field pl-9 resize-none" rows={2} placeholder="Jl. Raya No.1, RT 001/RW 002" value={address.address}
                                onChange={e => setAddress(a => ({ ...a, address: e.target.value }))} />
                            </div>
                          </Field>
                          <Field label="Provinsi" required error={addrErrors.province}>
                            <div className="relative">
                              <select className="input-field appearance-none pr-8" value={address.province}
                                onChange={e => {
                                  const name = e.target.value;
                                  setAddress(a => ({ ...a, province: name, city: '', district: '', district_id: '' }));
                                  const prov = provinces.find(p => p.name === name);
                                  setSelectedProvId(prov ? prov.id : '');
                                }}>
                                <option value="">-- Pilih Provinsi --</option>
                                {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-sub pointer-events-none" />
                            </div>
                          </Field>
                          <Field label="Kota/Kabupaten" required error={addrErrors.city}>
                            <div className="relative">
                              <select className="input-field appearance-none pr-8" value={address.city}
                                onChange={e => {
                                  const name = e.target.value;
                                  setAddress(a => ({ ...a, city: name, district: '', district_id: '' }));
                                  const city = cities.find(c => c.name === name);
                                  setSelectedCityId(city ? city.id : '');
                                }} disabled={!selectedProvId}>
                                <option value="">-- Pilih Kota/Kabupaten --</option>
                                {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-sub pointer-events-none" />
                            </div>
                          </Field>
                          <Field label="Kecamatan" required error={addrErrors.district}>
                            <div className="relative">
                              <select className="input-field appearance-none pr-8" value={address.district}
                                onChange={e => {
                                  const name = e.target.value;
                                  const district = districts.find(d => d.name === name);
                                  setAddress(a => ({ ...a, district: name, district_id: district ? `district_${district.id}` : '' }));
                                }} disabled={!selectedCityId}>
                                <option value="">-- Pilih Kecamatan --</option>
                                {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-sub pointer-events-none" />
                            </div>
                          </Field>
                          <Field label="Kode Pos" required error={addrErrors.postal_code}>
                            <input className="input-field" placeholder="12345" maxLength={5} value={address.postal_code}
                              onChange={e => setAddress(a => ({ ...a, postal_code: e.target.value.replace(/\D/g, '') }))} />
                          </Field>
                          <div className="hidden sm:block"></div>
                          <Field label="Nama Penerima" required error={addrErrors.recipient_name}>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-sub" />
                              <input className="input-field pl-9" placeholder="John Doe" value={address.recipient_name}
                                onChange={e => setAddress(a => ({ ...a, recipient_name: e.target.value }))} />
                            </div>
                          </Field>
                          <Field label="Nomor Telepon" required error={addrErrors.phone}>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-sub" />
                              <input className="input-field pl-9" placeholder="08xxxxxxxxxx" type="tel" value={address.phone}
                                onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} />
                            </div>
                          </Field>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-muted">
                          <input type="checkbox" id="save_addr" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="w-4 h-4 rounded border-surface-muted text-surface-ink focus:ring-surface-ink" />
                          <label htmlFor="save_addr" className="text-sm text-surface-ink cursor-pointer">Simpan alamat ini untuk pembelian selanjutnya</label>
                        </div>
                      </>
                    )}
                  </Section>

                  <Section icon={Truck} title="Opsi Pengiriman">
                    <div className="space-y-2.5">
                      {loadingShipping ? (
                        <div className="py-8 flex flex-col items-center justify-center text-surface-sub">
                          <Loader2 className="w-6 h-6 animate-spin mb-2 text-surface-ink" />
                          <p className="text-sm">Menghitung ongkos kirim...</p>
                        </div>
                      ) : shippingOptions.length === 0 ? (
                        <div className="py-6 text-center border border-dashed border-surface-muted rounded-lg bg-surface-raised/50">
                          <p className="text-sm text-surface-sub">Pilih kecamatan untuk melihat opsi pengiriman</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {['Same Day', 'Next Day', 'Standard'].map(category => {
                            const catOptions = shippingOptions.filter(opt => opt.category === category);
                            if (catOptions.length === 0) return null;
                            return (
                              <div key={category}>
                                <p className="text-[11px] font-bold text-surface-sub uppercase tracking-widest mb-2">{category}</p>
                                <div className="space-y-2.5">
                                  {catOptions.map(opt => (
                                    <button key={opt.id} type="button" onClick={() => setShippingOption(opt)}
                                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                                        shippingOption?.id === opt.id
                                          ? 'border-surface-ink bg-surface-ink/5 ring-1 ring-surface-ink'
                                          : 'border-surface-muted hover:border-surface-ink/30 hover:bg-surface-raised/30'
                                      }`}>
                                      <div className="flex items-center gap-4">
                                        <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${shippingOption?.id === opt.id ? 'border-surface-ink' : 'border-surface-muted'}`}>
                                          {shippingOption?.id === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-surface-ink" />}
                                        </div>
                                        <div className="text-left">
                                          <p className="text-sm font-semibold text-surface-ink">{opt.label}</p>
                                          {opt.estimated && <p className="text-xs text-surface-sub mt-0.5">Tiba dalam {opt.estimated}</p>}
                                        </div>
                                      </div>
                                      <span className="text-sm font-bold text-surface-ink">{formatPrice(opt.cost)}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {error && !shippingOption && (
                      <p className="text-red-500 text-xs mt-3">{error}</p>
                    )}
                  </Section>
                </motion.div>
              )}

              {/* STEP 1: Payment */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                  <Section icon={CreditCard} title="Metode Pembayaran">
                    <div className="space-y-2.5">
                      {/* Virtual accounts */}
                      <p className="text-[11px] font-bold text-surface-sub uppercase tracking-widest mb-2">Transfer Bank</p>
                      {PAYMENT_METHODS.slice(0, 3).map(m => (
                        <PaymentCard key={m.id} method={m} selected={paymentId === m.id} onSelect={() => setPaymentId(m.id)} />
                      ))}
                      <p className="text-[11px] font-bold text-surface-sub uppercase tracking-widest mt-4 mb-2">Dompet Digital</p>
                      {PAYMENT_METHODS.slice(3, 7).map(m => (
                        <PaymentCard key={m.id} method={m} selected={paymentId === m.id} onSelect={() => setPaymentId(m.id)} />
                      ))}
                      <p className="text-[11px] font-bold text-surface-sub uppercase tracking-widest mt-4 mb-2">Lainnya</p>
                      {PAYMENT_METHODS.slice(7).map(m => (
                        <PaymentCard key={m.id} method={m} selected={paymentId === m.id} onSelect={() => setPaymentId(m.id)} />
                      ))}
                    </div>

                    {/* Dummy notice */}
                    <div className="mt-5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>Mode Demo:</strong> Pembayaran bersifat simulasi. Integrasi Midtrans akan aktif setelah produksi.
                      </p>
                    </div>
                  </Section>
                </motion.div>
              )}

              {/* STEP 2: Confirmation */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                  <Section icon={MapPin} title="Ringkasan Pengiriman">
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2"><span className="text-surface-sub w-28 shrink-0">Penerima</span><span className="font-semibold">{address.recipient_name}</span></div>
                      <div className="flex gap-2"><span className="text-surface-sub w-28 shrink-0">Telepon</span><span>{address.phone}</span></div>
                      <div className="flex gap-2"><span className="text-surface-sub w-28 shrink-0">Alamat</span><span>{address.address}, {address.city}, {address.province} {address.postal_code}</span></div>
                      <div className="flex gap-2"><span className="text-surface-sub w-28 shrink-0">Pengiriman</span><span>{shippingOption?.label}</span></div>
                    </div>
                    <button onClick={() => setStep(0)} className="mt-4 text-xs text-surface-sub underline underline-offset-2 hover:text-surface-ink transition-colors">
                      Ubah alamat
                    </button>
                  </Section>

                  <Section icon={CreditCard} title="Metode Pembayaran">
                    <div className={`flex items-center gap-3 p-3.5 rounded-lg ${PM_COLORS[selectedMethod.id]?.replace('bg-', 'bg-') ?? ''} bg-opacity-10`}>
                      <div className={`w-12 h-9 rounded-md flex items-center justify-center text-white text-[10px] font-black ${PM_COLORS[selectedMethod.id]}`}>
                        {PM_LOGOS[selectedMethod.id]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-surface-ink">{selectedMethod.name}</p>
                        <p className="text-xs text-surface-sub">{selectedMethod.description}</p>
                      </div>
                    </div>
                    <button onClick={() => setStep(1)} className="mt-3 text-xs text-surface-sub underline underline-offset-2 hover:text-surface-ink transition-colors">
                      Ubah pembayaran
                    </button>
                  </Section>

                  {error && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center gap-3 pt-2">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="btn-secondary" disabled={isSubmitting}>
                  Kembali
                </button>
              )}
              {step < 2 ? (
                <button onClick={handleNext} className="btn-primary ml-auto">
                  Lanjut <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary ml-auto min-w-[160px] justify-center">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses…</> : <><ShieldCheck className="w-4 h-4" /> Konfirmasi Pesanan</>}
                </button>
              )}
            </div>
          </div>

          {/* ── Right: Order summary ────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-surface-raised/50 border border-surface-muted rounded-xl p-6 lg:p-7 sticky top-24">
              <h3 className="text-lg font-bold text-surface-ink mb-5 pb-4 border-b border-surface-muted">
                Ringkasan Pesanan
              </h3>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide mb-6">
                {items.map(item => (
                  <div key={item.product._id} className="flex gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-surface-muted shrink-0 bg-white">
                      <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <p className="text-sm font-semibold text-surface-ink line-clamp-2 leading-snug">{item.product.name}</p>
                      <p className="text-xs text-surface-sub mt-1">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-surface-ink shrink-0 py-1">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-surface-muted pt-5 space-y-3">
                <dl className="flex items-center justify-between text-sm">
                  <dt className="text-surface-sub">Subtotal</dt>
                  <dd className="font-medium">{formatPrice(subtotal)}</dd>
                </dl>
                <dl className="flex items-center justify-between text-sm">
                  <dt className="text-surface-sub">Ongkos Kirim</dt>
                  <dd className="font-medium">{formatPrice(shippingCost)}</dd>
                </dl>
                <dl className="flex items-center justify-between text-base font-bold border-t border-surface-muted pt-4 mt-1">
                  <dt>Total Pembayaran</dt>
                  <dd>{formatPrice(total)}</dd>
                </dl>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-green-50/50 border border-green-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Pembayaran Aman</p>
                  <p className="text-xs text-green-700/80 mt-0.5">Transaksi dienkripsi 256-bit AES</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
