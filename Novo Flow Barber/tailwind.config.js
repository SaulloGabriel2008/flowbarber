/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-gold': '#D4AF37',
        'primary-gold-dark': '#B8962E',
        'primary-blue': '#137FEC',
        'bg-primary': '#0F0F0F',
        'bg-secondary': '#1A1A1A',
        'text-secondary': '#A9A9A9',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
      },
    },
  },
  plugins: [],
};
