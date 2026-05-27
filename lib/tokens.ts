// Bellbird v2 design tokens.
//
// Palette and FONT_STYLES are lifted from references/bellbird-mockup-v2-stack.jsx.
// The "@deprecated v1 aliases" block at the bottom keeps Turn-1..5 component
// trees compiling while they sit unrendered behind StubScreens during Turn A.
// Cleanup obligations:
//   - End of Turn B: delete library/develop/portfolio legacy trees. ✓ Done.
//   - End of Turn C: delete cycles legacy tree AND remove the v1 aliases below.

export const tokens = {
  // ---- v2 palette --------------------------------------------------------

  // Surfaces
  bg:        '#16140f',
  panel:     '#1c1914',
  panelLift: '#221e17',
  line:      '#2b2820',
  hairline:  '#3a3528',

  // Text
  text:    '#ece4d3',
  body:    '#cdc5b3',
  muted:   '#857e6d',
  faint:   '#5c5648',
  whisper: '#46413a',

  // The bell note
  chime: '#d9803f',

  // Cycle / conviction palette
  terracotta: '#c25234',
  amber:      '#cf9a47',
  sage:       '#7a9e6a',
  steel:      '#7fa8c9',
  slate:      '#9a8a82',

  // Trigger-type colours (TESTING_LOG item 7 schema)
  confirming:    '#7a9e6a', // sage
  disconfirming: '#cf9a47', // amber
  kill:          '#c25234', // terracotta
  action:        '#d9803f', // chime

  // ---- @deprecated v1 aliases — remove at end of Turn C ------------------
  // Mapped to nearest v2 equivalents. Don't reference these in new code.
  paper:   '#16140f', // → bg
  mist:    '#1c1914', // → panel
  surface: '#221e17', // → panelLift
  ink:     '#ece4d3', // → text
  ash:     '#cdc5b3', // → body
  fade:    '#5c5648', // → faint
} as const;

export type Token = keyof typeof tokens;

export type CycleStage =
  | 'secular'
  | 'long-cycle'
  | 'mid-cycle'
  | 'credit-cycle'
  | 'narrative-cycle';

export function cycleStageColor(stage: CycleStage | null | undefined): string {
  switch (stage) {
    case 'secular':
      return tokens.sage;
    case 'long-cycle':
      return tokens.steel;
    case 'mid-cycle':
      return tokens.amber;
    case 'credit-cycle':
      return tokens.terracotta;
    case 'narrative-cycle':
      return tokens.slate;
    default:
      return tokens.muted;
  }
}

export function convictionColor(value: number): string {
  if (value < 40) return tokens.terracotta;
  if (value < 70) return tokens.amber;
  return tokens.sage;
}

export function formatStage(stage: string | null | undefined): string {
  return stage ? stage.toUpperCase().replace(/-/g, ' ') : '';
}

export type TriggerType = 'confirming' | 'disconfirming' | 'kill' | 'action';

export function triggerTypeColor(type: TriggerType): string {
  return tokens[type];
}
