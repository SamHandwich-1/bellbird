import { tokens } from '@/lib/tokens';
import type { CycleStatus, MergedCycleReading } from '@/lib/types';
import { Sparkline } from './Sparkline';
import type { IndicatorSnapshot } from '@/lib/supabase/cycles-queries';

type Props = {
  name: string;
  reading: MergedCycleReading;
  // Series whose history drives the sparkline below the reading.
  driver: IndicatorSnapshot | null;
};

function statusColor(status: CycleStatus): string {
  if (status === 'alert') return tokens.terracotta;
  if (status === 'caution') return tokens.amber;
  return tokens.sage;
}

export function CycleGauge({ name, reading, driver }: Props) {
  const color = statusColor(reading.status);
  const overriddenColor = reading.is_manual && reading.rules_status !== reading.status;

  return (
    <div className="p-6 lift-on-hover" style={{ background: tokens.mist }}>
      <div className="flex items-center justify-between mb-4">
        <div
          className="font-sans text-[10px] tracking-[0.22em] uppercase"
          style={{ color: tokens.whisper }}
        >
          {name}
        </div>
        <div className="relative" style={{ width: 10, height: 10 }}>
          <div
            className="absolute inset-0"
            style={{ borderRadius: '50%', background: color, opacity: 0.3, transform: 'scale(1.6)' }}
          />
          <div
            style={{ width: 10, height: 10, borderRadius: '50%', background: color, position: 'relative' }}
          />
        </div>
      </div>
      <div
        className="font-serif text-[24px] tracking-tight mb-2"
        style={{ fontWeight: 380, color: tokens.ink }}
      >
        {reading.reading}
      </div>
      {reading.is_manual && (
        <div
          className="font-sans text-[10px] tracking-[0.16em] uppercase mb-2"
          style={{ color: tokens.whisper }}
        >
          manual reading{overriddenColor ? ' · status overridden' : ''}
        </div>
      )}
      {reading.detail && (
        <p
          className="font-sans text-[12px] leading-[1.6] mb-3"
          style={{ color: tokens.ash }}
        >
          {reading.detail}
        </p>
      )}
      {driver && driver.history.length > 1 && (
        <Sparkline data={driver.history} width={240} height={30} stroke={color} />
      )}
      {reading.is_manual && reading.rules_reading && (
        <div
          className="font-sans text-[10px] mt-3 italic"
          style={{ color: tokens.fade }}
        >
          Rules baseline: {reading.rules_status} / {reading.rules_reading}
        </div>
      )}
    </div>
  );
}
