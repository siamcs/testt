/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './assets/js/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff5ff', 100: '#dbe8fe', 200: '#bfd6fe', 400: '#60a5fa',
          500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#0f2a5c', 950: '#0b1b3f',
        },
        accent: { 400: '#fbbf24', 500: '#f59e0b' },
      },
    },
  },
};
