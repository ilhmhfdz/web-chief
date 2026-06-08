'use client';

import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Truck } from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Recommendation',
    desc: 'Rekomendasi produk personal berdasarkan analisis bentuk wajah Anda secara real-time.',
    badge: 'Teknologi Terbaru',
    color: 'from-amber-500/5 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-100/50',
    iconColor: 'text-amber-600',
  },
  {
    icon: ShieldCheck,
    title: 'Produk Original',
    desc: '100% produk original bergaransi resmi dari brand grooming terpilih.',
    badge: 'Bergaransi',
    color: 'from-green-500/5 via-green-500/5 to-transparent',
    iconBg: 'bg-green-100/50',
    iconColor: 'text-green-600',
  },
  {
    icon: Truck,
    title: 'Pengiriman Cepat',
    desc: 'Same-day delivery untuk area Jakarta. Seluruh Indonesia dalam 2–3 hari kerja.',
    badge: 'Same-Day Jakarta',
    color: 'from-blue-500/5 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-100/50',
    iconColor: 'text-blue-600',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 80, damping: 20 },
  },
};

export default function FeaturesGrid() {
  return (
    <section className="section-container py-16 lg:py-24">
      <motion.div 
        className="text-center mb-12 lg:mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <p className="label-upper mb-3 text-accent">Kenapa Chief Supplies</p>
        <h2 className="heading-xl max-w-2xl mx-auto text-balance">Lebih dari sekadar toko grooming.</h2>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {FEATURES.map((f, i) => (
          <motion.div 
            key={f.title} 
            variants={cardVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`relative overflow-hidden rounded-2xl border border-surface-muted/30 p-8 shadow-sm hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${f.color} backdrop-blur-md`}
          >
            {/* Background noise/texture for premium feel */}
            <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-8">
                <div className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center border border-white/40 shadow-inner`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-surface-sub bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/40">
                  {f.badge}
                </span>
              </div>
              <div className="mt-auto">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-black text-surface-muted/50">0{i + 1}</span>
                  <h3 className="font-display text-xl font-bold text-surface-ink">{f.title}</h3>
                </div>
                <p className="text-sm text-surface-sub/90 leading-relaxed font-medium">{f.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
