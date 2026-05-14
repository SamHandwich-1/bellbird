export const tokens = {
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
      return tokens.whisper;
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
