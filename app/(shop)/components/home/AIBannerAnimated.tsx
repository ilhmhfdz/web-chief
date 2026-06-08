'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Star, ArrowRight } from 'lucide-react';

export default function AIBannerAnimated() {
  return (
    <section className="section-container py-16 lg:py-24">
      <motion.div 
        className="bg-surface-ink rounded-3xl px-8 py-12 lg:px-16 lg:py-20 overflow-hidden relative shadow-2xl"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      >
        {/* Background decoration with continuous animation */}
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none origin-center" 
        />
        <motion.div 
          animate={{ 
            rotate: [360, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none origin-center" 
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="max-w-xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 border border-white/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-light" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/90">Powered by AI</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-display text-3xl lg:text-5xl font-black text-white leading-[1.1] mb-5 tracking-tight"
            >
              Temukan Gaya yang<br />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-accent-light to-white">Tepat untuk Anda.</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-base lg:text-lg text-white/70 leading-relaxed font-medium"
            >
              Unggah foto wajah Anda dan biarkan AI kami menganalisis bentuk wajah,
              lalu merekomendasikan produk dan gaya rambut yang paling sesuai.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="shrink-0 flex flex-col sm:flex-row gap-4 w-full lg:w-auto"
          >
            <Link
              href="/ai-recommendation"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-surface-ink font-bold text-sm rounded-xl hover:bg-surface-raised transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <Star className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              Mulai Analisis Gratis
            </Link>
            <Link
              href="/catalog"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-sm text-white font-bold text-sm rounded-xl hover:bg-white/15 transition-all border border-white/20 hover:border-white/40 hover:-translate-y-1"
            >
              Lihat Katalog
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
