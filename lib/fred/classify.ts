// Rules-based cycle classifier — credit / market / Juglar.
//
// Thresholds were signed off in the Turn 5 plan; expect to revisit after the
// dashboard has been live a week and we've seen real readings. All numeric
// gates live in this file so tuning is a one-file edit.
//
// Inputs are explicit primitive shapes (z-scores + a couple of derived flags)
// rather than raw Datum[] series. The refresh route builds these shapes from
// the underlying observations; the validation script feeds synthetic numbers
// directly. Keeps the rules testable without FRED in the loop.

import type { CycleStatus } from '@/lib/types';

export type CreditInput = {
  hy_z: number;
  hy_delta_3m_bps: number | null;          // null when insufficient history
  curve_inverted_last_90d: boolean;
  curve_recently_uninverted: boolean;      // true if T10Y2Y crossed from <0 to ≥0 in last 180d
};

export type MarketInput = {
  cape_z: number;
  buffett_z: number;
  vix_z: number;
};

export type JuglarInput = {
  tcu_z: number;
  ism_z: number;
  ism_value: number;                       // latest ISM reading (e.g. 48.5)
  tcu_value: number;                       // latest TCU reading (e.g. 78.2)
};

export type ClassifierResult = {
  status: CycleStatus;
  reading: string;                         // "Turning", "Stressed", "Frothy", "Expanding", ...
  detail: string;                          // auto-generated single-sentence summary
  contributing_series: Record<string, unknown>;
};

// ─── Credit ────────────────────────────────────────────────────────────────

export function classifyCredit(input: CreditInput): ClassifierResult {
  const { hy_z, hy_delta_3m_bps, curve_inverted_last_90d, curve_recently_uninverted } = input;
  const widening = hy_delta_3m_bps !== null && hy_delta_3m_bps > 50;

  let status: CycleStatus;
  if (hy_z > 1.5 || (hy_z > 1.0 && curve_inverted_last_90d)) {
    status = 'alert';
  } else if (hy_z > 0.5 || curve_recently_uninverted) {
    status = 'caution';
  } else {
    status = 'healthy';
  }

  const reading =
    status === 'alert' ? (widening ? 'Turning' : 'Stressed')
    : status === 'caution' ? (widening ? 'Diverging' : 'Late expansion')
    : (widening ? 'Pressuring' : 'Tight');

  const inversionNote =
    curve_inverted_last_90d ? 'curve inverted'
    : curve_recently_uninverted ? 'curve recently un-inverted'
    : 'curve positive';
  const deltaNote = hy_delta_3m_bps === null
    ? ''
    : `, HY ${hy_delta_3m_bps >= 0 ? '+' : ''}${hy_delta_3m_bps.toFixed(0)}bps over 3m`;
  const detail = `HY z ${formatZ(hy_z)}; ${inversionNote}${deltaNote}.`;

  return {
    status,
    reading,
    detail,
    contributing_series: {
      hy_z,
      hy_delta_3m_bps,
      curve_inverted_last_90d,
      curve_recently_uninverted,
    },
  };
}

// ─── Market ────────────────────────────────────────────────────────────────

export function classifyMarket(input: MarketInput): ClassifierResult {
  const { cape_z, buffett_z, vix_z } = input;
  const composite = 0.4 * cape_z + 0.4 * buffett_z + 0.2 * vix_z;

  let status: CycleStatus;
  if (composite > 1.5 || cape_z > 2.0) {
    status = 'alert';
  } else if (composite > 0.5 || cape_z > 1.0) {
    status = 'caution';
  } else {
    status = 'healthy';
  }

  const reading =
    status === 'alert' && vix_z > 1.0 ? 'Stressed'
    : status === 'alert' && vix_z < 0 ? 'Frothy'
    : status === 'alert' ? 'Extended'
    : status === 'caution' && cape_z > 1.0 ? 'Late expansion'
    : status === 'caution' ? 'Mid expansion'
    : 'Healthy';

  const detail =
    `CAPE z ${formatZ(cape_z)}, Buffett z ${formatZ(buffett_z)}, VIX z ${formatZ(vix_z)}. Composite ${formatZ(composite)}.`;

  return {
    status,
    reading,
    detail,
    contributing_series: { cape_z, buffett_z, vix_z, composite },
  };
}

// ─── Juglar ────────────────────────────────────────────────────────────────

export function classifyJuglar(input: JuglarInput): ClassifierResult {
  const { tcu_z, ism_z, ism_value, tcu_value } = input;
  const juglar_score = 0.5 * tcu_z + 0.5 * ism_z;

  let status: CycleStatus;
  if (juglar_score > 1.5 || ism_value < 45) {
    status = 'alert';
  } else if (Math.abs(juglar_score) > 0.5 || ism_value < 50 || tcu_value < 75) {
    status = 'caution';
  } else {
    status = 'healthy';
  }

  // Ism<50 OR very-negative score short-circuits to Contracting before any
  // other label fires. Otherwise check from highest to lowest score band.
  const reading =
    ism_value < 50 || juglar_score < -1.0 ? 'Contracting'
    : juglar_score > 1.0 ? 'Peaking'
    : juglar_score > 0.5 ? 'Stretched'
    : juglar_score >= -0.5 ? 'Expanding'
    : 'Rolling';

  const detail =
    `TCU ${tcu_value.toFixed(1)} (z ${formatZ(tcu_z)}), ISM ${ism_value.toFixed(1)} (z ${formatZ(ism_z)}). Score ${formatZ(juglar_score)}.`;

  return {
    status,
    reading,
    detail,
    contributing_series: { tcu_z, ism_z, ism_value, tcu_value, juglar_score },
  };
}

// ─── helpers ───────────────────────────────────────────────────────────────

function formatZ(z: number): string {
  const sign = z >= 0 ? '+' : '';
  return `${sign}${z.toFixed(2)}`;
}
