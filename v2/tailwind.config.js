/** @type {import('tailwindcss').Config} */
const withAlpha = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic surfaces (switch with the theme, see src/global.css)
        bg: withAlpha('bg'),
        card: withAlpha('card'),
        surface: withAlpha('surface'),
        line: withAlpha('line'),
        text: withAlpha('text'),
        muted: withAlpha('muted'),
        hint: withAlpha('hint'),
        // Mode accents: fill colors are fixed, "-fg" variants are readable text on the current bg
        talent: { DEFAULT: '#6D28D9', light: '#A78BFA', fg: withAlpha('talent-fg') },
        project: { DEFAULT: '#0891B2', light: '#22D3EE', fg: withAlpha('project-fg') },
        investor: { DEFAULT: '#B45309', light: '#FCD34D', fg: withAlpha('investor-fg') },
        notif: '#F97316',
        success: '#4ADE80',
        danger: { DEFAULT: '#F87171', fg: withAlpha('danger-fg') },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-1.5px',
        tighter: '-1px',
        tight: '-0.5px',
      },
      borderRadius: {
        chip: '999px',
        field: '14px',
        btn: '16px',
        card: '20px',
        sheet: '28px',
      },
    },
  },
  plugins: [],
};
