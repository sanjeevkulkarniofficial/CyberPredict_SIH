/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Times New Roman"', 'Times', 'serif'],
        heading: ['"Times New Roman"', 'Times', 'serif'],
        display: ['"Times New Roman"', 'Times', 'serif'],
        mono: ['"Times New Roman"', 'Times', 'serif'],
      },
      colors: {
        cyber: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          subtle: '#F1F5F9',
          border: '#E2E8F0',
          dark: '#0F172A',
          slate: '#475569',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#1E1B4B',
        },
      },
      boxShadow: {
        'card-subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'glow-indigo': '0 0 20px -3px rgba(99, 102, 241, 0.25)',
        'glow-indigo-lg': '0 12px 30px -5px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
        'glow-emerald-lg': '0 12px 30px -5px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.25)',
        'glow-rose-lg': '0 12px 30px -5px rgba(244, 63, 94, 0.35)',
        'glow-amber-lg': '0 12px 30px -5px rgba(245, 158, 11, 0.35)',
        'cyber-glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        'cyber-card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.04)',
        'cyber-hover': '0 14px 28px -6px rgba(15, 23, 42, 0.08), 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
        'elevated': '0 20px 40px -12px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sonar': 'sonar 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'float-slow': 'floatSlow 4s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s infinite',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in-scale': 'fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        sonar: {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        floatSlow: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backdropBlur: {
        'xs': '4px',
      },
    },
  },
  plugins: [],
}