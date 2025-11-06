
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // Tema Costa Urbana - Tema Claro Elegante
        border: 'hsl(0 0% 88%)',
        input: 'hsl(0 0% 95%)',
        ring: 'hsl(43 60% 55%)',
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(0 0% 10%)',
        primary: {
          DEFAULT: 'hsl(43 60% 55%)',
          foreground: 'hsl(0 0% 100%)'
        },
        secondary: {
          DEFAULT: 'hsl(0 0% 96%)',
          foreground: 'hsl(0 0% 10%)'
        },
        destructive: {
          DEFAULT: 'hsl(0 84% 60%)',
          foreground: 'hsl(0 0% 100%)'
        },
        muted: {
          DEFAULT: 'hsl(0 0% 96%)',
          foreground: 'hsl(0 0% 40%)'
        },
        accent: {
          DEFAULT: 'hsl(43 60% 55%)',
          foreground: 'hsl(0 0% 100%)'
        },
        popover: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(0 0% 10%)'
        },
        card: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(0 0% 10%)'
        },
        sidebar: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(0 0% 10%)',
          primary: 'hsl(43 60% 55%)',
          'primary-foreground': 'hsl(0 0% 100%)',
          accent: 'hsl(0 0% 96%)',
          'accent-foreground': 'hsl(0 0% 10%)',
          border: 'hsl(0 0% 90%)',
          ring: 'hsl(43 60% 55%)'
        },
        urbana: {
          gold: 'hsl(43 65% 60%)',
          'gold-light': 'hsl(43 70% 75%)',
          'gold-dark': 'hsl(43 60% 45%)',
          'gold-vibrant': 'hsl(45 80% 65%)',
          brown: 'hsl(24 45% 15%)',
          'brown-light': 'hsl(24 40% 25%)',
          black: 'hsl(0 0% 5%)',
          'black-soft': 'hsl(0 0% 8%)',
          gray: 'hsl(0 0% 20%)',
          'gray-light': 'hsl(0 0% 45%)',
          light: 'hsl(0 0% 98%)',
          'accent-cyan': 'hsl(180 50% 50%)',
          'accent-purple': 'hsl(270 50% 55%)',
        }
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.4rem',
        sm: '0.2rem'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow': {
          '0%, 100%': { opacity: '0.5', boxShadow: '0 0 20px hsl(43 65% 60% / 0.3)' },
          '50%': { opacity: '1', boxShadow: '0 0 40px hsl(43 65% 60% / 0.6)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slideRight': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out forwards',
      },
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'raleway': ['"Raleway"', 'sans-serif'],
        'poppins': ['"Poppins"', 'sans-serif'],
        'montserrat': ['"Montserrat"', 'sans-serif'],
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
