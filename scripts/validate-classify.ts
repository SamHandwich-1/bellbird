// Synthetic-input validation for lib/fred/classify.ts.
//
// Run via:  npx tsx scripts/validate-classify.ts
//
// Per Turn 5 plan sequencing item #4: this gate must pass before the
// classifier is wired into the refresh route. Validates that the rules
// produce expected (status, reading) outputs for known inputs, so we know
// the logic is correct before it ever touches real FRED data.

import {
  classifyCredit,
  classifyMarket,
  classifyJuglar,
  type CreditInput,
  type MarketInput,
  type JuglarInput,
} from '../lib/fred/classify';
import type { CycleStatus } from '../lib/types';

type Expectation = { status: CycleStatus; reading: string };

type CreditCase = { name: string; input: CreditInput; expect: Expectation };
type MarketCase = { name: string; input: MarketInput; expect: Expectation };
type JuglarCase = { name: string; input: JuglarInput; expect: Expectation };

// ─── Credit ────────────────────────────────────────────────────────────────

const creditCases: CreditCase[] = [
  {
    name: 'HY very tight, curve positive → healthy / Tight',
    input: { hy_z: -1.0, hy_delta_3m_bps: -20, curve_inverted_last_90d: false, curve_recently_uninverted: false },
    expect: { status: 'healthy', reading: 'Tight' },
  },
  {
    name: 'HY around long-run mean, curve positive → healthy / Tight',
    input: { hy_z: 0.2, hy_delta_3m_bps: 10, curve_inverted_last_90d: false, curve_recently_uninverted: false },
    expect: { status: 'healthy', reading: 'Tight' },
  },
  {
    name: 'HY mildly elevated → caution / Late expansion',
    input: { hy_z: 0.8, hy_delta_3m_bps: 20, curve_inverted_last_90d: false, curve_recently_uninverted: false },
    expect: { status: 'caution', reading: 'Late expansion' },
  },
  {
    name: 'HY mildly elevated AND widening → caution / Diverging',
    input: { hy_z: 0.8, hy_delta_3m_bps: 80, curve_inverted_last_90d: false, curve_recently_uninverted: false },
    expect: { status: 'caution', reading: 'Diverging' },
  },
  {
    name: 'HY tight but curve recently un-inverted → caution / Tight',
    input: { hy_z: 0.0, hy_delta_3m_bps: 5, curve_inverted_last_90d: false, curve_recently_uninverted: true },
    expect: { status: 'caution', reading: 'Late expansion' },
  },
  {
    name: 'HY z=+1.2 with curve inverted → alert / Stressed',
    input: { hy_z: 1.2, hy_delta_3m_bps: 30, curve_inverted_last_90d: true, curve_recently_uninverted: false },
    expect: { status: 'alert', reading: 'Stressed' },
  },
  {
    name: 'HY z=+1.2 with curve inverted AND widening → alert / Turning',
    input: { hy_z: 1.2, hy_delta_3m_bps: 75, curve_inverted_last_90d: true, curve_recently_uninverted: false },
    expect: { status: 'alert', reading: 'Turning' },
  },
  {
    name: 'HY z=+2.0 standalone (no curve flag) → alert / Stressed',
    input: { hy_z: 2.0, hy_delta_3m_bps: 30, curve_inverted_last_90d: false, curve_recently_uninverted: false },
    expect: { status: 'alert', reading: 'Stressed' },
  },
  {
    name: 'Insufficient HY history (null delta) treated as not-widening',
    input: { hy_z: 0.7, hy_delta_3m_bps: null, curve_inverted_last_90d: false, curve_recently_uninverted: false },
    expect: { status: 'caution', reading: 'Late expansion' },
  },
];

// ─── Market ────────────────────────────────────────────────────────────────

const marketCases: MarketCase[] = [
  {
    name: 'All cheap → healthy',
    input: { cape_z: -0.8, buffett_z: -0.6, vix_z: 0.2 },
    expect: { status: 'healthy', reading: 'Healthy' },
  },
  {
    name: 'Mid-range valuation, calm VIX → healthy',
    input: { cape_z: 0.3, buffett_z: 0.2, vix_z: -0.5 },
    expect: { status: 'healthy', reading: 'Healthy' },
  },
  {
    name: 'Valuation slightly stretched → caution / Mid expansion',
    input: { cape_z: 0.8, buffett_z: 0.6, vix_z: 0.0 },
    expect: { status: 'caution', reading: 'Mid expansion' },
  },
  {
    name: 'CAPE z>+1.0 specifically → caution / Late expansion',
    input: { cape_z: 1.2, buffett_z: 0.5, vix_z: -0.2 },
    expect: { status: 'caution', reading: 'Late expansion' },
  },
  {
    name: 'CAPE z=+2.1 → alert via CAPE-only gate / Extended (VIX mid)',
    input: { cape_z: 2.1, buffett_z: 1.5, vix_z: 0.3 },
    expect: { status: 'alert', reading: 'Extended' },
  },
  {
    name: 'Stretched valuation + high VIX → alert / Stressed',
    input: { cape_z: 1.8, buffett_z: 1.8, vix_z: 1.5 },
    expect: { status: 'alert', reading: 'Stressed' },
  },
  {
    name: 'Stretched valuation + low VIX → alert / Frothy',
    input: { cape_z: 1.9, buffett_z: 2.5, vix_z: -0.5 },
    expect: { status: 'alert', reading: 'Frothy' },
  },
  {
    name: 'Today-ish: CAPE ~41x (z≈+2.0) → alert / Extended',
    input: { cape_z: 2.0, buffett_z: 1.6, vix_z: 0.4 },
    expect: { status: 'alert', reading: 'Extended' },
  },
];

// ─── Juglar ────────────────────────────────────────────────────────────────

const juglarCases: JuglarCase[] = [
  {
    name: 'TCU and IPMAN both around long-run mean → healthy / Expanding',
    input: { tcu_z: 0.1, ipman_z: 0.2, ipman_yoy: 2.0, tcu_value: 78 },
    expect: { status: 'healthy', reading: 'Expanding' },
  },
  {
    name: 'Score=+0.8 with healthy IPMAN YoY → healthy / Stretched (overheating side, score below 1.5)',
    input: { tcu_z: 0.8, ipman_z: 0.8, ipman_yoy: 3.0, tcu_value: 82 },
    expect: { status: 'healthy', reading: 'Stretched' },
  },
  {
    name: 'IPMAN YoY -1% (mild slowing), score mild negative → caution / Rolling',
    input: { tcu_z: -0.6, ipman_z: -0.4, ipman_yoy: -1.0, tcu_value: 74 },
    expect: { status: 'caution', reading: 'Rolling' },
  },
  {
    name: 'IPMAN YoY -3% (deep contraction) → alert / Contracting',
    input: { tcu_z: -0.8, ipman_z: -1.5, ipman_yoy: -3.0, tcu_value: 72 },
    expect: { status: 'alert', reading: 'Contracting' },
  },
  {
    name: 'Score=+1.65 with high IPMAN +4.5% → caution / Peaking (overheating peaks at caution)',
    input: { tcu_z: 1.5, ipman_z: 1.8, ipman_yoy: 4.5, tcu_value: 84 },
    expect: { status: 'caution', reading: 'Peaking' },
  },
  {
    name: 'Score=-0.7 with positive IPMAN +1% → healthy / Rolling (slowing within thresholds)',
    input: { tcu_z: -0.8, ipman_z: -0.6, ipman_yoy: 1.0, tcu_value: 74 },
    expect: { status: 'healthy', reading: 'Rolling' },
  },
  {
    name: 'Score=-1.3 with IPMAN -1% → caution / Contracting (score<-1 short-circuits)',
    input: { tcu_z: -1.3, ipman_z: -1.3, ipman_yoy: -1.0, tcu_value: 72 },
    expect: { status: 'caution', reading: 'Contracting' },
  },
  {
    name: 'IPMAN YoY -2.5% with mid score → alert / Contracting',
    input: { tcu_z: 0.0, ipman_z: -1.0, ipman_yoy: -2.5, tcu_value: 78 },
    expect: { status: 'alert', reading: 'Contracting' },
  },
];

// ─── Runner ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function run<T>(label: string, cases: Array<{ name: string; input: T; expect: Expectation }>, fn: (input: T) => { status: CycleStatus; reading: string }) {
  console.log(`\n── ${label} (${cases.length} cases) ──`);
  for (const c of cases) {
    const result = fn(c.input);
    const ok = result.status === c.expect.status && result.reading === c.expect.reading;
    if (ok) {
      passed++;
      console.log(`  ✓ ${c.name} → ${result.status}/${result.reading}`);
    } else {
      failed++;
      const msg = `  ✗ ${c.name}\n      expected ${c.expect.status}/${c.expect.reading}\n      got      ${result.status}/${result.reading}`;
      console.log(msg);
      failures.push(`[${label}] ${c.name}`);
    }
  }
}

run('Credit', creditCases, classifyCredit);
run('Market', marketCases, classifyMarket);
run('Juglar', juglarCases, classifyJuglar);

console.log(`\n${passed} passed, ${failed} failed (${creditCases.length + marketCases.length + juglarCases.length} total).`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
process.exit(0);
