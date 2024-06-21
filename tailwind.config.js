/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'md-custom': '800px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        "dark-blue": "#264569",
        "custom-blue-1": "#65A8F6",
        "teal": "#65a8f6",
      },
      gridTemplateColumns: {
        "sidebar": "20% 80%",
        "table": "10% 18% 18% 18% 18% 18%",
      },
      fontSize: {
        small: "12.5px",
      }

    },
  },
  plugins: [],
}

