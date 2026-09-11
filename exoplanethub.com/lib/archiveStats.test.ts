// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchArchiveStats, type ArchiveStatsResult } from '@/lib/archiveStats';

const { send, unstableCache } = vi.hoisted(() => ({
  send: vi.fn(),
  unstableCache: vi.fn<(scan: unknown, keys: string[], options: { revalidate: number }) => unknown>(
    (scan) => scan
  ),
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class {},
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send }) },
  ScanCommand: class {
    constructor(readonly input: Record<string, unknown>) {}
  },
}));

vi.mock('next/cache', () => ({ unstable_cache: unstableCache }));

const SYNC = '2026-08-30T06:00:00';
const LATER_SYNC = '2026-09-01T03:00:12';

interface Row {
  hostname: string | null;
  last_updated: string | null;
}

function row(hostname: string | null, last_updated: string | null = SYNC): Row {
  return { hostname, last_updated };
}

async function statsOf(items: Row[]): Promise<ArchiveStatsResult> {
  send.mockResolvedValue({ Items: items });
  return fetchArchiveStats();
}

// Resolves the '#alias, #alias' projection back to the attribute names DynamoDB will actually return.
function projectedFields() {
  const input = send.mock.calls[0][0].input as Record<string, unknown>;
  const names = input.ExpressionAttributeNames as Record<string, string>;
  return (input.ProjectionExpression as string).split(', ').map((alias) => names[alias]);
}

beforeEach(() => {
  send.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('fetchArchiveStats counts', () => {
  it('counts every planet once and every host star once', async () => {
    const stats = await statsOf([row('TRAPPIST-1'), row('TRAPPIST-1'), row('Kepler-452'), row('Proxima Cen')]);

    expect(stats).toMatchObject({ status: 'ok', planetCount: 4, systemCount: 3 });
  });

  it('counts a planet with a blank or missing host but gives it no system', async () => {
    const stats = await statsOf([row('TRAPPIST-1'), row(null), row(''), row('   ')]);

    expect(stats).toMatchObject({ planetCount: 4, systemCount: 1 });
  });

  it('reports an empty archive as zero of each with no sync date', async () => {
    expect(await statsOf([])).toEqual({ status: 'ok', planetCount: 0, systemCount: 0, lastSynced: null });
  });
});

describe('fetchArchiveStats last sync', () => {
  it('reports the latest stamp whatever order the table returned them in', async () => {
    const stats = await statsOf([row('A', LATER_SYNC), row('B', SYNC), row('C', LATER_SYNC)]);

    expect(stats).toMatchObject({ lastSynced: LATER_SYNC });
  });

  it('orders stamps as instants, not as strings, when one carries an offset', async () => {
    // 23:30 at UTC-5 is 04:30Z on September 1, later than the offset-less 03:00 stamp.
    const stats = await statsOf([row('A', '2026-08-31T23:30:00-05:00'), row('B', LATER_SYNC)]);

    expect(stats).toMatchObject({ lastSynced: '2026-08-31T23:30:00-05:00' });
  });

  it('skips stamps it cannot read', async () => {
    expect(await statsOf([row('A', 'not a date'), row('B', SYNC)])).toMatchObject({ lastSynced: SYNC });
  });

  it('gives no date when no stamp can be read', async () => {
    expect(await statsOf([row('A', null), row('B', 'not a date')])).toMatchObject({ lastSynced: null });
  });
});

describe('fetchArchiveStats scan', () => {
  it('projects only the two attributes the counts need', async () => {
    await statsOf([]);

    expect(projectedFields()).toEqual(['hostname', 'last_updated']);
  });

  it('shares one scan an hour across requests, at the cadence the sitemap uses', () => {
    expect(unstableCache).toHaveBeenCalledTimes(1);
    expect(unstableCache.mock.calls[0][2]).toEqual({ revalidate: 3600 });
  });

  it('reports the archive unavailable rather than throwing when the table cannot be read', async () => {
    send.mockRejectedValue(new Error('AccessDeniedException'));

    await expect(fetchArchiveStats()).resolves.toEqual({ status: 'unavailable' });
  });
});
