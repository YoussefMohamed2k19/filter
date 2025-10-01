/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'teal-primary': '#0c8596',
        'magenta-primary': '#a3216e',
      },
      backgroundImage: {
        'gradient-frame': 'linear-gradient(90deg, #0c8596 0%, #a3216e 100%)',
      }
    },
  },
  plugins: [],
}

