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
        // Brand colour comes from CSS variables so visitors can pick an accent colour (see src/input.css)
        brand: Object.fromEntries([50, 100, 200, 400, 500, 600, 700, 900, 950]
          .map(s => [s, `rgb(var(--brand-${s}) / <alpha-value>)`])),
        accent: { 400: '#fbbf24', 500: '#f59e0b' },
      },
    },
  },
};
