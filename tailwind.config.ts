
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
        // Tema Costa Urbana - Cores corretas em HSL
        border: 'hsl(0 0% 23%)',
        input: 'hsl(0 0% 23%)',
        ring: 'hsl(43 47% 56%)',
        background: 'hsl(0 0% 7%)',
        foreground: 'hsl(0 0% 96%)',
        primary: {
          DEFAULT: 'hsl(43 47% 56%)',
          foreground: 'hsl(0 0% 7%)'
        },
        secondary: {
          DEFAULT: 'hsl(24 35% 13%)',
          foreground: 'hsl(0 0% 96%)'
        },
        destructive: {
          DEFAULT: 'hsl(0 84% 60%)',
          foreground: 'hsl(0 0% 96%)'
        },
        muted: {
          DEFAULT: 'hsl(0 0% 15%)',
          foreground: 'hsl(0 0% 70%)'
        },
        accent: {
          DEFAULT: 'hsl(43 47% 56%)',
          foreground: 'hsl(0 0% 7%)'
        },
        popover: {
          DEFAULT: 'hsl(0 0% 7%)',
          foreground: 'hsl(0 0% 96%)'
        },
        card: {
          DEFAULT: 'hsl(0 0% 10%)',
          foreground: 'hsl(0 0% 96%)'
        },
        sidebar: {
          DEFAULT: 'hsl(0 0% 7%)',
          foreground: 'hsl(0 0% 96%)',
          primary: 'hsl(43 47% 56%)',
          'primary-foreground': 'hsl(0 0% 7%)',
          accent: 'hsl(0 0% 23%)',
          'accent-foreground': 'hsl(0 0% 96%)',
          border: 'hsl(0 0% 15%)',
          ring: 'hsl(43 47% 56%)'
        },
        urbana: {
          gold: 'hsl(43 47% 56%)',
          'gold-light': 'hsl(43 47% 70%)',
          'gold-dark': 'hsl(43 47% 40%)',
          brown: 'hsl(24 35% 13%)',
          black: 'hsl(0 0% 7%)',
          gray: 'hsl(0 0% 23%)',
          'gray-light': 'hsl(0 0% 40%)',
          light: 'hsl(0 0% 96%)',
        }
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.4rem',
        sm: '0.2rem'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-in-out forwards',
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
