import type { Metadata } from 'next';
import { Inter, Playfair_Display, Plus_Jakarta_Sans, Rubik, Nunito_Sans } from 'next/font/google';
import './globals.css';
import React, { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from 'sonner';
import ChatWidget from '@/components/ai/ChatWidget';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Chief Supplies — Perlengkapan Pria Premium',
    template: '%s | Chief Supplies',
  },
  description:
    'Toko online perlengkapan pria dengan teknologi AI Face Shape Detection untuk rekomendasi produk yang sempurna sesuai bentuk wajah Anda.',
  keywords: [
    'perlengkapan pria',
    'chief supplies',
    'toko online',
    'ai recommendation',
    'face shape detection',
    'kacamata pria',
    'aksesoris pria',
  ],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Chief Supplies',
    title: 'Chief Supplies — Perlengkapan Pria Premium',
    description:
      'Toko online perlengkapan pria dengan teknologi AI Face Shape Detection.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${playfair.variable} ${plusJakarta.variable} ${rubik.variable} ${nunitoSans.variable}`}>
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <CartProvider>
          {/* Ambient background glow */}
          <div
            className="pointer-events-none fixed inset-0 z-0"
            aria-hidden="true"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-500/[0.03] rounded-full blur-3xl" />
          </div>

          {/* Navigation */}
          <Suspense fallback={<div className="h-16 lg:h-20 bg-white border-b border-surface-muted/30" />}>
            <Navbar />
          </Suspense>

          {/* Main content — extra bottom padding for mobile nav */}
          <main className="relative z-10 flex-1 pb-16 lg:pb-0">
            {children}
          </main>

          {/* Footer */}
          <Footer />

          {/* Chat Widget */}
          <ChatWidget />

          {/* IMP-012: Mobile bottom navigation */}
          <MobileBottomNav />

          {/* IMP-014: Global toast notifications */}
          <Toaster
            position="bottom-right"
            richColors
            toastOptions={{
              duration: 3000,
              style: { fontFamily: 'Inter, system-ui, sans-serif' },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
