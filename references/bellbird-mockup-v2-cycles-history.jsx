import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ReferenceLine, ResponsiveContainer,
} from 'recharts';

// ============================================================================
// BELLBIRD v2 PREVIEW — Cycles · History sub-page (rev 3)
//
// Changes since rev 2 (25 May 2026 feedback):
//   - Recession bands now actually render. Bug was recharts XAxis defaulting
//     to categorical mode, which silently drops ReferenceArea x1/x2 values
//     that aren't exact category matches (our fractional NBER dates didn't
//     match). Switched both XAxes to type="number" with explicit ticks.
//     Alpha also bumped — 0.18 fill + 0.55 edge.
//   - S&P 500 panel now has a view toggle: "Drawdown from peak" (default)
//     and "Price + 200-day MA". Drawdown view makes severity and velocity
//     of every historical drawdown legible — depth on y, slope = speed.
//     Year-end closes mask intra-year crashes (1987, 2020 especially), so
//     drawdown values are intra-year troughs.
// ============================================================================

// ---- PALETTE ---------------------------------------------------------------
const C = {
  bg:        '#16140f',
  panel:     '#1c1914',
  panelLift: '#221e17',
  line:      '#2b2820',
  hairline:  '#3a3528',

  text:    '#ece4d3',
  body:    '#cdc5b3',
  muted:   '#857e6d',
  faint:   '#5c5648',
  whisper: '#46413a',

  chime: '#d9803f',

  // Chart series palette
  s_shillerPE: '#d9803f',  // chime — headline market signal
  s_igHy:      '#c25234',  // terracotta — credit alarm
  s_real10Y:   '#7fa8c9',  // steel
  s_aiCapex:   '#b07b4a',  // rust — newer series
  s_nom10Y:    '#cf9a47',  // amber
  s_nom2Y:     '#9c8359',  // warm gold
  s_nom30Y:    '#7a9e6a',  // sage
  s_realWage:  '#9a8a82',  // slate
  s_buffett:   '#a89368',  // burnished — Buffett indicator

  // Recession band fill — light warm cream, FRED-style on dark
  recessionBand: 'rgba(207, 198, 179, 0.18)',
  recessionEdge: 'rgba(207, 198, 179, 0.55)',
};

// ---- SERIES DEFINITIONS ----------------------------------------------------
const SERIES = [
  { key: 'shillerPE_pct', label: 'Shiller P/E',      color: C.s_shillerPE, unit: '×',  rawKey: 'shillerPE' },
  { key: 'igHy_pct',      label: 'IG–HY spread',      color: C.s_igHy,      unit: 'bp', rawKey: 'igHy' },
  { key: 'real10Y_pct',   label: 'Real 10Y',          color: C.s_real10Y,   unit: '%',  rawKey: 'real10Y' },
  { key: 'aiCapex_pct',   label: 'AI capex YoY',      color: C.s_aiCapex,   unit: '%',  rawKey: 'aiCapex' },
  { key: 'buffett_pct',   label: 'Buffett indicator', color: C.s_buffett,   unit: '×',  rawKey: 'buffett' },
  { key: 'nom10Y_pct',    label: '10Y nominal',       color: C.s_nom10Y,    unit: '%',  rawKey: 'nom10Y' },
  { key: 'nom2Y_pct',     label: '2Y nominal',        color: C.s_nom2Y,     unit: '%',  rawKey: 'nom2Y' },
  { key: 'nom30Y_pct',    label: '30Y nominal',       color: C.s_nom30Y,    unit: '%',  rawKey: 'nom30Y' },
  { key: 'realWage_pct',  label: 'Real wage YoY',     color: C.s_realWage,  unit: '%',  rawKey: 'realWage' },
];

const DEFAULT_VISIBLE = ['shillerPE_pct', 'igHy_pct', 'real10Y_pct', 'aiCapex_pct'];

// ---- NBER RECESSION BANDS (year ranges, fractional = month precision) ------
const RECESSIONS = [
  { from: 1973.9, to: 1975.2, label: '1973–75' },
  { from: 1980.0, to: 1980.6, label: '1980' },
  { from: 1981.5, to: 1982.9, label: '1981–82' },
  { from: 1990.5, to: 1991.2, label: '1990–91' },
  { from: 2001.2, to: 2001.9, label: '2001' },
  { from: 2007.9, to: 2009.5, label: '2007–09' },
  { from: 2020.1, to: 2020.4, label: '2020' },
];

// ---- ERA MARKERS -----------------------------------------------------------
const ERA_MARKERS = [
  { year: 1979, label: 'Volcker' },
  { year: 1987, label: 'Black Monday' },
  { year: 1998, label: 'LTCM' },
  { year: 2000, label: 'Dot-com peak' },
  { year: 2008, label: 'Lehman' },
  { year: 2020, label: 'COVID' },
  { year: 2022, label: 'AI capex boom' },
];

// ---- DRAWDOWN HISTORY ------------------------------------------------------
// Worst intra-year drawdown from prior all-time high. Year-end closes mask
// the real depth of sharp drawdowns (1987 crash recovered partly by Dec;
// 2020 COVID closed back at ATH despite a -34% March trough). Production
// will compute these from daily closes.
const DRAWDOWN_BY_YEAR = {
  1970: -5,  1973: -23, 1974: -48, 1975: -24, 1976: -9,  1977: -19, 1978: -19, 1979: -9,
  1981: -10, 1982: -27, 1984: -7,  1987: -33, 1990: -20,
  1998: -19, 2000: -14, 2001: -30, 2002: -49, 2003: -24, 2004: -8,  2005: -7,
  2008: -54, 2009: -57, 2010: -16, 2011: -19, 2015: -12, 2016: -14,
  2018: -20, 2020: -34, 2022: -25,
};

// ---- ANALOG READS ----------------------------------------------------------
const ANALOGS = [
  {
    period: '1968–69',
    signature: 'Juglar peak + market peak + credit tightening + late-decade complacency',
    look: 'Watch Shiller P/E and Buffett indicator elevate while real wages stall and credit spreads start to widen — multiple percentile lines climbing into the early 1970s. The drawdown view shows -48% by 1974, the deepest pre-2008 drawdown.',
    outcome: 'Stagflation onset 1970–75. 50% equity drawdown 1973–74. The Nifty Fifty multiple compressed by a decade of negative real returns.',
  },
  {
    period: '2000',
    signature: 'Market peak (Shiller P/E ~44, Buffett ~1.5×, both at all-time-high percentiles) + tech capex peak + narrative euphoria',
    look: 'Shiller P/E and Buffett both at the top of the chart (99th percentile). IG–HY widening begins 12 months before the equity peak. Drawdown reaches -49% by Oct 2002 — slower bleed than 2008.',
    outcome: 'NASDAQ −78%. Information-technology hardware capex took until 2007 to recover prior peak.',
  },
  {
    period: '2007',
    signature: 'Credit peak + market peak + narrative complacency on housing',
    look: 'IG–HY spread compressed to ~250bp (low percentile) while Shiller P/E elevated (~85th). Credit reverses sharply; equity follows 9 months later. Drawdown view tells the real story — -57% peak-to-trough is the worst on the chart.',
    outcome: 'GFC. S&P −57% peak-to-trough. Credit spreads widened 7× in fifteen months.',
  },
];

const TODAY_READ = `Shiller P/E and Buffett indicator both sitting above the 95th percentile of their full histories — matches late-2000 and late-2021. IG–HY spread compressed but trending wider, echoing the 2006–07 setup more than the 1999–2000 one. Real 10Y in the 80th+ percentile (the discount-rate headwind). AI capex YoY at its own all-time-high percentile, with no prior analog. Drawdown chart sits at zero — no correction in 18 months, the longest unbroken ATH stretch since 2017–18. Where the current setup differs from every analog above: the AI capex line. It has no historical mean to revert to, no precedent to size against. That uniqueness cuts both ways — there is no playbook for what reversion looks like, and no playbook for what sustained elevation does to multiples.`;

// ============================================================================
// MOCK DATA: 1970–2026 annual macro series + S&P 500 + Buffett indicator.
// ============================================================================
const RAW = [
  { year: 1970, shillerPE: 17.0, igHy: 450, real10Y: -0.5, nom10Y: 7.4,  nom2Y: 7.0,  nom30Y: 7.5,  realWage:  0.5, aiCapex: null, buffett: 0.50, sp500:   83, sp500_ma:   95 },
  { year: 1971, shillerPE: 18.0, igHy: 410, real10Y:  0.2, nom10Y: 6.2,  nom2Y: 5.5,  nom30Y: 6.5,  realWage:  1.8, aiCapex: null, buffett: 0.55, sp500:  102, sp500_ma:   92 },
  { year: 1972, shillerPE: 19.0, igHy: 380, real10Y:  1.5, nom10Y: 6.4,  nom2Y: 5.8,  nom30Y: 6.7,  realWage:  2.5, aiCapex: null, buffett: 0.65, sp500:  118, sp500_ma:  101 },
  { year: 1973, shillerPE: 17.0, igHy: 500, real10Y:  0.5, nom10Y: 7.4,  nom2Y: 7.1,  nom30Y: 7.5,  realWage:  0.5, aiCapex: null, buffett: 0.60, sp500:   97, sp500_ma:  106 },
  { year: 1974, shillerPE: 11.5, igHy: 760, real10Y: -2.5, nom10Y: 7.6,  nom2Y: 7.8,  nom30Y: 7.7,  realWage: -2.5, aiCapex: null, buffett: 0.36, sp500:   68, sp500_ma:   94 },
  { year: 1975, shillerPE: 11.0, igHy: 660, real10Y: -1.0, nom10Y: 8.0,  nom2Y: 7.0,  nom30Y: 8.2,  realWage: -1.0, aiCapex: null, buffett: 0.40, sp500:   90, sp500_ma:   85 },
  { year: 1976, shillerPE: 12.5, igHy: 520, real10Y:  0.5, nom10Y: 7.6,  nom2Y: 6.4,  nom30Y: 7.9,  realWage:  1.5, aiCapex: null, buffett: 0.48, sp500:  108, sp500_ma:   89 },
  { year: 1977, shillerPE: 11.0, igHy: 500, real10Y:  0.2, nom10Y: 7.4,  nom2Y: 6.8,  nom30Y: 7.7,  realWage:  1.2, aiCapex: null, buffett: 0.44, sp500:   95, sp500_ma:   98 },
  { year: 1978, shillerPE:  9.5, igHy: 480, real10Y: -0.5, nom10Y: 8.4,  nom2Y: 8.3,  nom30Y: 8.6,  realWage:  0.3, aiCapex: null, buffett: 0.42, sp500:   96, sp500_ma:  100 },
  { year: 1979, shillerPE:  9.0, igHy: 510, real10Y: -1.5, nom10Y: 9.5,  nom2Y: 10.3, nom30Y: 9.7,  realWage: -0.6, aiCapex: null, buffett: 0.40, sp500:  108, sp500_ma:  100 },
  { year: 1980, shillerPE:  8.5, igHy: 620, real10Y: -1.0, nom10Y: 11.5, nom2Y: 12.2, nom30Y: 11.6, realWage: -1.5, aiCapex: null, buffett: 0.43, sp500:  136, sp500_ma:  113 },
  { year: 1981, shillerPE:  8.0, igHy: 720, real10Y:  3.5, nom10Y: 13.9, nom2Y: 14.8, nom30Y: 13.8, realWage: -0.8, aiCapex: null, buffett: 0.37, sp500:  123, sp500_ma:  122 },
  { year: 1982, shillerPE:  7.4, igHy: 800, real10Y:  6.5, nom10Y: 13.0, nom2Y: 12.4, nom30Y: 12.8, realWage:  0.3, aiCapex: null, buffett: 0.36, sp500:  140, sp500_ma:  133 },
  { year: 1983, shillerPE:  9.8, igHy: 600, real10Y:  7.0, nom10Y: 11.1, nom2Y: 10.5, nom30Y: 11.3, realWage:  0.7, aiCapex: null, buffett: 0.44, sp500:  165, sp500_ma:  143 },
  { year: 1984, shillerPE: 10.2, igHy: 530, real10Y:  7.5, nom10Y: 12.5, nom2Y: 11.6, nom30Y: 12.6, realWage:  0.5, aiCapex: null, buffett: 0.43, sp500:  167, sp500_ma:  157 },
  { year: 1985, shillerPE: 11.5, igHy: 470, real10Y:  6.5, nom10Y: 10.6, nom2Y: 9.3,  nom30Y: 10.8, realWage:  0.6, aiCapex: null, buffett: 0.50, sp500:  211, sp500_ma:  181 },
  { year: 1986, shillerPE: 14.5, igHy: 430, real10Y:  5.0, nom10Y: 7.7,  nom2Y: 6.9,  nom30Y: 7.9,  realWage:  1.4, aiCapex: null, buffett: 0.55, sp500:  242, sp500_ma:  207 },
  { year: 1987, shillerPE: 15.8, igHy: 440, real10Y:  4.5, nom10Y: 8.4,  nom2Y: 7.5,  nom30Y: 8.6,  realWage:  0.5, aiCapex: null, buffett: 0.55, sp500:  247, sp500_ma:  233 },
  { year: 1988, shillerPE: 13.5, igHy: 410, real10Y:  4.0, nom10Y: 8.9,  nom2Y: 8.2,  nom30Y: 9.0,  realWage:  1.0, aiCapex: null, buffett: 0.50, sp500:  278, sp500_ma:  256 },
  { year: 1989, shillerPE: 15.0, igHy: 420, real10Y:  3.5, nom10Y: 8.5,  nom2Y: 8.4,  nom30Y: 8.5,  realWage:  0.4, aiCapex: null, buffett: 0.60, sp500:  353, sp500_ma:  293 },
  { year: 1990, shillerPE: 14.5, igHy: 540, real10Y:  3.5, nom10Y: 8.5,  nom2Y: 7.9,  nom30Y: 8.6,  realWage: -0.4, aiCapex: null, buffett: 0.55, sp500:  330, sp500_ma:  320 },
  { year: 1991, shillerPE: 17.0, igHy: 600, real10Y:  3.5, nom10Y: 7.9,  nom2Y: 6.0,  nom30Y: 8.1,  realWage:  0.0, aiCapex: null, buffett: 0.70, sp500:  417, sp500_ma:  340 },
  { year: 1992, shillerPE: 19.5, igHy: 430, real10Y:  4.0, nom10Y: 7.0,  nom2Y: 4.8,  nom30Y: 7.4,  realWage:  0.8, aiCapex: null, buffett: 0.70, sp500:  436, sp500_ma:  386 },
  { year: 1993, shillerPE: 21.0, igHy: 380, real10Y:  3.5, nom10Y: 5.9,  nom2Y: 4.0,  nom30Y: 6.5,  realWage:  0.7, aiCapex: null, buffett: 0.72, sp500:  466, sp500_ma:  415 },
  { year: 1994, shillerPE: 20.5, igHy: 360, real10Y:  4.5, nom10Y: 7.1,  nom2Y: 6.5,  nom30Y: 7.4,  realWage:  0.3, aiCapex: null, buffett: 0.70, sp500:  459, sp500_ma:  443 },
  { year: 1995, shillerPE: 22.0, igHy: 340, real10Y:  3.5, nom10Y: 6.6,  nom2Y: 5.7,  nom30Y: 6.9,  realWage:  0.5, aiCapex: null, buffett: 0.90, sp500:  616, sp500_ma:  481 },
  { year: 1996, shillerPE: 25.0, igHy: 340, real10Y:  3.5, nom10Y: 6.4,  nom2Y: 5.8,  nom30Y: 6.7,  realWage:  1.0, aiCapex: null, buffett: 1.05, sp500:  741, sp500_ma:  554 },
  { year: 1997, shillerPE: 30.0, igHy: 330, real10Y:  3.8, nom10Y: 6.5,  nom2Y: 5.8,  nom30Y: 6.6,  realWage:  1.5, aiCapex: null, buffett: 1.25, sp500:  970, sp500_ma:  664 },
  { year: 1998, shillerPE: 36.0, igHy: 510, real10Y:  3.5, nom10Y: 5.3,  nom2Y: 4.6,  nom30Y: 5.4,  realWage:  2.6, aiCapex: null, buffett: 1.40, sp500: 1229, sp500_ma:  825 },
  { year: 1999, shillerPE: 41.0, igHy: 470, real10Y:  4.0, nom10Y: 6.4,  nom2Y: 6.2,  nom30Y: 6.5,  realWage:  1.4, aiCapex: null, buffett: 1.55, sp500: 1469, sp500_ma: 1024 },
  { year: 2000, shillerPE: 43.8, igHy: 580, real10Y:  4.0, nom10Y: 5.1,  nom2Y: 5.1,  nom30Y: 5.4,  realWage:  1.5, aiCapex: null, buffett: 1.45, sp500: 1320, sp500_ma: 1239 },
  { year: 2001, shillerPE: 32.0, igHy: 730, real10Y:  2.5, nom10Y: 5.1,  nom2Y: 3.0,  nom30Y: 5.4,  realWage:  1.5, aiCapex: null, buffett: 1.10, sp500: 1148, sp500_ma: 1312 },
  { year: 2002, shillerPE: 23.5, igHy: 900, real10Y:  2.5, nom10Y: 3.8,  nom2Y: 1.6,  nom30Y: 4.8,  realWage:  1.7, aiCapex: null, buffett: 0.80, sp500:  879, sp500_ma: 1116 },
  { year: 2003, shillerPE: 22.8, igHy: 600, real10Y:  2.0, nom10Y: 4.3,  nom2Y: 2.4,  nom30Y: 5.1,  realWage:  0.4, aiCapex: null, buffett: 0.95, sp500: 1111, sp500_ma:  994 },
  { year: 2004, shillerPE: 26.5, igHy: 380, real10Y:  1.8, nom10Y: 4.2,  nom2Y: 3.1,  nom30Y: 5.0,  realWage: -0.1, aiCapex: null, buffett: 1.00, sp500: 1213, sp500_ma: 1067 },
  { year: 2005, shillerPE: 26.5, igHy: 330, real10Y:  1.5, nom10Y: 4.4,  nom2Y: 4.4,  nom30Y: 4.7,  realWage: -0.5, aiCapex: null, buffett: 1.00, sp500: 1248, sp500_ma: 1190 },
  { year: 2006, shillerPE: 26.5, igHy: 280, real10Y:  2.3, nom10Y: 4.7,  nom2Y: 4.8,  nom30Y: 4.8,  realWage:  0.4, aiCapex: null, buffett: 1.10, sp500: 1418, sp500_ma: 1293 },
  { year: 2007, shillerPE: 27.5, igHy: 340, real10Y:  2.0, nom10Y: 4.0,  nom2Y: 3.1,  nom30Y: 4.5,  realWage:  0.6, aiCapex: null, buffett: 1.05, sp500: 1468, sp500_ma: 1378 },
  { year: 2008, shillerPE: 21.0, igHy:1180, real10Y:  1.0, nom10Y: 2.3,  nom2Y: 0.8,  nom30Y: 2.7,  realWage: -1.5, aiCapex: null, buffett: 0.65, sp500:  903, sp500_ma: 1263 },
  { year: 2009, shillerPE: 15.2, igHy:1450, real10Y:  1.2, nom10Y: 3.8,  nom2Y: 1.1,  nom30Y: 4.6,  realWage:  0.7, aiCapex: null, buffett: 0.80, sp500: 1115, sp500_ma: 1095 },
  { year: 2010, shillerPE: 21.5, igHy: 620, real10Y:  1.2, nom10Y: 3.3,  nom2Y: 0.6,  nom30Y: 4.3,  realWage:  0.0, aiCapex: null, buffett: 0.90, sp500: 1258, sp500_ma:  988 },
  { year: 2011, shillerPE: 21.5, igHy: 720, real10Y:  0.0, nom10Y: 2.0,  nom2Y: 0.2,  nom30Y: 3.0,  realWage: -0.5, aiCapex: null, buffett: 0.90, sp500: 1258, sp500_ma: 1124 },
  { year: 2012, shillerPE: 21.8, igHy: 550, real10Y: -0.5, nom10Y: 1.8,  nom2Y: 0.2,  nom30Y: 2.9,  realWage:  0.0, aiCapex: null, buffett: 0.95, sp500: 1426, sp500_ma: 1183 },
  { year: 2013, shillerPE: 25.0, igHy: 430, real10Y:  0.5, nom10Y: 3.0,  nom2Y: 0.4,  nom30Y: 4.0,  realWage:  0.1, aiCapex: null, buffett: 1.15, sp500: 1848, sp500_ma: 1314 },
  { year: 2014, shillerPE: 26.5, igHy: 400, real10Y:  0.5, nom10Y: 2.2,  nom2Y: 0.7,  nom30Y: 3.0,  realWage:  0.4, aiCapex: null, buffett: 1.30, sp500: 2058, sp500_ma: 1574 },
  { year: 2015, shillerPE: 26.5, igHy: 550, real10Y:  0.8, nom10Y: 2.3,  nom2Y: 1.1,  nom30Y: 3.0,  realWage:  2.0, aiCapex: null, buffett: 1.25, sp500: 2043, sp500_ma: 1777 },
  { year: 2016, shillerPE: 28.0, igHy: 700, real10Y:  0.4, nom10Y: 2.5,  nom2Y: 1.2,  nom30Y: 3.1,  realWage:  1.2, aiCapex: null, buffett: 1.20, sp500: 2238, sp500_ma: 1983 },
  { year: 2017, shillerPE: 31.5, igHy: 370, real10Y:  0.5, nom10Y: 2.4,  nom2Y: 1.9,  nom30Y: 2.7,  realWage:  0.4, aiCapex: null, buffett: 1.40, sp500: 2673, sp500_ma: 2113 },
  { year: 2018, shillerPE: 30.0, igHy: 480, real10Y:  1.0, nom10Y: 2.7,  nom2Y: 2.5,  nom30Y: 3.0,  realWage:  0.2, aiCapex: null, buffett: 1.35, sp500: 2506, sp500_ma: 2319 },
  { year: 2019, shillerPE: 30.0, igHy: 380, real10Y:  0.2, nom10Y: 1.9,  nom2Y: 1.6,  nom30Y: 2.4,  realWage:  1.2, aiCapex: null, buffett: 1.45, sp500: 3231, sp500_ma: 2470 },
  { year: 2020, shillerPE: 33.0, igHy: 970, real10Y: -0.9, nom10Y: 0.9,  nom2Y: 0.2,  nom30Y: 1.6,  realWage:  3.2, aiCapex: 18,   buffett: 1.85, sp500: 3756, sp500_ma: 2803 },
  { year: 2021, shillerPE: 38.5, igHy: 320, real10Y: -1.0, nom10Y: 1.5,  nom2Y: 0.7,  nom30Y: 2.0,  realWage: -0.5, aiCapex: 24,   buffett: 2.05, sp500: 4766, sp500_ma: 3164 },
  { year: 2022, shillerPE: 30.5, igHy: 510, real10Y:  0.6, nom10Y: 3.9,  nom2Y: 4.4,  nom30Y: 3.9,  realWage: -1.8, aiCapex: 19,   buffett: 1.55, sp500: 3840, sp500_ma: 3920 },
  { year: 2023, shillerPE: 31.5, igHy: 410, real10Y:  1.8, nom10Y: 4.0,  nom2Y: 4.7,  nom30Y: 4.0,  realWage:  0.6, aiCapex: 28,   buffett: 1.75, sp500: 4769, sp500_ma: 4125 },
  { year: 2024, shillerPE: 37.5, igHy: 310, real10Y:  2.0, nom10Y: 4.3,  nom2Y: 4.4,  nom30Y: 4.4,  realWage:  1.4, aiCapex: 35,   buffett: 1.95, sp500: 5870, sp500_ma: 4485 },
  { year: 2025, shillerPE: 40.5, igHy: 295, real10Y:  2.1, nom10Y: 4.5,  nom2Y: 4.0,  nom30Y: 4.7,  realWage:  1.1, aiCapex: 41,   buffett: 2.10, sp500: 6100, sp500_ma: 5160 },
  { year: 2026, shillerPE: 41.2, igHy: 320, real10Y:  2.1, nom10Y: 4.6,  nom2Y: 3.9,  nom30Y: 4.8,  realWage:  0.9, aiCapex: 38,   buffett: 2.15, sp500: 6300, sp500_ma: 5760 },
];

// ---- PERCENTILE COMPUTATION ------------------------------------------------
function buildPercentileData(raw) {
  const out = raw.map(r => ({ ...r }));
  const seriesKeys = ['shillerPE','igHy','real10Y','nom10Y','nom2Y','nom30Y','realWage','aiCapex','buffett'];
  for (const k of seriesKeys) {
    const vals = raw.map(r => r[k]).filter(v => v !== null && v !== undefined);
    const sorted = [...vals].sort((a, b) => a - b);
    out.forEach(row => {
      const v = row[k];
      if (v === null || v === undefined) { row[`${k}_pct`] = null; return; }
      let count = 0;
      for (const s of sorted) { if (s <= v) count++; else break; }
      row[`${k}_pct`] = Math.round((count / sorted.length) * 100);
    });
  }
  return out;
}

// ---- DATE RANGE PRESETS ----------------------------------------------------
const PRESETS = [
  { label: 'Full · 1970–now', from: 1970, to: 2026 },
  { label: '1990–now',         from: 1990, to: 2026 },
  { label: '2000–now',         from: 2000, to: 2026 },
  { label: '2020–now',         from: 2020, to: 2026 },
];

// ---- TICK GENERATOR --------------------------------------------------------
function generateTicks(from, to) {
  const span = to - from;
  const interval = span > 30 ? 5 : span > 12 ? 5 : span > 4 ? 2 : 1;
  const start = Math.ceil(from / interval) * interval;
  const ticks = [];
  for (let y = start; y <= to; y += interval) ticks.push(y);
  return ticks;
}

// ---- TYPOGRAPHY ------------------------------------------------------------
const FONT_STYLES = `
  .serif { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; }
  .sans  { font-family: 'Manrope', system-ui, sans-serif; }
  .mono  { font-family: 'JetBrains Mono', ui-monospace, monospace; }
  .nums  { font-variant-numeric: tabular-nums; }
  .label { font-family: 'JetBrains Mono', ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.16em; font-size: 9.5px; }
`;

// ============================================================================
// APP CONTAINER
// ============================================================================
export default function BellbirdMockupV2CyclesHistory() {
  const [subTab, setSubTab] = useState('history');
  const [visible, setVisible] = useState(new Set(DEFAULT_VISIBLE));
  const [preset, setPreset] = useState(0);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  const data = useMemo(() => {
    const withPct = buildPercentileData(RAW);
    return withPct.map(r => ({ ...r, sp500_dd: DRAWDOWN_BY_YEAR[r.year] ?? 0 }));
  }, []);
  const range = PRESETS[preset];
  const filtered = useMemo(() => data.filter(r => r.year >= range.from && r.year <= range.to), [data, range]);

  const toggle = (key) => {
    const next = new Set(visible);
    if (next.has(key)) next.delete(key); else next.add(key);
    setVisible(next);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <style>{FONT_STYLES}</style>
      <TopBar />
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px 96px' }}>
        <PageHeader />
        <SubTabs active={subTab} onChange={setSubTab} />
        {subTab === 'now' ? (
          <NowStub />
        ) : (
          <>
            <Orientation />
            <LegendStrip visible={visible} onToggle={toggle} />
            <PresetStrip preset={preset} onChange={setPreset} />
            <ChartPanel data={filtered} visible={visible} />
            <EquityPanel data={filtered} />
            <AnalogsSection />
            <TodaySection />
          </>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// TOP BAR
// ============================================================================
function TopBar() {
  const modes = ['identity','library','develop','watch','portfolio','cycles'];
  return (
    <div style={{ borderBottom: `1px solid ${C.line}`, marginBottom: 56 }}>
      <div style={{
        maxWidth: 920, margin: '0 auto', padding: '20px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24,
      }}>
        <div className="serif" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', color: C.text }}>
          Bellbird
        </div>
        <div style={{ display: 'flex', gap: 22 }}>
          {modes.map(m => {
            const active = m === 'cycles';
            return (
              <div key={m} className="label" style={{
                color: active ? C.chime : C.faint,
                paddingBottom: 2,
                borderBottom: active ? `1px solid ${C.chime}` : '1px solid transparent',
              }}>
                {m}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE HEADER + SUB-TABS
// ============================================================================
function PageHeader() {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="label" style={{ color: C.muted, marginBottom: 6 }}>Macro reading</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.1 }}>
          Cycles
        </h1>
        <div className="mono nums" style={{ fontSize: 10.5, color: C.faint, letterSpacing: '0.08em' }}>
          UPDATED 25 MAY 2026 · LIVE VIA MASSIVE + FRED
        </div>
      </div>
    </div>
  );
}

function SubTabs({ active, onChange }) {
  const tabs = [
    { id: 'now',     label: 'Now',     sub: 'Current cycle gauges + convergence read' },
    { id: 'history', label: 'History', sub: 'Multi-signal percentile chart, 1970–now' },
  ];
  return (
    <div style={{ borderBottom: `1px solid ${C.line}`, marginBottom: 40, display: 'flex', gap: 40 }}>
      {tabs.map(t => (
        <div
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            paddingBottom: 14, cursor: 'pointer',
            borderBottom: active === t.id ? `1.5px solid ${C.chime}` : '1.5px solid transparent',
            marginBottom: -1,
          }}
        >
          <div className="serif" style={{
            fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em',
            color: active === t.id ? C.text : C.muted,
          }}>
            {t.label}
          </div>
          <div className="mono" style={{ fontSize: 10, color: C.faint, letterSpacing: '0.04em', marginTop: 3 }}>
            {t.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

function NowStub() {
  return (
    <div style={{
      border: `1px dashed ${C.line}`, padding: 32, textAlign: 'center',
      color: C.faint, marginTop: 24,
    }}>
      <div className="label" style={{ color: C.faint, marginBottom: 8 }}>Stub</div>
      <p className="serif" style={{ fontStyle: 'italic', fontSize: 14, margin: 0, color: C.muted }}>
        The Now sub-page lives in <span className="mono" style={{ fontSize: 12, color: C.body }}>bellbird-mockup-v2-cycles.jsx</span>.
        Click History above to return to this preview.
      </p>
    </div>
  );
}

// ============================================================================
// ORIENTATION BLOCK
// ============================================================================
function Orientation() {
  return (
    <div style={{ marginBottom: 28 }}>
      <p className="serif" style={{
        fontSize: 14.5, lineHeight: 1.6, color: C.muted, margin: 0, maxWidth: '62ch',
      }}>
        Each signal normalised to its own percentile against history (1970–present).
        A reading of 100 = the highest value that signal has ever recorded; 0 = the lowest.
        Convergence reads as multiple lines simultaneously above 90.
        Shaded bands are NBER-defined recessions. Toggle series to focus a comparison; hover for raw values.
      </p>
    </div>
  );
}

// ============================================================================
// LEGEND STRIP (toggle filters)
// ============================================================================
function LegendStrip({ visible, onToggle }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8,
      paddingBottom: 16, marginBottom: 8, borderBottom: `1px solid ${C.line}`,
    }}>
      {SERIES.map(s => {
        const on = visible.has(s.key);
        return (
          <div
            key={s.key}
            onClick={() => onToggle(s.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 12px',
              border: `1px solid ${on ? s.color + '60' : C.line}`,
              background: on ? s.color + '14' : 'transparent',
              cursor: 'pointer',
              borderRadius: 2,
              transition: 'all 180ms ease',
            }}
          >
            <span style={{
              width: 9, height: 9, borderRadius: 1,
              background: on ? s.color : 'transparent',
              border: `1.5px solid ${s.color}`,
              transition: 'background 180ms ease',
            }} />
            <span className="sans" style={{
              fontSize: 11.5, color: on ? C.text : C.muted,
              letterSpacing: '0.01em',
            }}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// PRESET STRIP (date range)
// ============================================================================
function PresetStrip({ preset, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 22, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
      <span className="label" style={{ color: C.faint, alignSelf: 'center' }}>Range</span>
      {PRESETS.map((p, i) => (
        <div
          key={p.label}
          onClick={() => onChange(i)}
          className="label"
          style={{
            color: i === preset ? C.chime : C.muted,
            borderBottom: i === preset ? `1px solid ${C.chime}` : '1px solid transparent',
            paddingBottom: 4, marginBottom: -15, cursor: 'pointer',
          }}
        >
          {p.label}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// HELPER — recession bands + era markers (shared between panels)
// ============================================================================
function recessionElements(data) {
  if (!data.length) return null;
  const yMin = data[0].year, yMax = data[data.length - 1].year;
  return RECESSIONS
    .filter(r => r.to >= yMin && r.from <= yMax)
    .map((r, i) => (
      <ReferenceArea
        key={`rec-${i}`}
        x1={Math.max(r.from, yMin)}
        x2={Math.min(r.to, yMax)}
        fill={C.recessionBand}
        stroke={C.recessionEdge}
        strokeOpacity={1}
        strokeWidth={1}
      />
    ));
}

function eraElements(data, withLabels = true) {
  if (!data.length) return null;
  const yMin = data[0].year, yMax = data[data.length - 1].year;
  return ERA_MARKERS
    .filter(e => e.year >= yMin && e.year <= yMax)
    .map((e, i) => (
      <ReferenceLine
        key={`era-${i}`}
        x={e.year}
        stroke={C.hairline}
        strokeDasharray="2 4"
        label={withLabels ? {
          value: e.label,
          position: 'insideTopLeft',
          fill: C.muted,
          fontSize: 9.5,
          fontFamily: 'JetBrains Mono',
          letterSpacing: '0.1em',
          dy: 8,
          dx: 6,
        } : undefined}
      />
    ));
}

// ============================================================================
// CHART PANEL (main — percentile signals)
// ============================================================================
function ChartPanel({ data, visible }) {
  const visibleSeries = SERIES.filter(s => visible.has(s.key));

  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.line}`,
      padding: '24px 16px 18px', marginBottom: 12,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '0 8px 16px', borderBottom: `1px solid ${C.line}`, marginBottom: 8,
      }}>
        <div className="serif" style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
          Macro signals · percentile
        </div>
        <div className="label" style={{ color: C.faint }}>
          {visibleSeries.length} of {SERIES.length} visible
        </div>
      </div>

      <div style={{ height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }} syncId="cycles-history">
            <CartesianGrid stroke={C.line} strokeDasharray="0" vertical={false} />
            {recessionElements(data)}
            {eraElements(data, true)}

            <XAxis
              dataKey="year"
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={generateTicks(data[0]?.year ?? 1970, data[data.length - 1]?.year ?? 2026)}
              allowDataOverflow={false}
              stroke={C.faint}
              tick={{ fill: C.muted, fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={{ stroke: C.line }}
              axisLine={{ stroke: C.line }}
            />
            <YAxis
              domain={[0, 100]}
              stroke={C.faint}
              tick={{ fill: C.muted, fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={{ stroke: C.line }}
              axisLine={{ stroke: C.line }}
              ticks={[0, 25, 50, 75, 100]}
              label={{
                value: 'Percentile vs own history',
                angle: -90,
                position: 'insideLeft',
                style: { fill: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', textTransform: 'uppercase' },
                offset: 14,
              }}
            />

            <Tooltip content={<CustomTooltip visibleSeries={visibleSeries} />} cursor={{ stroke: C.body, strokeWidth: 1, strokeOpacity: 0.4 }} />

            {visibleSeries.map(s => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 4, fill: s.color, stroke: C.bg, strokeWidth: 1.5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}

            <ReferenceLine y={90} stroke={C.chime} strokeDasharray="3 4" strokeOpacity={0.4} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mono" style={{
        fontSize: 9.5, color: C.faint, letterSpacing: '0.08em', marginTop: 14, marginBottom: 0,
      }}>
        SHADED · NBER RECESSION   ·   DASHED LINE · 90TH-PERCENTILE CONVERGENCE ZONE   ·   MARKERS · NOTABLE EPISODES
      </p>
    </div>
  );
}

// ============================================================================
// EQUITY PANEL (secondary — S&P 500: drawdown + price views)
// ============================================================================
function EquityPanel({ data }) {
  const [view, setView] = useState('drawdown');  // 'drawdown' (default) | 'price'
  const current = data[data.length - 1];
  const aboveMA = current ? ((current.sp500 / current.sp500_ma - 1) * 100) : 0;
  const currentDD = current?.sp500_dd ?? 0;

  // Worst drawdown in the visible range (depth + year for the badge)
  const worst = data.reduce((acc, r) => ((r.sp500_dd ?? 0) < (acc?.sp500_dd ?? 1) ? r : acc), null);

  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.line}`,
      padding: '20px 16px 18px', marginBottom: 56,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '0 8px 14px', borderBottom: `1px solid ${C.line}`, marginBottom: 8,
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div className="serif" style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>
            S&amp;P 500
          </div>
          <ViewToggle
            options={[
              { id: 'drawdown', label: 'Drawdown from peak' },
              { id: 'price',    label: 'Price + 200-day MA' },
            ]}
            active={view}
            onChange={setView}
          />
        </div>

        {current && view === 'price' && (
          <div style={{ textAlign: 'right' }}>
            <div className="mono nums" style={{ fontSize: 20, fontWeight: 700, color: C.chime, lineHeight: 1 }}>
              {current.sp500.toLocaleString()}
            </div>
            <div className="mono nums" style={{ fontSize: 10, color: aboveMA > 0 ? C.s_nom30Y : C.s_igHy, marginTop: 4, letterSpacing: '0.04em' }}>
              {aboveMA > 0 ? '+' : ''}{aboveMA.toFixed(1)}% VS 200DMA
            </div>
          </div>
        )}

        {current && view === 'drawdown' && (
          <div style={{ textAlign: 'right' }}>
            <div className="mono nums" style={{ fontSize: 20, fontWeight: 700, color: currentDD < -5 ? C.s_igHy : C.s_nom30Y, lineHeight: 1 }}>
              {currentDD === 0 ? 'AT ATH' : `${currentDD}%`}
            </div>
            {worst && worst.sp500_dd < 0 && (
              <div className="mono nums" style={{ fontSize: 10, color: C.faint, marginTop: 4, letterSpacing: '0.04em' }}>
                WORST IN RANGE · {worst.sp500_dd}% ({worst.year})
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          {view === 'price' ? (
            <LineChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 8 }} syncId="cycles-history">
              <CartesianGrid stroke={C.line} strokeDasharray="0" vertical={false} />
              {recessionElements(data)}
              {eraElements(data, false)}

              <XAxis
                dataKey="year"
                type="number"
                domain={['dataMin', 'dataMax']}
                ticks={generateTicks(data[0]?.year ?? 1970, data[data.length - 1]?.year ?? 2026)}
                allowDataOverflow={false}
                stroke={C.faint}
                tick={{ fill: C.muted, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={{ stroke: C.line }}
                axisLine={{ stroke: C.line }}
              />
              <YAxis
                scale="log"
                domain={['auto', 'auto']}
                stroke={C.faint}
                tick={{ fill: C.muted, fontSize: 10.5, fontFamily: 'JetBrains Mono' }}
                tickLine={{ stroke: C.line }}
                axisLine={{ stroke: C.line }}
                ticks={[100, 250, 500, 1000, 2500, 5000]}
                tickFormatter={v => v.toLocaleString()}
              />

              <Tooltip content={<PriceTooltip />} cursor={{ stroke: C.body, strokeWidth: 1, strokeOpacity: 0.4 }} />

              <Line
                type="monotone"
                dataKey="sp500"
                stroke={C.chime}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: C.chime, stroke: C.bg, strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="sp500_ma"
                stroke={C.muted}
                strokeWidth={1.4}
                strokeDasharray="3 4"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 8 }} syncId="cycles-history">
              <CartesianGrid stroke={C.line} strokeDasharray="0" vertical={false} />
              {recessionElements(data)}
              {eraElements(data, false)}

              <XAxis
                dataKey="year"
                type="number"
                domain={['dataMin', 'dataMax']}
                ticks={generateTicks(data[0]?.year ?? 1970, data[data.length - 1]?.year ?? 2026)}
                allowDataOverflow={false}
                stroke={C.faint}
                tick={{ fill: C.muted, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={{ stroke: C.line }}
                axisLine={{ stroke: C.line }}
              />
              <YAxis
                domain={[-60, 5]}
                stroke={C.faint}
                tick={{ fill: C.muted, fontSize: 10.5, fontFamily: 'JetBrains Mono' }}
                tickLine={{ stroke: C.line }}
                axisLine={{ stroke: C.line }}
                ticks={[0, -10, -20, -30, -40, -50, -60]}
                tickFormatter={v => v === 0 ? 'ATH' : `${v}%`}
              />

              <Tooltip content={<DrawdownTooltip />} cursor={{ stroke: C.body, strokeWidth: 1, strokeOpacity: 0.4 }} />

              <ReferenceLine y={0} stroke={C.body} strokeOpacity={0.45} strokeWidth={1} />
              <ReferenceLine y={-20} stroke={C.s_igHy} strokeDasharray="2 4" strokeOpacity={0.35} label={{
                value: 'CORRECTION',
                position: 'insideTopRight',
                fill: C.faint, fontSize: 9, fontFamily: 'JetBrains Mono', letterSpacing: '0.12em', dy: -2,
              }} />
              <ReferenceLine y={-40} stroke={C.s_igHy} strokeDasharray="2 4" strokeOpacity={0.45} label={{
                value: 'BEAR MARKET',
                position: 'insideTopRight',
                fill: C.faint, fontSize: 9, fontFamily: 'JetBrains Mono', letterSpacing: '0.12em', dy: -2,
              }} />

              <Area
                type="monotone"
                dataKey="sp500_dd"
                stroke={C.s_igHy}
                strokeWidth={1.8}
                fill={C.s_igHy}
                fillOpacity={0.22}
                activeDot={{ r: 4, fill: C.s_igHy, stroke: C.bg, strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <p className="mono" style={{
        fontSize: 9.5, color: C.faint, letterSpacing: '0.08em', marginTop: 12, marginBottom: 0,
      }}>
        {view === 'price'
          ? 'SOLID · S&P 500 YEAR-END   ·   DASHED · 200-DAY MA EQUIVALENT   ·   PRICE BELOW MA HISTORICALLY PRECEDES OR CONFIRMS DRAWDOWNS'
          : 'AREA · INTRA-YEAR PEAK-TO-TROUGH DRAWDOWN   ·   0-LINE · ALL-TIME HIGH   ·   DEPTH = SEVERITY, SLOPE = VELOCITY'}
      </p>
    </div>
  );
}

function ViewToggle({ options, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
      {options.map(o => (
        <div
          key={o.id}
          onClick={() => onChange(o.id)}
          className="label"
          style={{
            color: active === o.id ? C.chime : C.muted,
            borderBottom: active === o.id ? `1px solid ${C.chime}` : '1px solid transparent',
            paddingBottom: 3,
            cursor: 'pointer',
            transition: 'color 150ms ease',
          }}
        >
          {o.label}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// CUSTOM TOOLTIPS
// ============================================================================
function CustomTooltip({ active, payload, label, visibleSeries }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload;

  return (
    <div style={{
      background: C.panelLift, border: `1px solid ${C.line}`,
      padding: '12px 14px', minWidth: 220,
    }}>
      <div className="mono nums" style={{ fontSize: 12, color: C.text, marginBottom: 8, fontWeight: 600 }}>
        {label}
      </div>
      {visibleSeries.map(s => {
        const pct = row?.[s.key];
        const raw = row?.[s.rawKey];
        if (pct === null || pct === undefined) return null;
        return (
          <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, marginBottom: 3 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, background: s.color, borderRadius: 1 }} />
              <span className="sans" style={{ fontSize: 11, color: C.body }}>{s.label}</span>
            </span>
            <span className="mono nums" style={{ fontSize: 11, color: C.text }}>
              <span style={{ color: C.muted }}>{raw !== null && raw !== undefined ? `${raw}${s.unit}` : '—'}</span>
              <span style={{ color: C.faint, margin: '0 6px' }}>·</span>
              <span style={{ color: s.color, fontWeight: 600 }}>p{pct}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PriceTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const pctOfMA = ((row.sp500 / row.sp500_ma - 1) * 100);
  return (
    <div style={{
      background: C.panelLift, border: `1px solid ${C.line}`,
      padding: '12px 14px', minWidth: 200,
    }}>
      <div className="mono nums" style={{ fontSize: 12, color: C.text, marginBottom: 8, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
        <span className="sans" style={{ fontSize: 11, color: C.body }}>S&amp;P 500</span>
        <span className="mono nums" style={{ fontSize: 11, color: C.chime, fontWeight: 600 }}>{row.sp500.toLocaleString()}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
        <span className="sans" style={{ fontSize: 11, color: C.muted }}>200dMA</span>
        <span className="mono nums" style={{ fontSize: 11, color: C.muted }}>{row.sp500_ma.toLocaleString()}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.line}` }}>
        <span className="label" style={{ color: C.faint }}>vs MA</span>
        <span className="mono nums" style={{ fontSize: 11, color: pctOfMA > 0 ? C.s_nom30Y : C.s_igHy, fontWeight: 600 }}>
          {pctOfMA > 0 ? '+' : ''}{pctOfMA.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function DrawdownTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const dd = row.sp500_dd ?? 0;
  const severity = dd === 0 ? null
    : dd <= -40 ? 'Major bear market'
    : dd <= -20 ? 'Bear market'
    : dd <= -10 ? 'Correction'
    : 'Minor pullback';
  return (
    <div style={{
      background: C.panelLift, border: `1px solid ${C.line}`,
      padding: '12px 14px', minWidth: 200,
    }}>
      <div className="mono nums" style={{ fontSize: 12, color: C.text, marginBottom: 8, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
        <span className="sans" style={{ fontSize: 11, color: C.body }}>Drawdown from peak</span>
        <span className="mono nums" style={{ fontSize: 12, color: dd < -5 ? C.s_igHy : C.body, fontWeight: 600 }}>
          {dd === 0 ? 'AT ATH' : `${dd}%`}
        </span>
      </div>
      {severity && (
        <div className="serif" style={{ fontSize: 11.5, fontStyle: 'italic', color: C.muted, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.line}` }}>
          {severity}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ANALOGS SECTION
// ============================================================================
function AnalogsSection() {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4, paddingBottom: 10, borderBottom: `1px solid ${C.line}`,
      }}>
        <div className="label" style={{ color: C.text }}>Historical parallels</div>
        <div className="label" style={{ color: C.faint }}>What to look for in the chart</div>
      </div>
      {ANALOGS.map((a, i) => <AnalogRow key={i} a={a} />)}
    </div>
  );
}

function AnalogRow({ a }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr',
      gap: 32, padding: '24px 0', borderBottom: `1px solid ${C.line}`, alignItems: 'baseline',
    }}>
      <div>
        <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: C.text, letterSpacing: '-0.01em', lineHeight: 1 }}>
          {a.period}
        </div>
        <div className="label" style={{ color: C.muted, marginTop: 8 }}>Convergence</div>
      </div>
      <div>
        <div className="mono" style={{ fontSize: 11, color: C.body, letterSpacing: '0.03em', marginBottom: 10 }}>
          {a.signature}
        </div>
        <div className="serif" style={{ fontSize: 13.5, lineHeight: 1.55, color: C.body, marginBottom: 10, maxWidth: '60ch' }}>
          <span className="label" style={{ color: C.chime, marginRight: 8 }}>Look</span>
          {a.look}
        </div>
        <p className="serif" style={{ fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.55, color: C.muted, margin: 0, maxWidth: '60ch' }}>
          {a.outcome}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// TODAY SECTION
// ============================================================================
function TodaySection() {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4, paddingBottom: 10, borderBottom: `1px solid ${C.line}`,
      }}>
        <div className="label" style={{ color: C.chime }}>Today · 2024–26 setup vs analogs</div>
        <div className="label" style={{ color: C.faint }}>What rhymes, what doesn't</div>
      </div>
      <div style={{ padding: '24px 0' }}>
        <p className="serif" style={{ fontSize: 15.5, lineHeight: 1.65, color: C.body, margin: 0, maxWidth: '62ch' }}>
          {TODAY_READ}
        </p>
      </div>
    </div>
  );
}
