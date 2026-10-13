/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        froyo: {
          canvas: 'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          border: 'var(--border-subtle)',
          accent: 'var(--accent-primary)',
          'accent-soft': 'var(--accent-secondary)',
          text: 'var(--text-primary)',
          muted: 'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'froyo-sm': '0 2px 10px -2px var(--shadow-tint, rgba(255, 133, 161, 0.08))',
        'froyo-md': '0 8px 28px -6px var(--shadow-tint, rgba(255, 133, 161, 0.14))',
        'froyo-lg': '0 18px 42px -10px var(--shadow-tint, rgba(255, 133, 161, 0.22))',
      },
    },
  },
  plugins: [],
};
