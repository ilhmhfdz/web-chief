'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Play } from 'lucide-react';
import ProductCard from '@/components/shop/ProductCard';

const HERO_PRODUCTS = [
  {
    _id: "69f03d66703506ffcba8db13",
    name: "CHIEF Space Clay",
    slug: "chief-space-clay",
    description: "Matte Strong Hold",
    price: 120000,
    stock: 5,
    category: "pomade",
    image_url: "https://res.cloudinary.com/dvqb4tmqk/image/upload/v1781159650/ea372a22aa694008a1d7c15f9ba90121_tplv-o3syd03w52-resize-jpeg_700_0_hi3dsf.jpg",
    images: [],
    tags: [],
    is_active: true,
    createdAt: "2026-04-28T04:53:58.366Z",
    updatedAt: "2026-06-11T06:35:19.384Z",
  },
  {
    _id: "69f03e5d703506ffcba8db22",
    name: "CHIEF Solid Black",
    slug: "chief-solid-black",
    description: "Waterbased Strong Hold",
    price: 130000,
    stock: 30,
    category: "pomade",
    image_url: "https://res.cloudinary.com/dvqb4tmqk/image/upload/v1781158946/2c35d215a695439e88d739e87fccba44_tplv-o3syd03w52-resize-jpeg_700_0_sxz9x9.jpg",
    images: [],
    tags: [],
    is_active: true,
    createdAt: "2026-04-28T04:58:05.286Z",
    updatedAt: "2026-06-11T06:27:05.274Z",
  }
];

const FRAME_COUNT = 120;

export default function HeroParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);

  // Auto slide loop for the 2 hero products
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % HERO_PRODUCTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Preload Image Sequence
  useEffect(() => {
    const loadImages = async () => {
      const loadedImages: HTMLImageElement[] = [];
      let loadedCount = 0;

      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        const frameNumber = i.toString().padStart(3, '0');
        // Preload frame_001.webp to frame_120.webp
        img.src = `/images/sequence/frame_${frameNumber}.webp`;
        
        await new Promise((resolve) => {
          img.onload = () => {
            loadedCount++;
            resolve(null);
          };
          img.onerror = () => resolve(null); // Continue even if one fails
        });
        loadedImages.push(img);
      }
      imagesRef.current = loadedImages;
      setImagesLoaded(true);
      
      // Draw first frame once loaded
      if (loadedImages[0] && canvasRef.current) {
        renderFrame(0);
      }
    };

    loadImages();
  }, []);

  const renderFrame = useCallback((index: number) => {
    if (!canvasRef.current || !imagesRef.current[index]) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[index];
    
    // Set canvas dimensions to match CSS size or native image size
    if (canvas.width !== img.width || canvas.height !== img.height) {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    // Force high-quality rendering algorithms to prevent pixelation/blurriness
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  // Scroll-linked animation values
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"] // Animates as the hero section scrolls out of view
  });

  // Track scroll and draw frames
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!imagesLoaded) return;
    
    // Calculate the frame index based on scroll progress (0 to 1)
    const frameIndex = Math.min(
      FRAME_COUNT - 1,
      Math.max(0, Math.floor(latest * FRAME_COUNT))
    );

    if (frameIndex !== currentFrameRef.current) {
      currentFrameRef.current = frameIndex;
      requestAnimationFrame(() => renderFrame(frameIndex));
    }
  });

  // Overall container movement (moves up and scales to overlay text)
  const yOffset = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <div ref={containerRef} className="relative min-h-screen -mt-20 bg-[#f3efe8] flex flex-col pt-20 px-6 md:px-12 lg:px-16 overflow-hidden pb-0">
        {/* 3-column grid */}
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-0 lg:gap-6 flex-1 w-full max-w-[1600px] mx-auto lg:h-screen pt-8 pb-0 lg:pb-8 relative min-h-[calc(100svh-5rem)] lg:min-h-0">

          {/* Left Column */}
            <div className="lg:col-span-4 flex flex-col justify-start lg:justify-center lg:h-full relative z-20 pt-8 lg:pt-20 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-6 text-[10px] font-bold tracking-[0.25em] text-[#8e8b82] uppercase"
            >
              <span className="w-8 h-[1px] bg-[#8e8b82]"></span>
              PREMIUM GROOMING
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-[3.5rem] lg:text-[4.5rem] xl:text-[5.5rem] font-bold leading-[1.05] tracking-tight mb-3 lg:mb-6 whitespace-nowrap"
            >
              <span className="text-[#1A1A1A]">Find the Cut</span><br />
              <span className="text-[#a8a49c]">That Fits You</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#8e8b82] text-[14px] lg:text-[15px] max-w-[320px] mb-5 lg:mb-8 leading-[1.6]"
            >
              Premium grooming, smart hairstyle preview, and seamless booking in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-4 lg:mb-12 pointer-events-auto"
            >
              <Link href="/booking" className="inline-flex items-center justify-center px-8 py-3.5 rounded-[4px] font-bold text-[10px] tracking-[0.15em] border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors text-center leading-tight">
                BOOK NOW
              </Link>
            </motion.div>
          </div>

          {/* Center Column - 3D Sequence Canvas */}
          <motion.div 
            className="absolute inset-0 lg:relative lg:inset-auto lg:col-span-5 lg:h-full flex flex-col justify-end items-center lg:-mx-6 z-10 lg:z-30 pointer-events-none lg:pointer-events-auto" 
            style={{ scale }}
          >
            {/* Mobile: absolute full-bleed canvas, desktop: normal flow */}
            <div className="relative w-full h-full flex items-end justify-center pointer-events-none mix-blend-multiply
              lg:min-h-0">
              {/* Canvas for rendering the image sequence */}
              <canvas
                ref={canvasRef}
                className="w-full lg:w-[115%] max-w-none h-full object-contain object-bottom absolute bottom-0 z-0 pointer-events-auto"
              />
              
              {/* Fallback/Loading State */}
              <AnimatePresence>
                {!imagesLoaded && (
                  <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-10 bg-[#f3efe8]"
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] border-t-transparent animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI CTA Button — absolute bottom on mobile, absolute bottom-right on desktop */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute bottom-8 inset-x-0 flex justify-center lg:flex-none lg:inset-x-auto lg:justify-start lg:bottom-6 lg:right-36 z-50 pointer-events-auto"
            >
              <Link href="/ai-recommendation" className="group flex items-center justify-center gap-3 bg-white/90 backdrop-blur-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-6 py-3.5 rounded-full text-[#1a1a1a] hover:bg-white transition-all hover:scale-105 w-auto whitespace-nowrap">
                <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Play className="w-[8px] h-[8px] fill-white text-white ml-[2px]" />
                </div>
                <span className="font-bold text-[11px] tracking-[0.2em] pt-[1px]">TRY AI HAIRSTYLE</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column */}
          <div className="hidden lg:flex lg:col-span-3 flex-col justify-center items-end h-full relative z-20 pb-4">

            {/* Premium Floating Bestseller Card Carousel */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="w-full max-w-[280px] relative mb-12 z-50 group"
            >
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#1a1a1a]/10 to-[#8e8b82]/30 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="relative bg-white rounded-2xl overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.12)] border border-white/60 p-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`hero-product-${carouselIndex}`}
                    initial={{ opacity: 0, scale: 0.96, filter: 'blur(5px)', x: 20 }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', x: 0 }}
                    exit={{ opacity: 0, scale: 0.96, filter: 'blur(5px)', x: -20 }}
                    transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                    className="bg-white rounded-xl overflow-hidden"
                  >
                    <ProductCard
                      product={HERO_PRODUCTS[carouselIndex] as any}
                      index={carouselIndex}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {HERO_PRODUCTS.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={`h-1.5 rounded-full cursor-pointer transition-all duration-500 shadow-sm ${carouselIndex === idx ? 'w-4 bg-[#1a1a1a]' : 'w-1.5 bg-[#d6d2c9] hover:bg-[#8e8b82]'
                      }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Ultra-Premium Luxury Bookings Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative rounded-2xl p-[1px] w-full max-w-[260px]"
            >
              <div className="relative bg-white/90 backdrop-blur-2xl border border-black/5 shadow-[0_12px_40px_rgb(0,0,0,0.08)] rounded-2xl p-4 flex items-center justify-between">

                <div className="flex flex-col gap-0.5 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.6)]"></div>
                    <p className="text-[#1a1a1a] text-[13px] font-semibold tracking-tight">2,400+ bookings</p>
                  </div>
                  <p className="text-[#8e8b82] text-[8px] ml-3.5 uppercase tracking-[0.2em] font-medium">This month</p>
                </div>

                {/* Premium User Avatars */}
                <div className="flex -space-x-2 z-10">
                  <div className="w-7 h-7 rounded-full border-[1.5px] border-white bg-zinc-100 overflow-hidden relative shadow-sm">
                    <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="User 1" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-7 h-7 rounded-full border-[1.5px] border-white bg-zinc-100 overflow-hidden relative shadow-sm">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" alt="User 2" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-7 h-7 rounded-full border-[1.5px] border-white bg-[#1a1a1a] flex items-center justify-center relative shadow-sm">
                    <span className="text-[#d4af37] text-[8px] font-bold tracking-wider">+2k</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
    </div>
  );
}
