/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        offwhite: '#FDFDFD',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
      }
    },
  },
  plugins: [],
}
