/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b1329',
          800: '#111e38',
          700: '#1d2c4d',
        },
        clinical: {
          primary: '#2563eb',
          hover: '#1d4ed8',
          muted: '#eff6ff',
        },
        risk: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
