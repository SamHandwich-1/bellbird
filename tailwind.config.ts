import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F2EDE3',
        mist: '#ECE5D5',
        surface: '#E8E0CE',
        hairline: '#C9BFAB',
        ink: '#1a1a1a',
        ash: '#6B6B66',
        whisper: '#9A9485',
        fade: '#C9BFAB',
        terracotta: '#A0432B',
        amber: '#B5853A',
        sage: '#5C7A4D',
        steel: '#2F4A52',
        slate: '#6B5C56',
        chime: '#3D5A6C',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
