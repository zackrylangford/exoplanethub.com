// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Planet } from '@/lib/mockPlanets';
import { planetMetadata } from '@/lib/planetMetadata';
import { SITE_ORIGIN } from '@/lib/site';

const { send, connection, unstableCache } = vi.hoisted(() => ({
  send: vi.fn(),
  connection: vi.fn(async () => {}),
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

vi.mock('next/server', () => ({ connection }));
vi.mock('next/cache', () => ({ unstable_cache: unstableCache }));

const LAST_UPDATED = '2026-08-30T06:00:00Z';

const STATIC_URLS = [
  'https://www.exoplanethub.com/',
  'https://www.exoplanethub.com/explore',
  'https://www.exoplanethub.com/about',
  'https://www.exoplanethub.com/contact',
];

// Only the two projected attributes reach the sitemap; a row is what the Scan hands back, not a whole planet.
function row(pl_name: string) {
  return { pl_name, last_updated: LAST_UPDATED };
}

// planetMetadata reads the whole item, so the canonical cross-check needs every field present.
const UNMEASURED_PLANET: Omit<Planet, 'pl_name'> = {
  hostname: null,
  sy_snum: null,
  sy_pnum: null,
  sy_dist: null,
  discoverymethod: null,
  disc_year: null,
  disc_facility: null,
  pl_orbper: null,
  pl_orbsmax: null,
  pl_rade: null,
  pl_bmasse: null,
  pl_dens: null,
  pl_eqt: null,
  pl_insol: null,
  st_teff: null,
  st_rad: null,
  st_mass: null,
  st_logg: null,
  st_age: null,
  last_updated: LAST_UPDATED,
};

// Re-evaluates the module graph, so a table name captured at import still reflects env set in the test body.
async function loadSitemap() {
  vi.resetModules();
  return (await import('@/app/sitemap')).default();
}

function scanInputs() {
  return send.mock.calls.map(([command]) => command.input as Record<string, unknown>);
}

// Resolves the '#alias, #alias' projection back to the attribute names DynamoDB will actually return.
function projectedFields(input: Record<string, unknown>) {
  const names = input.ExpressionAttributeNames as Record<string, string>;
  return (input.ProjectionExpression as string).split(', ').map((alias) => names[alias]);
}

function planetUrls(entries: Awaited<ReturnType<typeof loadSitemap>>) {
  return entries.map((entry) => entry.url).filter((url) => !STATIC_URLS.includes(url));
}

beforeEach(() => {
  send.mockReset();
  connection.mockClear();
  unstableCache.mockClear();
});

describe('sitemap', () => {
  it('lists the hand-written pages ahead of the archive', async () => {
    send.mockResolvedValue({ Items: [row('Kepler-22 b')] });

    const entries = await loadSitemap();

    expect(entries.slice(0, 4).map((entry) => entry.url)).toEqual(STATIC_URLS);
  });

  it('emits one absolute URL per archived planet', async () => {
    send.mockResolvedValue({ Items: [row('Kepler-22 b'), row('TRAPPIST-1 e')] });

    expect(planetUrls(await loadSitemap())).toEqual([
      'https://www.exoplanethub.com/planet/Kepler-22%20b',
      'https://www.exoplanethub.com/planet/TRAPPIST-1%20e',
    ]);
  });

  it.each([
    ['Kepler-16 b', 'https://www.exoplanethub.com/planet/Kepler-16%20b'],
    ['HD 189733 A+b', 'https://www.exoplanethub.com/planet/HD%20189733%20A%2Bb'],
  ])('encodes %s so the URL resolves to that planet', async (name, expected) => {
    send.mockResolvedValue({ Items: [row(name)] });

    expect(planetUrls(await loadSitemap())).toEqual([expected]);
  });

  it('emits the URL the planet page declares as its canonical', async () => {
    const pl_name = 'Kepler-16 b';
    send.mockResolvedValue({ Items: [row(pl_name)] });
    const canonical = planetMetadata({ pl_name, ...UNMEASURED_PLANET }).alternates?.canonical;

    expect(planetUrls(await loadSitemap())[0]).toBe(new URL(String(canonical), SITE_ORIGIN).href);
  });

  it('serves an empty archive as the static pages alone rather than failing', async () => {
    send.mockResolvedValue({});

    expect((await loadSitemap()).map((entry) => entry.url)).toEqual(STATIC_URLS);
  });
});

describe('sitemap freshness', () => {
  it('dates each planet URL by the sync that last touched it', async () => {
    send.mockResolvedValue({ Items: [row('Kepler-22 b')] });

    const entries = await loadSitemap();

    expect(entries.at(-1)?.lastModified).toEqual(new Date(LAST_UPDATED));
  });

  it.each([
    ['an unparseable string', { pl_name: 'Kepler-22 b', last_updated: 'last Tuesday' }],
    ['a stored null', { pl_name: 'Kepler-22 b', last_updated: null }],
    ['a missing attribute', { pl_name: 'Kepler-22 b' }],
  ])('omits lastModified rather than emitting an invalid date for %s', async (_case, item) => {
    send.mockResolvedValue({ Items: [item] });

    const entries = await loadSitemap();

    expect(entries.at(-1)).toEqual({ url: 'https://www.exoplanethub.com/planet/Kepler-22%20b' });
  });

  it('rescans at the cadence the planet pages revalidate on', async () => {
    send.mockResolvedValue({ Items: [] });

    await loadSitemap();

    expect(unstableCache.mock.calls[0][2]).toEqual({ revalidate: 3600 });
  });

  it('defers the scan to request time so a credential-less build cannot bake a planet-less sitemap', async () => {
    send.mockResolvedValue({ Items: [] });

    await loadSitemap();

    expect(connection).toHaveBeenCalled();
  });
});

describe('sitemap scan', () => {
  it('follows LastEvaluatedKey until every planet is listed', async () => {
    send
      .mockResolvedValueOnce({ Items: [row('Kepler-22 b')], LastEvaluatedKey: { pl_name: 'Kepler-22 b' } })
      .mockResolvedValueOnce({ Items: [row('TRAPPIST-1 e')], LastEvaluatedKey: { pl_name: 'TRAPPIST-1 e' } })
      .mockResolvedValueOnce({ Items: [row('Proxima Cen b')] });

    expect(planetUrls(await loadSitemap())).toEqual([
      'https://www.exoplanethub.com/planet/Kepler-22%20b',
      'https://www.exoplanethub.com/planet/TRAPPIST-1%20e',
      'https://www.exoplanethub.com/planet/Proxima%20Cen%20b',
    ]);
    expect(send).toHaveBeenCalledTimes(3);
    expect(scanInputs()[1].ExclusiveStartKey).toEqual({ pl_name: 'Kepler-22 b' });
    expect(scanInputs()[2].ExclusiveStartKey).toEqual({ pl_name: 'TRAPPIST-1 e' });
  });

  it('projects only the two attributes a URL entry needs', async () => {
    send.mockResolvedValue({ Items: [] });

    await loadSitemap();

    expect(projectedFields(scanInputs()[0])).toEqual(['pl_name', 'last_updated']);
  });

  it('scans the table named by EXOPLANETS_DATABASE_TABLE', async () => {
    process.env.EXOPLANETS_DATABASE_TABLE = 'exoplanets-prod';
    send.mockResolvedValue({ Items: [] });

    await loadSitemap();
    delete process.env.EXOPLANETS_DATABASE_TABLE;

    expect(scanInputs()[0].TableName).toBe('exoplanets-prod');
  });

  it('propagates a scan failure rather than publishing a truncated sitemap', async () => {
    send.mockRejectedValue(new Error('ProvisionedThroughputExceededException'));

    await expect(loadSitemap()).rejects.toThrow('ProvisionedThroughputExceededException');
  });
});
