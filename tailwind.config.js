/** @type {import('tailwindcss').Config} */
export default {
  // IMPORTANT: "class" enables dark mode via the "dark" class on <html>
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};