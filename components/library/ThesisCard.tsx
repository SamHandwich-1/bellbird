import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cycleStageColor, formatStage, tokens } from '@/lib/tokens';
import type { Thesis, Position } from '@/lib/types';
import { ConvictionBar } from './ConvictionBar';

type ThesisCardProps = {
  thesis: Thesis;
  topPositions: Position[];
};

export function ThesisCard({ thesis, topPositions }: ThesisCardProps) {
  const tickers = topPositions
    .filter((p) => p.side === 'long')
    .slice(0, 3)
    .map((p) => p.ticker);

  return (
    <article className="lift-on-hover">
      <Link href={`/library/${thesis.id}`} className="block">
        <div className="flex items-baseline gap-5 mb-3 flex-wrap">
          <h2
            className="font-serif text-[28px] sm:text-[34px] leading-[1.05] tracking-tight"
            style={{ fontWeight: 380 }}
          >
            {thesis.name}
          </h2>
          <ConvictionBar value={thesis.conviction} />
          {thesis.in_portfolio && (
            <span
              className="font-sans text-[9px] tracking-[0.22em] uppercase px-2 py-1"
              style={{ background: tokens.mist, color: tokens.chime }}
            >
              In portfolio
            </span>
          )}
        </div>
        <div
          className="font-sans text-[11px] tracking-[0.06em] flex flex-wrap items-center gap-x-3 gap-y-1"
          style={{ color: tokens.ash }}
        >
          {thesis.sector && <span>{thesis.sector}</span>}
          {thesis.sector && <span style={{ color: tokens.fade }}>·</span>}
          <span
            className="uppercase tracking-[0.16em] text-[10px]"
            style={{ color: tokens.ink }}
          >
            {thesis.status}
          </span>
          {thesis.cycle_stage && (
            <>
              <span style={{ color: tokens.fade }}>·</span>
              <span
                className="uppercase tracking-[0.16em] text-[10px]"
                style={{ color: cycleStageColor(thesis.cycle_stage) }}
              >
                {formatStage(thesis.cycle_stage)}
              </span>
            </>
          )}
          {tickers.length > 0 && (
            <>
              <span style={{ color: tokens.fade }}>·</span>
              <span className="font-mono text-[10px]">{tickers.join(' · ')}</span>
            </>
          )}
        </div>
        {thesis.summary && (
          <p
            className="font-serif text-[17px] leading-[1.55] mt-4"
            style={{ fontWeight: 340, color: tokens.ash, maxWidth: '62ch' }}
          >
            {thesis.summary}
          </p>
        )}
        <div className="mt-4 inline-flex items-center gap-1.5 font-sans text-[10px] tracking-[0.16em] uppercase text-ink btn-quiet">
          Open <ChevronRight size={11} strokeWidth={1.5} />
        </div>
      </Link>
    </article>
  );
}
