import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C97A',
          dark: '#8B6914',
          bright: '#FFD700',
        },
        dark: {
          DEFAULT: '#0D0D0D',
          1: '#111111',
          2: '#1A1A1A',
          3: '#212121',
          4: '#2A2A2A',
        },
      },
      boxShadow: {
        gold: '0 0 20px rgba(201,168,76,0.3), 0 4px 15px rgba(0,0,0,0.5)',
        'gold-lg': '0 0 40px rgba(201,168,76,0.4), 0 8px 30px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
export default config;
