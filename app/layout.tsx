import type { Metadata } from 'next';
import { Inter, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppFloatingButton from '@/components/layout/WhatsAppFloatingButton';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from 'sonner';

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
    <html lang="id" className={`${inter.variable} ${playfair.variable} ${plusJakarta.variable}`}>
      <body className="flex flex-col min-h-screen">
        <CartProvider>
          {/* Ambient background glow */}
          <div
            className="pointer-events-none fixed inset-0 z-0"
            aria-hidden="true"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-500/[0.03] rounded-full blur-3xl" />
          </div>

          {/* Navigation */}
          <Navbar />

          {/* Main content — extra bottom padding for mobile nav */}
          <main className="relative z-10 flex-1 pb-16 lg:pb-0">
            {children}
          </main>

          {/* Footer */}
          <Footer />

          {/* WhatsApp FAB — component handles its own fixed positioning */}
          <WhatsAppFloatingButton />

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
