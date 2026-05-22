import { tokens } from '@/lib/tokens';

type Props = { lastRefreshed: string | null };

const STALE_HOURS = 18;

export function LastRefreshed({ lastRefreshed }: Props) {
  if (!lastRefreshed) {
    return (
      <div
        className="font-sans text-[10px] tracking-[0.16em] uppercase"
        style={{ color: tokens.amber }}
      >
        No data yet — run /api/macro/backfill
      </div>
    );
  }

  const ts = Date.parse(lastRefreshed);
  const ageHours = (Date.now() - ts) / (60 * 60 * 1000);
  const stale = ageHours > STALE_HOURS;
  const formatted = new Date(ts).toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="font-sans text-[10px] tracking-[0.16em] uppercase"
      style={{ color: stale ? tokens.amber : tokens.fade }}
    >
      {stale ? 'Refresh stale — check cron · ' : 'Last refreshed · '}
      {formatted}
    </div>
  );
}
