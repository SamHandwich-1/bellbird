// FRED API wrapper.
// Docs: https://fred.stlouisfed.org/docs/api/fred/
//
// Rate limit is 120 req/min on the public API. Our backfill needs ~16 fetches
// (one per series), well within budget. The daily refresh is the same size.
// We still pace requests with a small delay to be polite and to stay safely
// under the cap if FRED ever tightens it.

const FRED_BASE = 'https://api.stlouisfed.org/fred';
const FETCH_GAP_MS = 250;

export type FredObservation = {
  date: string;          // 'YYYY-MM-DD'
  value: number | null;  // FRED returns '.' for missing; normalised to null
};

export class FredError extends Error {
  constructor(
    message: string,
    public readonly seriesId: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'FredError';
  }
}

function requireKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    throw new Error(
      'FRED_API_KEY is not set. Add it to .env.local (and Vercel env) — see https://fred.stlouisfed.org/docs/api/api_key.html',
    );
  }
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type FetchObservationsOptions = {
  startDate?: string;    // 'YYYY-MM-DD' inclusive
  endDate?: string;      // 'YYYY-MM-DD' inclusive
  frequency?: 'd' | 'w' | 'm' | 'q' | 'a';  // resample frequency
};

export async function fetchObservations(
  seriesId: string,
  opts: FetchObservationsOptions = {},
): Promise<FredObservation[]> {
  const key = requireKey();
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: key,
    file_type: 'json',
  });
  if (opts.startDate) params.set('observation_start', opts.startDate);
  if (opts.endDate) params.set('observation_end', opts.endDate);
  if (opts.frequency) params.set('frequency', opts.frequency);

  const url = `${FRED_BASE}/series/observations?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new FredError(
      `FRED ${seriesId} returned ${res.status}: ${body.slice(0, 200)}`,
      seriesId,
      res.status,
    );
  }

  const json = (await res.json()) as {
    observations?: Array<{ date: string; value: string }>;
  };

  if (!Array.isArray(json.observations)) {
    throw new FredError(`FRED ${seriesId} returned no observations array`, seriesId);
  }

  return json.observations.map((o) => ({
    date: o.date,
    value: o.value === '.' || o.value === '' ? null : Number(o.value),
  }));
}

// Fetch many series sequentially with a small gap to stay polite.
export async function fetchManySerial<T extends { seriesId: string }>(
  items: T[],
  perItem: (item: T) => Promise<FredObservation[]>,
): Promise<Array<{ item: T; observations: FredObservation[] }>> {
  const out: Array<{ item: T; observations: FredObservation[] }> = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const observations = await perItem(item);
    out.push({ item, observations });
    if (i < items.length - 1) await sleep(FETCH_GAP_MS);
  }
  return out;
}
