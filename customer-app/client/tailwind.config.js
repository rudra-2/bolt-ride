/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        evgreen: "#129d4c", // glossy neon green
        evwhite: "#FFFFFF"
      }
    }
  },
  plugins: [],
}
