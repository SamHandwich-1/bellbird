import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getThesisById, getPositionsForThesis } from '@/lib/supabase/queries';
import { ConvictionBar } from '@/components/library/ConvictionBar';
import { PositionEditor } from '@/components/library/PositionEditor';
import { DeleteThesisButton } from '@/components/library/DeleteThesisButton';
import { EditThesisTrigger } from '@/components/library/EditThesisTrigger';
import { cycleStageColor, formatStage, tokens } from '@/lib/tokens';

export default async function ThesisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thesis = await getThesisById(id);
  if (!thesis) notFound();
  const positions = await getPositionsForThesis(id);

  return (
    <div className="pt-12">
      <Link
        href="/library"
        className="font-sans text-[10px] tracking-[0.22em] uppercase btn-quiet inline-flex items-center gap-1.5 mb-10"
        style={{ color: tokens.whisper }}
      >
        <ChevronLeft size={11} strokeWidth={1.5} /> Library
      </Link>

      <div className="flex items-baseline gap-5 mb-3 flex-wrap">
        <h1
          className="font-serif text-[44px] sm:text-[52px] leading-[1.05] tracking-tight"
          style={{ fontWeight: 360 }}
        >
          {thesis.name}
        </h1>
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
        className="font-sans text-[11px] tracking-[0.06em] flex flex-wrap items-center gap-x-3 gap-y-1 mb-8"
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
        {thesis.timing && (
          <>
            <span style={{ color: tokens.fade }}>·</span>
            <span>{thesis.timing}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-6 mb-12 flex-wrap">
        <EditThesisTrigger thesis={thesis} />
      </div>

      {thesis.summary && (
        <section className="mb-12">
          <div
            className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4"
            style={{ color: tokens.whisper }}
          >
            Summary
          </div>
          <p
            className="font-serif text-[17px] leading-[1.65] max-w-[62ch]"
            style={{ fontWeight: 340, color: tokens.ink }}
          >
            {thesis.summary}
          </p>
        </section>
      )}

      {thesis.hedge_note && (
        <section className="mb-12">
          <div
            className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4"
            style={{ color: tokens.whisper }}
          >
            Hedge note
          </div>
          <p
            className="font-serif text-[15px] leading-[1.65] italic max-w-[62ch]"
            style={{ fontWeight: 340, color: tokens.ash }}
          >
            {thesis.hedge_note}
          </p>
        </section>
      )}

      <section className="mb-12">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4"
          style={{ color: tokens.whisper }}
        >
          Positions · <span className="font-mono">{positions.length}</span>
        </div>
        <PositionEditor thesisId={thesis.id} positions={positions} />
      </section>

      <div className="hairline mb-8" />

      <DeleteThesisButton id={thesis.id} name={thesis.name} />
    </div>
  );
}
