/**** @type {import('tailwindcss').Config} ****/
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quest: {
          purple: "#6D5BD0",
          pink: "#FF6BB5",
          yellow: "#FFD166",
          teal: "#2EC4B6",
        },
      },
      boxShadow: {
        'xl-soft': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      },
      borderRadius: {
        'xl': '1rem'
      },
      keyframes: {
        bounceOnce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        }
      },
      animation: {
        'bounce-once': 'bounceOnce 400ms ease-in-out',
        'shake': 'shake 500ms ease-in-out'
      },
      fontFamily: {
        fredoka: ['Fredoka', 'ui-sans-serif', 'system-ui'],
        nunito: ['Nunito', 'ui-sans-serif', 'system-ui']
      }
    },
  },
  plugins: [],
}
