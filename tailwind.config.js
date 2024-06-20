/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-blue": "#264569",
        "bright-blue": "#3082CE",
        "clear-blue": "#61B1C3",
        "custom-blue": "#1467B4",
        "custom-dark-blue": "356193",
        "custom-blue-1": "#65A8F6",
      }
    },
  },
  plugins: [],
}

