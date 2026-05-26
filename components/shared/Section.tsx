import { tokens } from '@/lib/tokens';

type SectionProps = {
  label: string;
  right?: string;
  dense?: boolean;
  children: React.ReactNode;
};

export function Section({ label, right, dense = false, children }: SectionProps) {
  return (
    <div style={{ marginBottom: dense ? 32 : 48 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: `1px solid ${tokens.line}`,
        }}
      >
        <span className="label" style={{ color: tokens.text }}>
          {label}
        </span>
        {right && (
          <span
            className="mono"
            style={{ fontSize: 10, color: tokens.faint, letterSpacing: '0.06em' }}
          >
            {right.toUpperCase()}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
