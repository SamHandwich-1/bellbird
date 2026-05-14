import { StubScreen } from '@/components/shared/StubScreen';

export default function Page() {
  return (
    <StubScreen
      mode="Portfolio"
      title="Active positions"
      turn={4}
      description="Manual trade entry, position aggregation, per-thesis P&L attribution, and CSV export. Lands in Turn 4. Live prices via Polygon land later in v1.2."
    />
  );
}
