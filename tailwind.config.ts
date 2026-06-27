import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f1',
          100: '#d6ecdd',
          200: '#aedabc',
          300: '#7fc394',
          400: '#52a96e',
          500: '#2f8f52',
          600: '#207240',
          700: '#1b5a35',
          800: '#17472c',
          900: '#123a25',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
