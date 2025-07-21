/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        seagreen: {
          50: '#f0f9f9',
          100: '#d9f2f2',
          200: '#b3e6e6',
          300: '#8cd9d9',
          400: '#66cdcd',
          500: '#20B2AA',
          600: '#1d9e97',
          700: '#198a84',
          800: '#157671',
          900: '#12625e'
        }
      }
    },
  },
  plugins: [],
};