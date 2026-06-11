'use client';

import { motion } from 'framer-motion';
import { Sparkles, Heart, Clock } from 'lucide-react';

export default function FeaturesGrid() {
  return (
    <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Image */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative h-[600px] lg:h-[800px] w-full"
          >
            <img 
              src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop" 
              alt="Craftsmanship" 
              className="w-full h-full object-cover rounded-none"
            />
            {/* Glassmorphism Stat Card — overlapping image edge */}
            <div 
              className="absolute -bottom-10 -right-8 z-20"
              style={{
                perspective: '800px',
                perspectiveOrigin: '80% 80%'
              }}
            >
              <motion.div
                initial={{ opacity: 0, rotateX: 10, rotateY: -15, y: 20 }}
                whileInView={{ opacity: 1, rotateX: 6, rotateY: -10, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                className="w-[220px] px-8 py-6 rounded-[4px]"
                style={{
                  background: 'rgba(220, 216, 208, 0.55)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  transform: 'rotateX(6deg) rotateY(-10deg)',
                }}
              >
                <span className="block text-[2.8rem] font-light text-[#1a1a1a] leading-none tracking-tight mb-2">2,400+</span>
                <span className="block text-[9px] tracking-[0.25em] text-[#5c5852] uppercase font-semibold">Happy Clients</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column: Content */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col justify-center lg:pr-12"
          >
            <span className="text-[10px] tracking-[0.25em] text-[#8e8b82] uppercase mb-6 font-bold">
              Our Heritage
            </span>
            
            <h2 className="text-[3.5rem] lg:text-[4.5rem] leading-[1.1] text-[#1a1a1a] mb-8 font-light tracking-tight">
              The Art of <br />
              <span className="italic font-serif">Looking Sharp</span>
            </h2>

            <div className="space-y-6 text-[#8e8b82] text-[14px] lg:text-[15px] leading-[1.8] max-w-[500px]">
              <p>
                A great cut isn't just about scissors and clippers — it's about confidence. At Chief, we've built a sanctuary for men who take their appearance seriously. Every visit is a ritual, not a chore.
              </p>
              <p>
                From the precision of each blade to the carefully curated products on our shelves — nothing is accidental. We obsess over the details so you walk out feeling exactly like the best version of yourself.
              </p>
            </div>

            <hr className="border-[#e5e5e5] my-12 max-w-[500px]" />

            {/* 3 Small Features */}
            <div className="grid grid-cols-3 gap-6 max-w-[500px] mb-12">
              <div>
                <div className="w-12 h-12 border border-[#e5e5e5] flex items-center justify-center mb-4 text-[#1a1a1a]">
                  <Sparkles className="w-5 h-5 stroke-[1.5]" />
                </div>
                <h4 className="text-[#1a1a1a] text-[13px] font-bold mb-1.5">Quality</h4>
                <p className="text-[#8e8b82] text-[11px] leading-relaxed">Uncompromising standards</p>
              </div>
              
              <div>
                <div className="w-12 h-12 border border-[#e5e5e5] flex items-center justify-center mb-4 text-[#1a1a1a]">
                  <Heart className="w-5 h-5 stroke-[1.5]" />
                </div>
                <h4 className="text-[#1a1a1a] text-[13px] font-bold mb-1.5">Passion</h4>
                <p className="text-[#8e8b82] text-[11px] leading-relaxed">Artisan dedication</p>
              </div>

              <div>
                <div className="w-12 h-12 border border-[#e5e5e5] flex items-center justify-center mb-4 text-[#1a1a1a]">
                  <Clock className="w-5 h-5 stroke-[1.5]" />
                </div>
                <h4 className="text-[#1a1a1a] text-[13px] font-bold mb-1.5">Timeless</h4>
                <p className="text-[#8e8b82] text-[11px] leading-relaxed">Enduring style</p>
              </div>
            </div>

            <button className="self-start px-8 py-4 border border-[#1a1a1a] text-[#1a1a1a] text-[10px] font-bold tracking-[0.15em] uppercase hover:bg-[#1a1a1a] hover:text-white transition-colors duration-300">
              Discover Our Story
            </button>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
