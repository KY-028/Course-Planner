/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Colors as shown in figma - Bill
      colors: {
        blue: '#3082ce',
        darkBlue: '#356193',
        darkdarkBlue: '#264569',
        teal: '#61b1c3',
      },
    },
  },
  plugins: [],
}

