
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
        border: '#808080',
        input: '#808080',
        ring: '#FFD700',
        background: '#FFFFFF',
        foreground: '#000000',
        primary: {
          DEFAULT: '#FFD700',
          foreground: '#000000'
        },
        secondary: {
          DEFAULT: '#808080',
          foreground: '#FFFFFF'
        },
        destructive: {
          DEFAULT: '#FF0000',
          foreground: '#FFFFFF'
        },
        muted: {
          DEFAULT: '#F0F0F0',
          foreground: '#808080'
        },
        accent: {
          DEFAULT: '#FFD700',
          foreground: '#000000'
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#000000'
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#000000'
        },
        sidebar: {
          DEFAULT: '#0A0A0A',
          foreground: '#FFFFFF',
          primary: '#FFD700',
          'primary-foreground': '#000000',
          accent: '#808080',
          'accent-foreground': '#FFFFFF',
          border: '#333333',
          ring: '#FFD700'
        },
        urbana: {
          gold: '#FFD700',     // Golden for luxury
          brown: '#1A0F0A',    // Almost black
          black: '#0A0A0A',    // Pure black
          gray: '#808080',     // Medium gray
          light: '#FFFFFF',    // Pure white
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
