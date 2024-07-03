const colors = require('tailwindcss/colors')
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
        orange: colors.orange,
        teal: colors.teal,
      },
    },
    screens: {
      'sm': '640px',
      'sm-custom': '700px',
      'md': '768px',
      'md-custom': '900px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      spacing: {
        '0.25': '1px',
        '20%': '20%',
      },
      colors: {
        "dark-blue": "#264569",
        "custom-blue-1": "#65A8F6",
        "teal": "#65a8f6",
      },
      gridTemplateColumns: {
        'sidebar': '20% 1fr', // For smaller screens
        'sidebar-lg': 'minmax(0, 16rem) 1fr', // For larger screens
        "table": "10% 18% 18% 18% 18% 18%",
      },
      fontSize: {
        small: "13px",
        xxs: "10px",
        xxxs: "9px",
      },
      maxWidth: {
        'wide': '16rem',
      }

    },
  },
  plugins: [],
}

