
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
        border: 'hsl(0 0% 50%)',
        input: 'hsl(0 0% 50%)',
        ring: 'hsl(51 100% 50%)',
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(0 0% 0%)',
        primary: {
          DEFAULT: 'hsl(51 100% 50%)',
          foreground: 'hsl(0 0% 0%)'
        },
        secondary: {
          DEFAULT: 'hsl(0 0% 50%)',
          foreground: 'hsl(0 0% 100%)'
        },
        destructive: {
          DEFAULT: 'hsl(0 100% 50%)',
          foreground: 'hsl(0 0% 100%)'
        },
        muted: {
          DEFAULT: 'hsl(0 0% 94%)',
          foreground: 'hsl(0 0% 50%)'
        },
        accent: {
          DEFAULT: 'hsl(51 100% 50%)',
          foreground: 'hsl(0 0% 0%)'
        },
        popover: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(0 0% 0%)'
        },
        card: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(0 0% 0%)'
        },
        sidebar: {
          DEFAULT: 'hsl(0 0% 4%)',
          foreground: 'hsl(0 0% 100%)',
          primary: 'hsl(51 100% 50%)',
          'primary-foreground': 'hsl(0 0% 0%)',
          accent: 'hsl(0 0% 50%)',
          'accent-foreground': 'hsl(0 0% 100%)',
          border: 'hsl(0 0% 20%)',
          ring: 'hsl(51 100% 50%)'
        },
        urbana: {
          gold: 'hsl(51 100% 50%)',
          brown: 'hsl(35 74% 5%)',
          black: 'hsl(0 0% 4%)',
          gray: 'hsl(0 0% 50%)',
          light: 'hsl(0 0% 100%)',
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
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
