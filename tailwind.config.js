/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eaf2ff',
          100: '#d6e4ff',
          200: '#aec8ff',
          300: '#85abff',
          400: '#5c8efe',
          500: '#3370fb',
          600: '#1f5fe3',
          700: '#1a4db6',
          800: '#143a88',
          900: '#0b2a63',
        },
        accent: {
          500: '#f59e0b',
          600: '#d97706',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#F7F7FB',
          dark: '#0B1220',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
  boxShadow: {
    soft: '0 8px 24px rgba(17, 24, 39, 0.08)',
    hover: '0 16px 40px rgba(17, 24, 39, 0.12)', // <-- PODMIEŃ tę wartość
  },
    },
  },
  plugins: [],
};
