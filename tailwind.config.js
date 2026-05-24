/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './main.js', './data/*.js'],
  theme: {
    extend: {
      colors: {
        devnet: {
          primary: '#a855f7',
          accent: '#c084fc',
          bg: '#0a0612',
          surface: '#140a24',
          'surface-2': '#1a0f2e',
          border: '#2e1a4a',
          'border-strong': '#3d2563',
          muted: '#a1a1aa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        brand: ['Orbitron', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
