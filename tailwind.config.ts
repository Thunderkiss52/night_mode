import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#000000',
          900: '#0a0a0a',
          800: '#1a1a1a'
        },
        gold: {
          500: '#D4AF37',
          400: '#e6c459'
        }
      },
      boxShadow: {
        glow: '0 0 24px rgba(212, 175, 55, 0.24)'
      },
      backgroundImage: {
        'night-gradient': 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)'
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
