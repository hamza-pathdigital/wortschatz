import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        primary: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        highlight: 'var(--highlight)',
        correct: 'var(--correct)',
        wrong: 'var(--wrong)',
        border: 'var(--border)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      maxWidth: {
        content: '680px',
      },
    },
  },
  plugins: [],
}

export default config
