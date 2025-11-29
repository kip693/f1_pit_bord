/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // F1 Team Colors (2024)
        'redbull': '#3671C6',
        'ferrari': '#E8002D',
        'mercedes': '#27F4D2',
        'mclaren': '#FF8000',
        'astonmartin': '#229971',
        'alpine': '#FF87BC',
        'williams': '#64C4FF',
        'alphatauri': '#6692FF',
        'alfaromeo': '#C92D4B',
        'haas': '#B6BABD',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
