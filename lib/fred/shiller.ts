// CAPE / Shiller PE fetcher. CAPE is not a native FRED series.
//
// Chain (per Turn 5 plan, sign-off #1):
//   1. Yale Shiller XLS — http://www.econ.yale.edu/~shiller/data/ie_data.xls
//      Canonical primary source. The "Data" sheet has monthly observations
//      back to 1881. Column for CAPE is labelled "CAPE" or "P/E10" depending
//      on the file vintage; we handle both.
//   2. multpl.com scrape — fallback if Yale fetch fails. HTML table at
//      https://www.multpl.com/shiller-pe/table/by-month.
//   3. Manual upload route (not built unless 1+2 prove unreliable in month 1).

import * as XLSX from 'xlsx';
import type { Datum } from './stats';

const YALE_URL = 'http://www.econ.yale.edu/~shiller/data/ie_data.xls';
const MULTPL_URL = 'https://www.multpl.com/shiller-pe/table/by-month';

export type ShillerFetchResult = {
  source: 'yale' | 'multpl';
  observations: Datum[];
};

export async function fetchCape(opts?: { startDate?: string }): Promise<ShillerFetchResult> {
  let yaleErr = '';
  try {
    const observations = await fetchCapeFromYale(opts);
    return { source: 'yale', observations };
  } catch (err) {
    yaleErr = err instanceof Error ? err.message : String(err);
    console.warn('[shiller] Yale XLS fetch failed, falling back to multpl scrape. Reason:', yaleErr);
  }
  try {
    const observations = await fetchCapeFromMultpl(opts);
    return { source: 'multpl', observations };
  } catch (err) {
    const multplErr = err instanceof Error ? err.message : String(err);
    console.error('[shiller] Both Yale and multpl failed. Yale:', yaleErr, 'Multpl:', multplErr);
    // Bundle both error messages so the backfill summary surfaces the full picture.
    throw new Error(`Shiller chain exhausted. YALE → ${yaleErr} || MULTPL → ${multplErr}`);
  }
}

// ─── Yale Shiller XLS ──────────────────────────────────────────────────────

async function fetchCapeFromYale(opts?: { startDate?: string }): Promise<Datum[]> {
  console.log('[shiller/yale] GET', YALE_URL);
  const res = await fetch(YALE_URL, { cache: 'no-store' });
  const ct = res.headers.get('content-type') ?? '?';
  const cl = res.headers.get('content-length') ?? '?';
  console.log(`[shiller/yale] HTTP ${res.status} ct=${ct} len=${cl}`);
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Yale HTTP ${res.status} ct=${ct} len=${cl} body="${bodyText.slice(0, 300).replace(/\s+/g, ' ')}"`);
  }
  const buffer = await res.arrayBuffer();
  // Sniff first bytes — XLS files start with 'D0 CF 11 E0' (OLE2 signature).
  const head = new Uint8Array(buffer.slice(0, 8));
  const headHex = [...head].map((b) => b.toString(16).padStart(2, '0')).join(' ');
  console.log(`[shiller/yale] body bytes=${buffer.byteLength} head=${headHex}`);
  let workbook;
  try {
    workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  } catch (parseErr) {
    const headAscii = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 200));
    throw new Error(
      `Yale XLS parse failed: ${parseErr instanceof Error ? parseErr.message : parseErr}; ` +
      `ct=${ct} bytes=${buffer.byteLength} headHex=${headHex} headAscii="${headAscii.replace(/\s+/g, ' ').slice(0, 150)}"`,
    );
  }

  // Sheet name in this file is "Data" (with capital D); fall back to first sheet
  const sheetName = workbook.SheetNames.find((n) => n.toLowerCase() === 'data')
    ?? workbook.SheetNames[0];
  if (!sheetName) throw new Error('Yale XLS has no sheets');
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: 1,
    raw: true,
  }) as unknown as unknown[][];

  // Header detection — the Data sheet has multi-row labels split across rows
  // ~4-7. We want the row where the simple "Date" column 0 label appears AND
  // a cell contains "p/e10" (which uniquely identifies the "P/E10 or CAPE"
  // column in that same row). Earlier vintages also had standalone "CAPE"
  // appear in row 6 col 16 as the bottom of the "Excess CAPE Yield" split
  // label — substring matching on "p/e10" avoids that collision.
  let headerRowIdx = -1;
  let dateColIdx = -1;
  let capeColIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map((c) => String(c ?? '').trim().toLowerCase());
    if (cells[0] !== 'date') continue;
    const capeCol = cells.findIndex((c) => c.includes('p/e10'));
    if (capeCol < 0) continue;
    headerRowIdx = i;
    dateColIdx = 0;
    capeColIdx = capeCol;
    break;
  }
  if (headerRowIdx < 0) {
    throw new Error('Yale XLS: could not locate header row with Date + P/E10 columns');
  }

  const startDate = opts?.startDate ?? '1900-01-01';
  const out: Datum[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const rawDate = row[dateColIdx];
    const rawCape = row[capeColIdx];
    if (rawDate === undefined || rawDate === null || rawDate === '') continue;
    const date = parseShillerDate(rawDate);
    if (!date) continue;
    if (date < startDate) continue;
    const value =
      typeof rawCape === 'number' ? rawCape :
      typeof rawCape === 'string' && rawCape.trim() !== '' ? Number(rawCape) :
      null;
    out.push({
      date,
      value: value !== null && Number.isFinite(value) ? value : null,
    });
  }

  if (out.length === 0) throw new Error('Yale XLS parsed but produced zero observations');
  return out;
}

// Shiller's date column is a numeric like 2024.04 (April 2024) or 2024.1
// (October 2024 — note the trailing-zero quirk). Convert to first-of-month
// ISO date.
function parseShillerDate(raw: unknown): string | null {
  if (typeof raw === 'number') {
    const year = Math.floor(raw);
    // Use string formatting to preserve trailing zeros: 2024.10 stays as 10
    const fractStr = raw.toFixed(2).split('.')[1];
    const month = Number(fractStr);
    if (year < 1850 || year > 2100 || month < 1 || month > 12) return null;
    return `${year}-${String(month).padStart(2, '0')}-01`;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    // Could be 'YYYY.MM' string form
    const m = trimmed.match(/^(\d{4})\.(\d{1,2})$/);
    if (m) {
      const year = Number(m[1]);
      const month = m[2].length === 1 ? Number(m[2]) * 10 : Number(m[2]);
      if (year < 1850 || month < 1 || month > 12) return null;
      return `${year}-${String(month).padStart(2, '0')}-01`;
    }
    // ISO date already
    const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return trimmed;
  }
  return null;
}

// ─── multpl.com fallback ───────────────────────────────────────────────────

async function fetchCapeFromMultpl(opts?: { startDate?: string }): Promise<Datum[]> {
  console.log('[shiller/multpl] GET', MULTPL_URL);
  const res = await fetch(MULTPL_URL, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Bellbird/1.0 (cycles dashboard)' },
  });
  const ct = res.headers.get('content-type') ?? '?';
  const server = res.headers.get('server') ?? '?';
  console.log(`[shiller/multpl] HTTP ${res.status} ct=${ct} server=${server}`);
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`multpl HTTP ${res.status} ct=${ct} server=${server} body="${bodyText.slice(0, 300).replace(/\s+/g, ' ')}"`);
  }
  const html = await res.text();
  console.log(`[shiller/multpl] body length=${html.length}`);

  // Table rows look like: <td>Jan 1, 2024</td><td>34.12</td>
  // We pull all <tr>...</tr> blocks containing a recognisable date + numeric.
  const rowRe = /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([\d.,\s]+)<\/td>/gi;
  const startDate = opts?.startDate ?? '1900-01-01';
  const out: Datum[] = [];
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(html)) !== null) {
    const dateText = match[1].trim();
    const valueText = match[2].trim().replace(/,/g, '');
    const date = parseMultplDate(dateText);
    if (!date) continue;
    if (date < startDate) continue;
    const value = Number(valueText);
    if (!Number.isFinite(value)) continue;
    out.push({ date, value });
  }

  if (out.length === 0) {
    const sample = html.slice(0, 800).replace(/\s+/g, ' ');
    throw new Error(
      `multpl regex produced zero rows. ct=${ct} server=${server} len=${html.length} sample="${sample}"`,
    );
  }
  // multpl returns newest-first; we want oldest-first to match Yale + downstream
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

const MONTH_NAMES: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseMultplDate(raw: string): string | null {
  // "Jan 1, 2024" or "January 1, 2024"
  const m = raw.match(/^([A-Za-z]+)\s+\d+,\s*(\d{4})$/);
  if (!m) return null;
  const monthKey = m[1].slice(0, 3).toLowerCase();
  const month = MONTH_NAMES[monthKey];
  if (!month) return null;
  return `${m[2]}-${month}-01`;
}
