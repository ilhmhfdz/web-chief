import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand — charcoal black as primary, warm off-white as secondary
        brand: {
          50:  '#fafafa',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#1c1917', // charcoal black — primary CTA
          600: '#0c0a09',
          700: '#0c0a09',
          800: '#0c0a09',
          900: '#0c0a09',
          950: '#000000',
        },
        // Accent — warm amber/gold, used sparingly
        accent: {
          DEFAULT: '#b5872a',
          light:   '#d4a93c',
          dark:    '#8c6520',
        },
        // Surface — warm light palette (not dark mode)
        surface: {
          DEFAULT: '#fafaf9',   // warm white background
          raised:  '#f5f5f4',   // cards / raised elements
          overlay: '#e7e5e4',   // inputs, hovered states
          muted:   '#d6d3d1',   // borders, dividers
          border:  '#a8a29e',   // subtle borders
          ink:     '#1c1917',   // primary text
          sub:     '#57534e',   // secondary text
        },
      },
      fontFamily: {
        sans:    ['Satoshi', 'var(--font-nunito-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Satoshi', 'var(--font-playfair)', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        ecommerce: ['Satoshi', 'var(--font-plus-jakarta)', 'sans-serif'],
        rubik:   ['Satoshi', 'var(--font-rubik)', 'sans-serif'],
        nunito:  ['Satoshi', 'var(--font-nunito-sans)', 'sans-serif'],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        DEFAULT: '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(181,135,42,0.08), transparent)',
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease-out',
        'fade-in-up':  'fadeInUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'shimmer':     'shimmer 1.8s linear infinite',
        'scan':        'scan 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
