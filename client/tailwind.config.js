/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false,
  },
  darkMode: 'class', // Support manual dark mode class on HTML or body
  theme: {
    extend: {},
  },
  plugins: [],
};
