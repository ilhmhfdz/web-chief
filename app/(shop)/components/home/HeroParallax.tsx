'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Play } from 'lucide-react';
import ProductCard from '@/components/shop/ProductCard';

const SLIDES = [
  {
    id: 0,
    image: "/images/pose1.png",
    subtitle: "CLASSIC SLICK BACK",
    desc: "Timeless. Sharp. Defined.",
    productImg: "/uploads/1780911316948-SKU-POMADE_Blue-HeroImage1Oz.webp",
    productName: "Chief Styling Clay",
    productDesc: "Matte strong hold",
    productPrice: "Rp149.000"
  },
  {
    id: 1,
    image: "/images/pose2.png",
    subtitle: "TEXTURED CROP",
    desc: "Modern. Effortless. Bold.",
    productImg: "/uploads/1780911316948-SKU-POMADE_Blue-HeroImage1Oz.webp", // Using same image as placeholder
    productName: "Chief Hair Tonic",
    productDesc: "Daily scalp refresh",
    productPrice: "Rp129.000"
  },
  {
    id: 2,
    image: "/images/pose3.png",
    subtitle: "EXECUTIVE CONTOUR",
    desc: "Professional. Clean. Versatile.",
    productImg: "/uploads/1780911316948-SKU-POMADE_Blue-HeroImage1Oz.webp",
    productName: "Chief Styling Clay",
    productDesc: "Matte strong hold",
    productPrice: "Rp149.000"
  }
];

const HERO_PRODUCTS = [
  {
    _id: "69f03d66703506ffcba8db13",
    name: "CHIEF Space Clay",
    slug: "chief-space-clay",
    description: "Matte Strong Hold",
    price: 120000,
    stock: 5,
    category: "pomade" as const,
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
    category: "pomade" as const,
    image_url: "https://res.cloudinary.com/dvqb4tmqk/image/upload/v1781158946/2c35d215a695439e88d739e87fccba44_tplv-o3syd03w52-resize-jpeg_700_0_sxz9x9.jpg",
    images: [],
    tags: [],
    is_active: true,
    createdAt: "2026-04-28T04:58:05.286Z",
    updatedAt: "2026-06-11T06:27:05.274Z",
  }
];

const flipVariants = {
  enter: (direction: number) => ({
    rotateY: direction > 0 ? 45 : -45,
    opacity: 0,
    scale: 0.8,
    filter: 'blur(8px)',
  }),
  center: {
    zIndex: 1,
    rotateY: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: (direction: number) => ({
    zIndex: 0,
    rotateY: direction < 0 ? 45 : -45,
    opacity: 0,
    scale: 1.15,
    filter: 'blur(8px)',
  })
};

export default function HeroParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Auto slide loop for the 2 hero products
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % HERO_PRODUCTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);
  // Scroll-linked animation values
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Track active index for pagination dots
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) setActiveIndex(0);
    else if (latest < 0.66) setActiveIndex(1);
    else setActiveIndex(2);
  });

  // Overall container movement (moves up and scales to overlay text)
  const yOffset = useTransform(scrollYProgress, [0, 1], ["0%", "-25%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  // Individual image 3D scrub animations
  const img0RotateY = useTransform(scrollYProgress, [0, 0.33], [0, -90]);
  const img0Opacity = useTransform(scrollYProgress, [0, 0.25, 0.33], [1, 1, 0]);

  const img1RotateY = useTransform(scrollYProgress, [0.16, 0.33, 0.66, 0.83], [90, 0, 0, -90]);
  const img1Opacity = useTransform(scrollYProgress, [0.16, 0.33, 0.66, 0.83], [0, 1, 1, 0]);

  const img2RotateY = useTransform(scrollYProgress, [0.66, 0.83, 1], [90, 0, 0]);
  const img2Opacity = useTransform(scrollYProgress, [0.66, 0.83, 1], [0, 1, 1]);

  const imageAnims = [
    { rotateY: img0RotateY, opacity: img0Opacity },
    { rotateY: img1RotateY, opacity: img1Opacity },
    { rotateY: img2RotateY, opacity: img2Opacity },
  ];

  return (
    <div ref={containerRef} className="relative h-[200vh] -mt-20">
      <div className="sticky top-0 h-screen bg-[#f3efe8] flex flex-col pt-20 px-6 md:px-12 lg:px-16 overflow-hidden">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 w-full max-w-[1600px] mx-auto h-full pt-8 pb-8 relative">

          {/* Left Column */}
          <div className="lg:col-span-4 flex flex-col justify-start lg:justify-center h-full relative z-20 pt-12 lg:pt-20 pointer-events-none">
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
              className="font-display text-[3.5rem] lg:text-[4.5rem] xl:text-[5.5rem] font-bold leading-[1.05] tracking-tight mb-6 whitespace-nowrap"
            >
              <span className="text-[#1A1A1A]">Find the Cut</span><br />
              <span className="text-[#a8a49c]">That Fits You</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#8e8b82] text-[14px] lg:text-[15px] max-w-[320px] mb-8 leading-[1.6]"
            >
              Premium grooming, smart hairstyle preview, and seamless booking in one place.
            </motion.p>

            {/* Book Now Button moved here */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-12 pointer-events-auto"
            >
              <Link href="/booking" className="inline-flex items-center justify-center px-8 py-3.5 rounded-[4px] font-bold text-[10px] tracking-[0.15em] border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors text-center leading-tight">
                BOOK NOW
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-auto flex items-center gap-2 text-[#8e8b82] text-[10px] font-bold tracking-[0.25em] pb-4"
            >
              <div className="flex gap-2 items-center">
                {[0, 1, 2, 3].map((idx) => (
                  <span
                    key={idx}
                    className={`h-[1.5px] transition-all duration-500 ${idx === activeIndex ? 'w-8 bg-[#1a1a1a]' : 'w-4 bg-[#d6d2c9]'}`}
                  ></span>
                ))}
              </div>
              <span className="ml-5">{activeIndex + 1} / 4</span>
            </motion.div>
          </div>

          {/* Center Column - 3D Images */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-[65vh] lg:static lg:col-span-5 lg:h-full flex flex-col justify-center items-center lg:-mx-6 self-end -mb-8 lg:-mb-10 z-30 pointer-events-none lg:pointer-events-auto" 
            style={{ perspective: '1200px', y: yOffset, scale }}
          >
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
              {SLIDES.slice(0, 3).map((slide, idx) => (
                <motion.div
                  key={idx}
                  style={{
                    rotateY: imageAnims[idx].rotateY,
                    opacity: imageAnims[idx].opacity,
                    transformStyle: "preserve-3d"
                  }}
                  className="absolute inset-0 w-full h-full flex flex-col justify-center items-center origin-center mix-blend-multiply"
                >
                  <img
                    src={slide.image}
                    alt={slide.subtitle}
                    className="w-[110%] max-w-[110%] h-full object-contain object-bottom absolute inset-0 z-0 pointer-events-auto"
                  />
                </motion.div>
              ))}
            </div>

            {/* Try AI Button moved to a more balanced position */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute bottom-6 right-6 lg:right-36 md:right-24 z-50 pointer-events-auto"
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
              {/* Premium Glow Aura behind the card */}
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
                      product={HERO_PRODUCTS[carouselIndex]}
                      index={carouselIndex}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Card dots (Carousel Indicators) */}
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
    </div>
  );
}
