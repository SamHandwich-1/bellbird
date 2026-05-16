import { convictionColor, tokens } from '@/lib/tokens';

export function ConvictionBar({ value }: { value: number }) {
  const color = convictionColor(value);
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        style={{
          display: 'inline-block',
          width: 64,
          height: 2,
          background: tokens.surface,
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: 2,
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: color,
          }}
        />
      </span>
      <span
        className="font-mono"
        style={{ fontSize: 11, color, letterSpacing: '0.02em' }}
      >
        {value}%
      </span>
    </span>
  );
}
