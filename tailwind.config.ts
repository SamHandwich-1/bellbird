import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // v2 palette
        bg:        '#16140f',
        panel:     '#1c1914',
        panelLift: '#221e17',
        line:      '#2b2820',
        hairline:  '#3a3528',
        text:    '#ece4d3',
        body:    '#cdc5b3',
        muted:   '#857e6d',
        faint:   '#5c5648',
        whisper: '#46413a',
        chime:   '#d9803f',
        terracotta: '#c25234',
        amber:      '#cf9a47',
        sage:       '#7a9e6a',
        steel:      '#7fa8c9',
        slate:      '#9a8a82',

        // @deprecated v1 aliases — remove at end of Turn C
        paper:   '#16140f',
        mist:    '#1c1914',
        surface: '#221e17',
        ink:     '#ece4d3',
        ash:     '#cdc5b3',
        fade:    '#5c5648',
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
