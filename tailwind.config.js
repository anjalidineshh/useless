/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#1a1410',
        surface: '#f5f0e8',
        amber: {
          warm: '#e8a855',
          light: '#f2c87a',
          dark: '#c47a1e',
        },
        cream: {
          DEFAULT: '#f5f0e8',
          dark: '#e8e0d0',
          muted: '#c8bfaa',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
        'bubble': 'bubble 2s ease-in infinite',
        'drip': 'drip 1.5s ease-in infinite',
        'mosquito': 'mosquito 2s ease-in-out infinite',
        'steam': 'steam 2s ease-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        bubble: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0.8' },
          '100%': { transform: 'translateY(-60px) scale(1.3)', opacity: '0' },
        },
        drip: {
          '0%': { transform: 'translateY(-10px)', opacity: '1' },
          '100%': { transform: 'translateY(40px)', opacity: '0' },
        },
        steam: {
          '0%': { transform: 'translateY(0) scaleX(1)', opacity: '0.6' },
          '100%': { transform: 'translateY(-40px) scaleX(1.5)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
