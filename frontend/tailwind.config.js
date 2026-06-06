/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#111827', // Tailwind gray-900
        surface: '#1F2937', // Tailwind gray-800
        primary: '#3B82F6', // Tailwind blue-500
        accent: '#F59E0B', // Tailwind amber-500
        perform: '#10B981', // Tailwind emerald-500
        underperform: '#EAB308', // Tailwind yellow-500
        critical: '#EF4444', // Tailwind red-500
      }
    },
  },
  plugins: [],
}
