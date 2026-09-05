/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f8fafc',
        secondary: '#ffffff',
        panel: '#ffffff',
        'panel-hover': '#f1f5f9',
        border: '#e2e8f0',
        'border-glow': '#cbd5e1',
        'text-primary': '#0f172a',
        'text-secondary': '#475569',
        'text-muted': '#94a3b8',
        cyan: { DEFAULT: '#0284c7', light: '#e0f2fe' },
        blue: { DEFAULT: '#2563eb', light: '#dbeafe' },
        indigo: { DEFAULT: '#4f46e5', light: '#e0e7ff' },
        violet: { DEFAULT: '#7c3aed', light: '#ede9fe' },
        emerald: { DEFAULT: '#16a34a', light: '#dcfce7' },
        amber: { DEFAULT: '#d97706', light: '#fef3c7' },
        orange: { DEFAULT: '#ea580c', light: '#ffedd5' },
        danger: { DEFAULT: '#dc2626', light: '#fee2e2' },
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'color-sky': '0 10px 25px -5px rgba(2, 132, 199, 0.15)',
        'color-indigo': '0 10px 25px -5px rgba(79, 70, 229, 0.15)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
