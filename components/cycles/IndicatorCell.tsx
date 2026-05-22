import { tokens } from '@/lib/tokens';
import { Sparkline } from './Sparkline';
import type { IndicatorSnapshot } from '@/lib/supabase/cycles-queries';
import { getSeries } from '@/lib/fred/series';

type Props = { snapshot: IndicatorSnapshot };

function formatValue(value: number | null, seriesId: string): string {
  if (value === null) return '—';
  // Reasonable precision rules per series shape.
  if (seriesId === 'BAMLH0A0HYM2' || seriesId === 'T10Y2Y' || seriesId === 'DGS30' || seriesId === 'FEDFUNDS') {
    return value.toFixed(2);
  }
  if (seriesId === 'UNRATE' || seriesId === 'NAPM' || seriesId === 'TCU' || seriesId === 'CAPE' || seriesId === 'VIXCLS' || seriesId === 'A191RL1Q225SBEA') {
    return value.toFixed(1);
  }
  if (seriesId === 'CPILFESL' || seriesId === 'PAYEMS' || seriesId === 'WALCL' || seriesId === 'DTWEXBGS') {
    return value.toLocaleString('en-AU', { maximumFractionDigits: 1 });
  }
  return value.toLocaleString('en-AU', { maximumFractionDigits: 2 });
}

function zScoreTint(z: number | null): string {
  if (z === null) return tokens.whisper;
  if (z > 1.5) return tokens.terracotta;
  if (z > 0.5) return tokens.amber;
  if (z < -1.5) return tokens.steel;
  if (z < -0.5) return tokens.chime;
  return tokens.ash;
}

export function IndicatorCell({ snapshot }: Props) {
  const def = getSeries(snapshot.series_id);
  const tooltip = def?.tooltip;
  const z = snapshot.z_score_30y;
  const zSign = z !== null && z >= 0 ? '+' : '';

  return (
    <div
      className="p-4 lift-on-hover"
      style={{ background: tokens.mist }}
      title={tooltip}
    >
      <div
        className="font-sans text-[10px] tracking-[0.16em] uppercase mb-2"
        style={{ color: tokens.whisper }}
      >
        {snapshot.display_name}
      </div>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div
          className="font-mono nums text-[20px]"
          style={{ color: tokens.ink, fontWeight: 450 }}
        >
          {formatValue(snapshot.latest_value, snapshot.series_id)}
        </div>
        <div
          className="font-mono nums text-[11px]"
          style={{ color: zScoreTint(z) }}
        >
          {z === null ? 'z —' : `z ${zSign}${z.toFixed(2)}`}
        </div>
      </div>
      <Sparkline data={snapshot.history} width={220} height={28} stroke={tokens.ink} />
      {tooltip && (
        <div
          className="font-sans text-[10px] mt-2 leading-[1.4]"
          style={{ color: tokens.fade }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
