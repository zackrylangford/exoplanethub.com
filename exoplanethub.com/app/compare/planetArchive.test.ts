import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlanetSummary } from '@/lib/mockPlanets';

function summary(pl_name: string): PlanetSummary {
  return {
    pl_name,
    hostname: null,
    sy_dist: null,
    discoverymethod: null,
    disc_year: null,
    pl_orbper: null,
    pl_rade: null,
    pl_bmasse: null,
    pl_eqt: null,
    st_teff: null,
  };
}

function archiveResponse(payload: unknown, status = 200) {
  return { ok: status < 400, status, json: () => Promise.resolve(payload) };
}

function respondWith(payload: unknown, status = 200) {
  return vi.fn().mockResolvedValue(archiveResponse(payload, status));
}

// The module holds the page-wide cache, so every test starts from a fresh copy of it.
async function freshLoader() {
  vi.resetModules();
  return (await import('./planetArchive')).loadPlanetArchive;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadPlanetArchive', () => {
  it('shares one in-flight request between callers and caches the list afterwards', async () => {
    const fetch = respondWith([summary('Kepler-452 b')]);
    vi.stubGlobal('fetch', fetch);
    const loadPlanetArchive = await freshLoader();

    const [first, second] = await Promise.all([loadPlanetArchive(), loadPlanetArchive()]);
    const third = await loadPlanetArchive();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/planets');
    expect(first).toBe(second);
    expect(third).toBe(first);
  });

  it('orders the list by designation with numbers compared as numbers', async () => {
    vi.stubGlobal(
      'fetch',
      respondWith([summary('Kepler-400 b'), summary('kepler-4 b'), summary('Kepler-40 b'), summary('55 Cnc e')])
    );
    const loadPlanetArchive = await freshLoader();

    const names = (await loadPlanetArchive()).map((planet) => planet.pl_name);

    expect(names).toEqual(['55 Cnc e', 'kepler-4 b', 'Kepler-40 b', 'Kepler-400 b']);
  });

  it.each([
    ['the endpoint answers with an error status', () => respondWith({ error: 'Failed to fetch planets' }, 500), 'answered 500'],
    ['the endpoint answers with something other than a list', () => respondWith({ planets: [] }), 'did not return a list'],
    ['the request itself fails', () => vi.fn().mockRejectedValue(new TypeError('Failed to fetch')), 'Failed to fetch'],
  ])('rejects when %s, then lets the next caller try again', async (_case, failingFetch, message) => {
    const fetch = failingFetch();
    vi.stubGlobal('fetch', fetch);
    const loadPlanetArchive = await freshLoader();

    await expect(loadPlanetArchive()).rejects.toThrow(message);

    fetch.mockResolvedValue(archiveResponse([summary('Kepler-452 b')]));
    await expect(loadPlanetArchive()).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
