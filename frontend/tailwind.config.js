/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chat: {
          user: '#a7f3d0',
          assistant: '#f3f4f6',
          border: '#e5e7eb',
          text: '#1f2937',
          muted: '#6b7280',
        }
      }
    },
  },
  plugins: [],
}
