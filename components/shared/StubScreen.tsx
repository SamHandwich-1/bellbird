import { tokens } from '@/lib/tokens';

type StubScreenProps = {
  mode: string;
  turn: string;
  note?: string;
};

export function StubScreen({ mode, turn, note }: StubScreenProps) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="label" style={{ color: tokens.muted, marginBottom: 6 }}>
          Mode placeholder
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h1
            className="serif"
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: tokens.text,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {mode}
          </h1>
          <span
            className="label"
            style={{ color: tokens.chime, letterSpacing: '0.16em' }}
          >
            Rebuilding in Turn {turn}
          </span>
        </div>
      </div>

      {note && (
        <p
          className="serif"
          style={{
            fontSize: 14,
            fontStyle: 'italic',
            color: tokens.muted,
            lineHeight: 1.6,
            maxWidth: '62ch',
            margin: 0,
          }}
        >
          {note}
        </p>
      )}
    </div>
  );
}
