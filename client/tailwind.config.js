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
        // WhatsApp-inspired green color palette
        primary: {
          50: '#e8f9f0',   // Very light green
          100: '#d1f4e0',  // Light green background
          200: '#a3e9c1',  // Soft green
          300: '#75dea2',  // Light WhatsApp green
          400: '#47d383',  // Medium green
          500: '#25D366',  // WhatsApp primary green
          600: '#1ead52',  // Darker green
          700: '#128C7E',  // WhatsApp teal
          800: '#0d6b5f',  // Deep teal
          900: '#075E54',  // WhatsApp dark teal
        },
        accent: {
          50: '#fffef5',   // Very light lime
          100: '#fffceb',  // Light lime
          200: '#fef9c7',  // Soft yellow-green
          300: '#fdf5a3',  // Lime highlight
          400: '#dcf8c6',  // WhatsApp chat bubble green
          500: '#c8e6c9',  // Light accent green
          600: '#a5d6a7',  // Medium accent
          700: '#81c784',  // Vibrant accent
          800: '#66bb6a',  // Deep accent
          900: '#4caf50',  // Rich green accent
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
    },
  },
  plugins: [],
}
