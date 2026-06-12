import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {

      // ── Fonts ───────────────────────────────────────────────────────────────
      fontFamily: {
        outfit: ['var(--font-outfit)', 'sans-serif'],
        inter:  ['var(--font-inter)',  'sans-serif'],
        // Aliases used in component className props
        display: ['var(--font-outfit)', 'sans-serif'],
        body:    ['var(--font-inter)',  'sans-serif'],
      },

      // ── Colors ──────────────────────────────────────────────────────────────
      colors: {

        // Van-Vert brand palette
        navy: {
          DEFAULT: '#002d78',
          deep:    '#001d50',
        },
        sky: {
          DEFAULT: '#0078a5',
          light:   '#0087a5',
          bright:  '#0087a5',
          pale:    '#e1f4f7',
          mist:    '#f0f8fb',
        },

        // Surface / neutral
        surface:  '#f8fbfd',
        'text-primary':   '#0a1628',
        'text-secondary': '#4a6070',
        'text-muted':     '#8ba0ae',

        // Status
        status: {
          draft:      { text: '#64748b', bg: '#f1f5f9' },
          submitted:  { text: '#0369a1', bg: '#e0f2fe' },
          'in-review':{ text: '#0369a1', bg: '#e0f2fe' },
          ready:      { text: '#16a34a', bg: '#dcfce7' },
          attention:  { text: '#d97706', bg: '#fef3c7' },
          missing:    { text: '#dc2626', bg: '#fee2e2' },
        },

        // Shadcn token aliases → Van-Vert palette
        // These feed hsl(var(--*)) inside shadcn components
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // ── Border radius ────────────────────────────────────────────────────────
      // Mirrors --r-* tokens in globals.css
      borderRadius: {
        sm:   '4px',
        md:   '6px',
        lg:   '8px',
        xl:   '12px',
        '2xl':'16px',
        full: '9999px',
      },

      // ── Animations ───────────────────────────────────────────────────────────
      // Only what the new design actually uses
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'verified-pop': {
          from: { transform: 'scale(0.5)', opacity: '0' },
          to:   { transform: 'scale(1)',   opacity: '1' },
        },
        'verified-bar': {
          from: { width: '0%' },
          to:   { width: '100%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'verified-pop':   'verified-pop 0.4s cubic-bezier(.34,1.56,.64,1)',
        'verified-bar':   'verified-bar 2s ease-in-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
