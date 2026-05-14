import { StubScreen } from '@/components/shared/StubScreen';

export default function Page() {
  return (
    <StubScreen
      mode="Cycles"
      title="The three cycles"
      turn={5}
      description="Credit, market, and Juglar cycle gauges driven by thirty years of FRED data. Twelve macro indicators with z-scores against thirty-year history. Daily refresh via Vercel cron. Lands in Turn 5."
    />
  );
}
