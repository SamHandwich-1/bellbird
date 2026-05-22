import { CyclesScreen } from '@/components/cycles/CyclesScreen';
import {
  getIndicatorSnapshots,
  getMergedCycleReadings,
  getBookDistribution,
  getLastRefreshTime,
} from '@/lib/supabase/cycles-queries';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [readings, snapshots, distribution, lastRefreshed] = await Promise.all([
    getMergedCycleReadings(),
    getIndicatorSnapshots(),
    getBookDistribution(),
    getLastRefreshTime(),
  ]);

  return (
    <CyclesScreen
      readings={readings}
      snapshots={snapshots}
      distribution={distribution}
      lastRefreshed={lastRefreshed}
    />
  );
}
