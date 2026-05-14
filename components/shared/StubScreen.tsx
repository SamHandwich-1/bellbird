import { tokens } from '@/lib/tokens';

export function StubScreen({
  mode,
  title,
  turn,
  description,
}: {
  mode: string;
  title: string;
  turn: number;
  description: string;
}) {
  return (
    <div className="pt-12">
      <div className="mb-12">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-2"
          style={{ color: tokens.whisper }}
        >
          {mode}
        </div>
        <h1
          className="font-serif text-[44px] tracking-tight"
          style={{ fontWeight: 340 }}
        >
          {title}
        </h1>
        <div
          className="mt-3 font-sans text-[10px] tracking-[0.22em] uppercase"
          style={{ color: tokens.chime }}
        >
          Coming in Turn {turn}
        </div>
      </div>

      <div className="hairline mb-10" />

      <p
        className="font-serif text-[17px] leading-[1.55] max-w-[62ch]"
        style={{ fontWeight: 340, color: tokens.ash }}
      >
        {description}
      </p>
    </div>
  );
}
