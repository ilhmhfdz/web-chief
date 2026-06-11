/** @type {import('next').NextConfig} */
const nextConfig = {
  // [MID-01] Single config file — next.config.js removed to eliminate conflict.

  eslint: {
    // Ignore ESLint during builds — project uses its own local .eslintrc config
    ignoreDuringBuilds: true,
  },

  images: {
    // [SEC-MID-01] Replaced wildcard hostname with explicit trusted domains.
    // Wildcard `hostname: '**'` allows any domain which can enable SSRF attacks.
    // Add only domains you actually use for product images.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.chiefgrooming.id' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'www.chief-supplies.id' },
      // Next.js placeholder / test images
      { protocol: 'https', hostname: 'placehold.co' },
      // ── Tokopedia CDN (existing product images) ──
      // Note: Tokopedia URLs are signed and expire — migrate images to Cloudinary ASAP
      { protocol: 'https', hostname: '*.tokopedia-static.net' },
      { protocol: 'https', hostname: '*.tokopediacdn.com' },
      { protocol: 'https', hostname: 'images.tokopedia.net' },
    ],
  },
};

export default nextConfig;
