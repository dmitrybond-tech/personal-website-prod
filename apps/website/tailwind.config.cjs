const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  darkMode: ['class'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: colors.white,
      primary: colors.indigo,
      gray: colors.gray,
    },
    extend: {
      spacing: {
        18: '4.5rem',
      },
      keyframes: {
        show: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        show: 'show 225ms ease-in-out',
      },
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};

