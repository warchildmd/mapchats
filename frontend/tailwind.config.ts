import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Electric Cartographer design system
        primary: {
          DEFAULT: '#97a9ff',
          dim: '#3e65ff',
          fixed: '#859aff',
          'fixed-dim': '#718bff',
        },
        secondary: {
          DEFAULT: '#ffbf00',
          dim: '#eeb200',
        },
        tertiary: {
          DEFAULT: '#ac8aff',
        },
        error: '#ff6e84',
        surface: {
          DEFAULT: '#0e0e10',
          dim: '#0e0e10',
          low: '#131315',
          container: '#19191c',
          high: '#1f1f22',
          highest: '#262528',
          variant: '#262528',
          bright: '#2c2c2f',
        },
        'on-surface': {
          DEFAULT: '#f6f3f5',
          variant: '#acaaad',
        },
        outline: {
          DEFAULT: '#7a797c',
          variant: '#48474a',
        },
      },
      fontFamily: {
        display: ['var(--font-jakarta)', 'sans-serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
        sans: ['var(--font-manrope)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '3rem',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.05)' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      backgroundImage: {
        'kinetic-gradient': 'linear-gradient(135deg, #97a9ff 0%, #859aff 100%)',
        'alert-gradient': 'linear-gradient(135deg, #ffbf00 0%, #eeb200 100%)',
        'event-gradient': 'linear-gradient(135deg, #ac8aff 0%, #9b7aff 100%)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
