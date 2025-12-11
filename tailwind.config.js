/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Draftnex Brand Colors
        primary: '#4B72FF',        // Draftnex Blau
        accent: '#00D4A6',         // KI / Intelligence

        // Dark Theme Backgrounds
        'dark-bg': '#0F0F11',      // Main Background
        'dark-surface': '#121214', // Cards & Panels
        'dark-elevated': '#1A1A1D',// Elevated surfaces

        // Text Colors
        'text-primary': '#F1F1F1', // Main text
        'text-secondary': '#B9B9B9',// Secondary text
        'text-muted': '#6B6B6B',   // Muted text

        // Borders & Dividers
        'border-dark': '#2A2A2E',  // Borders

        // Category Colors
        'cat-task': '#4B72FF',     // Task - Blue
        'cat-event': '#9b5cff',    // Event - Purple
        'cat-idea': '#00D4A6',     // Idea - Turquoise
        'cat-info': '#6B6B6B',     // Info - Gray
        'cat-person': '#f2c94c',   // Person - Yellow
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'draftnex': '0 4px 24px rgba(75, 114, 255, 0.12)',
        'glow-primary': '0 0 20px rgba(75, 114, 255, 0.3)',
        'glow-accent': '0 0 20px rgba(0, 212, 166, 0.3)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(75, 114, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(75, 114, 255, 1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionDuration: {
        '200': '200ms',
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.33, 1, 0.68, 1)',
      },
    },
  },
  plugins: [],
}
