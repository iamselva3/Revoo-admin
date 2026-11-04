/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        revoo: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#0B6623', // Primary Forest Green
          800: '#166534',
          900: '#073814', // Deep Secondary Green
          accent: '#70C000', // Vibrant Lime Green
        },
      },
    },
  },
  plugins: [],
};

