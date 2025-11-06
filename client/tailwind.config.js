/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Orange brand palette
        primary: {
          50: '#FFF7ED',   // orange-50
          100: '#FFEDD5',  // orange-100
          200: '#FED7AA',  // orange-200
          300: '#FDBA74',  // orange-300
          400: '#FB923C',  // orange-400
          500: '#F97316',  // orange-500 (brand primary)
          600: '#EA580C',  // orange-600
          700: '#C2410C',  // orange-700
          800: '#9A3412',  // orange-800
          900: '#7C2D12',  // orange-900
        },
        // Warm accent (amber)
        accent: {
          50: '#FFFBEB',   // amber-50
          100: '#FEF3C7',  // amber-100
          200: '#FDE68A',  // amber-200
          300: '#FCD34D',  // amber-300
          400: '#FBBF24',  // amber-400
          500: '#F59E0B',  // amber-500
          600: '#D97706',  // amber-600
          700: '#B45309',  // amber-700
          800: '#92400E',  // amber-800
          900: '#78350F',  // amber-900
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      spacing: {
        safe: 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
}
