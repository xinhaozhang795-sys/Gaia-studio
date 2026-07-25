/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"SF Mono"', '"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        gaia: {
          900: '#050608',
          800: '#0a0c10',
          700: '#10131a',
          600: '#181c26',
          500: '#222836',
          400: '#2e3548',
          300: '#3d465c',
          200: '#5b6478',
          100: '#8a93a8',
          50: '#c5cad8',
        },
        accent: {
          DEFAULT: '#0a84ff',
          50: '#e0f0ff',
          100: '#bbd9ff',
          200: '#80b8ff',
          300: '#4098ff',
          400: '#0a84ff',
          500: '#0066ff',
          600: '#0050d4',
          700: '#003ca0',
          800: '#002a70',
          900: '#001a42',
        },
        success: '#30d158',
        warning: '#ffd60a',
        error: '#ff453a',
        ocean: '#1a6fff',
        land: '#2d7a4e',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'spin-slow': 'spin 60s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
