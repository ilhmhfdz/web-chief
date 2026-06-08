'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Star, Users, Package, Zap } from 'lucide-react';

const SOCIAL_PROOF = [
  { icon: Users, value: '2.000+', label: 'Pelanggan Puas' },
  { icon: Package, value: '50+', label: 'Produk Premium' },
  { icon: Star, value: '4.8★', label: 'Rating Rata-rata' },
  { icon: Zap, value: '1 Hari', label: 'Proses Pesanan' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
};

const rightSideVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.4,
    },
  },
};

export default function HeroParallax() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacityFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden min-h-[90vh] flex items-center">
      {/* Background Parallax Layer */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{ y: backgroundY, opacity: opacityFade }}
      >
        <Image
          src="/images/landing_page.png"
          alt="Chief Background"
          fill
          className="object-cover object-center opacity-60 mix-blend-multiply"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
      </motion.div>

      <div className="section-container relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Trust badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-surface-raised border border-surface-muted rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-surface-sub">Dipercaya 2.000+ pria Indonesia</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-display font-black mb-5 text-balance leading-[1.1] text-surface-ink tracking-tight">
              Gaya Terbaik<br />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-dark">untuk Pria Modern.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg text-surface-sub leading-relaxed max-w-xl mb-8 font-medium">
              Temukan perlengkapan grooming premium yang dipersonalisasi AI
              sesuai bentuk wajah Anda. Tampil percaya diri setiap hari.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 flex-wrap mb-10">
              <Link href="/catalog" className="inline-flex items-center gap-2 px-7 py-3.5 bg-surface-ink text-white font-semibold text-sm rounded-lg hover:bg-surface-ink/80 transition-all hover:shadow-lg hover:-translate-y-0.5">
                Jelajahi Katalog <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/ai-recommendation" className="inline-flex items-center gap-2 px-7 py-3.5 bg-surface-raised text-surface-ink font-semibold text-sm rounded-lg hover:bg-surface-muted transition-all hover:shadow-lg border border-surface-muted/50 hover:-translate-y-0.5">
                <Sparkles className="w-4 h-4 text-accent" />
                Coba AI Recommendation
              </Link>
            </motion.div>

            {/* Social proof stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-surface-muted/30">
              {SOCIAL_PROOF.map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-1 text-accent">
                    <s.icon className="w-4 h-4" />
                    <p className="font-display text-xl font-bold text-surface-ink">{s.value}</p>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-sub">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Visual card stack */}
          <motion.div 
            className="hidden lg:flex relative items-center justify-center min-h-[480px]"
            variants={rightSideVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="relative w-full max-w-md ml-auto z-10">
              {/* Card 1 — AI */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ x: -10, scale: 1.02 }}
                className="glass-card p-5 flex items-center gap-4 shadow-xl shadow-surface-ink/5 backdrop-blur-md bg-white/60 mb-4 border border-white/40"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-surface-ink to-surface-sub flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-accent-light" />
                </div>
                <div>
                  <p className="font-bold text-surface-ink text-sm">AI Face Analysis</p>
                  <p className="text-xs text-surface-sub mt-0.5 font-medium">Hairstyle recommendation berdasarkan bentuk wajah Anda</p>
                </div>
              </motion.div>

              {/* Card 2 — Products */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ x: -10, scale: 1.02 }}
                className="glass-card p-5 ml-8 flex items-center gap-4 shadow-xl shadow-surface-ink/5 backdrop-blur-md bg-white/60 mb-4 border border-white/40"
              >
                <div className="flex -space-x-3 shrink-0">
                  {['#1c1917', '#b5872a', '#57534e'].map((c, i) => (
                    <div
                      key={c}
                      className="w-11 h-11 rounded-full border-[3px] border-white shadow-sm"
                      style={{ background: c, zIndex: 3 - i }}
                    />
                  ))}
                </div>
                <div>
                  <p className="font-bold text-surface-ink text-sm">50+ Produk Premium</p>
                  <div className="flex gap-1.5 mt-1.5">
                    {['Pomade', 'Shampoo', 'Tools'].map((cat) => (
                      <span key={cat} className="text-[10px] font-bold uppercase tracking-wider bg-surface/80 border border-surface-muted/50 px-2 py-0.5 rounded-md text-surface-sub">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Card 3 — Rating */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ x: -10, scale: 1.02 }}
                className="glass-card p-5 flex items-center gap-5 shadow-xl shadow-surface-ink/5 backdrop-blur-md bg-white/60 border border-white/40"
              >
                <div>
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="font-display text-3xl font-black text-surface-ink leading-none">4.8</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-sub mt-1">328 Ulasan</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[{ w: '70%', n: 5 }, { w: '20%', n: 4 }, { w: '10%', n: 3 }].map((b) => (
                    <div key={b.n} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-surface-sub w-2">{b.n}</span>
                      <div className="flex-1 h-1.5 bg-surface-muted/30 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: b.w }}
                          transition={{ duration: 1, delay: 0.8 }}
                          className="h-full bg-accent rounded-full" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
