// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Planet } from '@/lib/mockPlanets';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class {},
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send }) },
  GetCommand: class {
    constructor(readonly input: Record<string, unknown>) {}
  },
}));

// The page renders fields the summary projection omits, so the fixture is a whole stored item.
const KEPLER_452B: Planet = {
  pl_name: 'Kepler-452 b',
  hostname: 'Kepler-452',
  sy_snum: 1,
  sy_pnum: 1,
  sy_dist: 551.7,
  discoverymethod: 'Transit',
  disc_year: 2015,
  disc_facility: 'Kepler',
  pl_orbper: 384.843,
  pl_orbsmax: 1.046,
  pl_rade: 1.63,
  pl_bmasse: null,
  pl_dens: null,
  pl_eqt: 265,
  pl_insol: 1.1,
  st_teff: 5757,
  st_rad: 1.11,
  st_mass: 1.04,
  st_logg: 4.32,
  st_age: 6,
  last_updated: '2026-08-30T06:00:00Z',
  esi: 0.83,
};

// Re-evaluates the module graph, so a table name captured at import still reflects env set in the test body.
async function importDetailWithCurrentEnv() {
  vi.resetModules();
  return (await import('@/lib/planetDetail')).getPlanetDetail;
}

async function importFindPlanetWithCurrentEnv() {
  vi.resetModules();
  return (await import('@/lib/planetDetail')).findPlanet;
}

// The item sweep.py writes: the whole stored planet, kept under the name and the sweep's stamp.
const TOMBSTONE = {
  pl_name: 'Kepler-452 b',
  removed_at: '2026-09-01T03:00:12',
  last_known_snapshot: KEPLER_452B,
};

// Both lookups share the document client, so the table name is what tells the two reads apart.
function stockTables({ live, retired }: { live?: Planet; retired?: typeof TOMBSTONE }) {
  send.mockImplementation(async ({ input }) => ({
    Item: input.TableName === 'exoplanets-dev' ? live : retired,
  }));
}

function getInputs() {
  return send.mock.calls.map(([command]) => command.input as Record<string, unknown>);
}

beforeEach(() => {
  send.mockReset();
  delete process.env.EXOPLANETS_DATABASE_TABLE;
  delete process.env.EXOPLANETS_TOMBSTONES_TABLE;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getPlanetDetail', () => {
  it('returns the stored item with the fields the summary projection leaves out', async () => {
    send.mockResolvedValue({ Item: KEPLER_452B });
    const getPlanetDetail = await importDetailWithCurrentEnv();

    await expect(getPlanetDetail('Kepler-452 b')).resolves.toEqual(KEPLER_452B);
  });

  it('returns null when no planet carries that name', async () => {
    send.mockResolvedValue({});
    const getPlanetDetail = await importDetailWithCurrentEnv();

    await expect(getPlanetDetail('Definitely Not A Planet b')).resolves.toBeNull();
  });

  it('looks the planet up by its exact name, spaces and all', async () => {
    send.mockResolvedValue({ Item: KEPLER_452B });
    const getPlanetDetail = await importDetailWithCurrentEnv();

    await getPlanetDetail('Kepler-452 b');

    expect(getInputs()[0].Key).toEqual({ pl_name: 'Kepler-452 b' });
  });

  it('costs one read, not a scan', async () => {
    send.mockResolvedValue({ Item: KEPLER_452B });
    const getPlanetDetail = await importDetailWithCurrentEnv();

    await getPlanetDetail('Kepler-452 b');

    expect(send).toHaveBeenCalledTimes(1);
    expect(getInputs()[0].ProjectionExpression).toBeUndefined();
  });

  it('reads the table named by EXOPLANETS_DATABASE_TABLE', async () => {
    process.env.EXOPLANETS_DATABASE_TABLE = 'exoplanets-prod';
    send.mockResolvedValue({});
    const getPlanetDetail = await importDetailWithCurrentEnv();

    await getPlanetDetail('Kepler-452 b');

    expect(getInputs()[0].TableName).toBe('exoplanets-prod');
  });

  it('falls back to the dev table when the variable is unset', async () => {
    send.mockResolvedValue({});
    const getPlanetDetail = await importDetailWithCurrentEnv();

    await getPlanetDetail('Kepler-452 b');

    expect(getInputs()[0].TableName).toBe('exoplanets-dev');
  });
});

describe('getPlanetDetail failure handling', () => {
  it('propagates a read failure instead of reporting it as a missing planet', async () => {
    send.mockRejectedValue(new Error('ProvisionedThroughputExceededException'));
    const getPlanetDetail = await importDetailWithCurrentEnv();

    await expect(getPlanetDetail('Kepler-452 b')).rejects.toThrow(
      'ProvisionedThroughputExceededException'
    );
  });
});

describe('findPlanet', () => {
  it('returns a listed planet as live, with no removal date', async () => {
    stockTables({ live: KEPLER_452B });
    const findPlanet = await importFindPlanetWithCurrentEnv();

    await expect(findPlanet('Kepler-452 b')).resolves.toEqual({ planet: KEPLER_452B, removedAt: null });
  });

  // The tombstone table is a fallback, not a second read on every planet page.
  it('never consults the tombstones for a planet the archive still lists', async () => {
    stockTables({ live: KEPLER_452B, retired: TOMBSTONE });
    const findPlanet = await importFindPlanetWithCurrentEnv();

    await findPlanet('Kepler-452 b');

    expect(getInputs().map((input) => input.TableName)).toEqual(['exoplanets-dev']);
  });

  it('falls through to the tombstone, under the same name, once the live read misses', async () => {
    stockTables({ retired: TOMBSTONE });
    const findPlanet = await importFindPlanetWithCurrentEnv();

    await expect(findPlanet('Kepler-452 b')).resolves.toEqual({
      planet: KEPLER_452B,
      removedAt: '2026-09-01T03:00:12',
    });
    expect(getInputs().map((input) => [input.TableName, input.Key])).toEqual([
      ['exoplanets-dev', { pl_name: 'Kepler-452 b' }],
      ['exoplanet-tombstones-dev', { pl_name: 'Kepler-452 b' }],
    ]);
  });

  it('returns null when neither the archive nor the tombstones know the name', async () => {
    stockTables({});
    const findPlanet = await importFindPlanetWithCurrentEnv();

    await expect(findPlanet('Definitely Not A Planet b')).resolves.toBeNull();
  });

  // A throttled or broken read is not a missing planet; a cached 404 would outlive the outage.
  it('lets a live read failure surface without consulting the tombstones', async () => {
    send.mockRejectedValue(new Error('ProvisionedThroughputExceededException'));
    const findPlanet = await importFindPlanetWithCurrentEnv();

    await expect(findPlanet('Kepler-452 b')).rejects.toThrow('ProvisionedThroughputExceededException');
    expect(send).toHaveBeenCalledTimes(1);
  });

  // A retired name 404ed before tombstones existed, so a broken tombstone read degrades to that.
  it('reads a failed tombstone lookup as a miss rather than an error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    send.mockImplementation(async ({ input }) => {
      if (input.TableName === 'exoplanets-dev') return {};
      throw new Error('AccessDeniedException');
    });
    const findPlanet = await importFindPlanetWithCurrentEnv();

    await expect(findPlanet('Kepler-452 b')).resolves.toBeNull();
  });
});
