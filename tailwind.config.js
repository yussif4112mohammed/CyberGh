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
        // ── Dark Glass + Teal design tokens ──────────────────────
        teal: {
          950: '#042f2e',
          900: '#134e4a',
          800: '#115e59',
          700: '#0f766e',
          600: '#0d9488',
          500: '#14b8a6',
          400: '#2dd4bf',
          300: '#5eead4',
          200: '#99f6e4',
          100: '#ccfbf1',
          50:  '#f0fdfa',
        },
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card:        '0 1px 3px rgba(10,22,40,0.08), 0 4px 16px rgba(10,22,40,0.06)',
        'card-hover':'0 4px 6px rgba(10,22,40,0.1), 0 10px 30px rgba(10,22,40,0.1)',
        'teal-glow': '0 0 20px rgba(20, 184, 166, 0.3), 0 0 60px rgba(20, 184, 166, 0.1)',
        'teal-sm':   '0 0 10px rgba(20, 184, 166, 0.2)',
        'glass':     '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backgroundImage: {
        'teal-gradient':  'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)',
        'dark-gradient':  'linear-gradient(135deg, #0a1628 0%, #042f2e 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(15,118,110,0.2) 0%, rgba(3,105,161,0.1) 100%)',
        'glow-radial':    'radial-gradient(ellipse at center, rgba(20,184,166,0.15) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':      'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(20,184,166,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(20,184,166,0.6)' },
        },
      },
    },
  },
  plugins: [],
};
