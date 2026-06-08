'use client';

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
};

export default function HeroAnimated() {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden border-b border-surface-muted/60">
      <div className="absolute inset-0 bg-surface-raised" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #1c1917 0, #1c1917 1px, transparent 0, transparent 50%)`,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-accent/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-surface-ink/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none blur-3xl" />

      <motion.div
        className="section-container relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-3xl">
          <motion.span 
            variants={itemVariants}
            className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-widest text-accent uppercase bg-accent/10 rounded-full"
          >
            Artikel & Panduan
          </motion.span>
          <motion.h1 
            variants={itemVariants}
            className="text-5xl lg:text-7xl font-display font-black text-surface-ink leading-[1.1] mb-6 tracking-tight"
          >
            Panduan Pria <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-dark">Modern.</span>
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-surface-sub text-lg lg:text-xl leading-relaxed max-w-2xl font-medium"
          >
            Tingkatkan kualitas gaya dan perawatan harianmu dengan panduan, tips, dan wawasan mendalam dari para ahli grooming Chief.
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
