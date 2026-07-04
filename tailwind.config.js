/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A1628',
          900: '#0D1F3C',
          800: '#112850',
          700: '#1A3A6B',
          100: '#E8EDF5',
          50:  '#F0F4FA',
        },
        ghana: {
          red:   '#C8102E',
          gold:  '#FCD116',
          green: '#006B3F',
        },
        severity: {
          critical: '#C8102E',
          high:     '#E65100',
          medium:   '#F57C00',
          low:      '#1E88E5',
          info:     '#6B7280',
          pass:     '#2E7D32',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(10,22,40,0.08), 0 4px 16px rgba(10,22,40,0.06)',
        'card-hover': '0 4px 6px rgba(10,22,40,0.1), 0 10px 30px rgba(10,22,40,0.1)',
      },
    },
  },
  plugins: [],
};
