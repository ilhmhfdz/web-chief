'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ScanFace } from 'lucide-react';

export default function AIBannerAnimated() {
  const elegantTransition = { duration: 1.2, ease: [0.16, 1, 0.3, 1] };

  return (
    <section className="py-24 md:py-32 bg-brand-950 relative overflow-hidden">
      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={elegantTransition}
            className="text-white lg:col-span-5 relative z-20"
          >
            <div className="inline-flex items-center gap-3 mb-8">
              <ScanFace className="w-5 h-5 text-accent" strokeWidth={1.5} />
              <span className="tracking-[0.2em] uppercase text-xs font-medium text-white/70">
                Precision Analysis
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-8 tracking-tight leading-[1.1]">
              Find Your <br />
              <span className="font-serif italic text-white/90">Perfect Style.</span>
            </h2>
            
            <p className="text-base text-white/60 mb-12 max-w-md leading-relaxed font-light">
              Not sure which haircut suits you? Our advanced Face Analyzer maps your facial structure to recommend styles that complement your unique features with refined accuracy.
            </p>
            
            <Link href="/ai-recommendation" className="group inline-flex items-center gap-4 text-sm tracking-[0.1em] uppercase font-medium text-white transition-opacity hover:text-white/80">
              <span className="border-b border-white/30 pb-1 group-hover:border-white transition-colors">
                Start Free Analysis
              </span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" strokeWidth={1.5} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="lg:col-span-7 relative"
          >
            {/* Elegant Minimalist Image Frame */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-900 group">
              <motion.img 
                initial={{ scale: 1.1 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                src="/uploads/1780911283802-Quiff_Haircut.webp" 
                alt="Premium Hairstyle Analysis" 
                className="object-cover w-full h-full opacity-80 mix-blend-luminosity transition-all duration-1000 group-hover:mix-blend-normal group-hover:opacity-100"
              />
              
              {/* Very subtle smooth scanning line */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-overlay opacity-30">
                <motion.div 
                  animate={{ y: ["-10%", "110%"] }}
                  transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                  className="w-full h-48 bg-gradient-to-b from-transparent via-white/20 to-transparent"
                />
              </div>

              {/* Minimalist Floating Label */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-8 left-8 bg-brand-950/80 backdrop-blur-md px-6 py-4 border border-white/10 flex items-center gap-4"
              >
                <div className="relative flex items-center justify-center w-8 h-8">
                  <div className="absolute inset-0 border border-white/30 rounded-full animate-[spin_4s_linear_infinite]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div>
                  <p className="text-[9px] text-white/50 uppercase tracking-[0.2em] mb-1">Face Profile</p>
                  <p className="text-sm font-light text-white tracking-wide">Oval Structure</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
