import 'server-only';
import { unstable_cache } from 'next/cache';
import { scanAllPlanets } from '@/lib/dynamo';
import { parseSyncDate } from '@/lib/syncDate';

export interface ArchiveStats {
  planetCount: number;
  systemCount: number;
  lastSynced: string | null;
}

export type ArchiveStatsResult = ({ status: 'ok' } & ArchiveStats) | { status: 'unavailable' };

const REVALIDATE_SECONDS = 3600;

// The stored item is only a claim, so the sync stamp is not trusted to be present either.
interface ArchiveRow {
  hostname: string | null;
  last_updated: string | null;
}

// A blank host counts its planet but no system, so empty strings cannot pool into one phantom star.
function distinctHosts(rows: ArchiveRow[]): number {
  return new Set(rows.map(({ hostname }) => hostname).filter((host) => host !== null && host.trim() !== ''))
    .size;
}

// Stays a string because unstable_cache round-trips its result through JSON, which would flatten a Date.
function latestStamp(rows: ArchiveRow[]): string | null {
  let latest: { stamp: string; at: number } | null = null;

  for (const { last_updated } of rows) {
    if (last_updated === null) continue;

    const at = parseSyncDate(last_updated)?.getTime();
    if (at !== undefined && (latest === null || at > latest.at)) latest = { stamp: last_updated, at };
  }

  return latest?.stamp ?? null;
}

// Bounds a homepage line that would otherwise Scan ~6k items on every visit; same cadence as the sitemap.
const cachedStats = unstable_cache(
  async (): Promise<ArchiveStats> => {
    const rows = await scanAllPlanets(['hostname', 'last_updated']);
    return { planetCount: rows.length, systemCount: distinctHosts(rows), lastSynced: latestStamp(rows) };
  },
  ['archive-stats'],
  { revalidate: REVALIDATE_SECONDS }
);

// The catch sits outside the cache so a failed scan is retried next request, not remembered for an hour.
export async function fetchArchiveStats(): Promise<ArchiveStatsResult> {
  try {
    return { status: 'ok', ...(await cachedStats()) };
  } catch (error) {
    console.error('Error fetching archive stats:', error);
    return { status: 'unavailable' };
  }
}
