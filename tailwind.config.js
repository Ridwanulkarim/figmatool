/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        figma: {
          bg: '#1e1e1e',
          panel: '#2c2c2c',
          border: '#383838',
          hover: '#3e3e3e',
          active: '#0d99ff',
          text: '#e0e0e0',
          muted: '#8c8c8c',
          accent: '#0d99ff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
