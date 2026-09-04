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

// The item sweep.py writes: the whole stored planet, kept under the name and the sweep's stamp.
const TOMBSTONE = {
  pl_name: 'Kepler-452 b',
  removed_at: '2026-09-01T03:00:12',
  last_known_snapshot: KEPLER_452B,
};

// Re-evaluates the module graph, so a table name captured at import still reflects env set in the test body.
async function importTombstoneWithCurrentEnv() {
  vi.resetModules();
  return (await import('@/lib/tombstone')).getRetiredPlanet;
}

function getInputs() {
  return send.mock.calls.map(([command]) => command.input as Record<string, unknown>);
}

beforeEach(() => {
  send.mockReset();
  delete process.env.EXOPLANETS_TOMBSTONES_TABLE;
});

describe('getRetiredPlanet', () => {
  it('returns the last known snapshot and when the sweep removed it', async () => {
    send.mockResolvedValue({ Item: TOMBSTONE });
    const getRetiredPlanet = await importTombstoneWithCurrentEnv();

    await expect(getRetiredPlanet('Kepler-452 b')).resolves.toEqual({
      planet: KEPLER_452B,
      removedAt: '2026-09-01T03:00:12',
    });
  });

  it('returns null when no tombstone carries that name', async () => {
    send.mockResolvedValue({});
    const getRetiredPlanet = await importTombstoneWithCurrentEnv();

    await expect(getRetiredPlanet('Definitely Not A Planet b')).resolves.toBeNull();
  });

  // The page reads planet.pl_name unconditionally, so a snapshot-less item must 404 rather than 500.
  it('returns null when the tombstone has no snapshot to render', async () => {
    send.mockResolvedValue({ Item: { pl_name: 'Kepler-452 b', removed_at: '2026-09-01T03:00:12' } });
    const getRetiredPlanet = await importTombstoneWithCurrentEnv();

    await expect(getRetiredPlanet('Kepler-452 b')).resolves.toBeNull();
  });

  it('still serves the snapshot when the removal stamp is missing', async () => {
    send.mockResolvedValue({ Item: { pl_name: 'Kepler-452 b', last_known_snapshot: KEPLER_452B } });
    const getRetiredPlanet = await importTombstoneWithCurrentEnv();

    await expect(getRetiredPlanet('Kepler-452 b')).resolves.toEqual({ planet: KEPLER_452B, removedAt: '' });
  });

  it('looks the tombstone up by the exact name, spaces and all', async () => {
    send.mockResolvedValue({ Item: TOMBSTONE });
    const getRetiredPlanet = await importTombstoneWithCurrentEnv();

    await getRetiredPlanet('Kepler-452 b');

    expect(getInputs()[0].Key).toEqual({ pl_name: 'Kepler-452 b' });
  });

  it('costs one read, not a scan', async () => {
    send.mockResolvedValue({ Item: TOMBSTONE });
    const getRetiredPlanet = await importTombstoneWithCurrentEnv();

    await getRetiredPlanet('Kepler-452 b');

    expect(send).toHaveBeenCalledTimes(1);
    expect(getInputs()[0].ProjectionExpression).toBeUndefined();
  });

  it('reads the table named by EXOPLANETS_TOMBSTONES_TABLE', async () => {
    process.env.EXOPLANETS_TOMBSTONES_TABLE = 'exoplanet-tombstones-prod';
    send.mockResolvedValue({});
    const getRetiredPlanet = await importTombstoneWithCurrentEnv();

    await getRetiredPlanet('Kepler-452 b');

    expect(getInputs()[0].TableName).toBe('exoplanet-tombstones-prod');
  });

  it('falls back to the dev table when the variable is unset', async () => {
    send.mockResolvedValue({});
    const getRetiredPlanet = await importTombstoneWithCurrentEnv();

    await getRetiredPlanet('Kepler-452 b');

    expect(getInputs()[0].TableName).toBe('exoplanet-tombstones-dev');
  });
});

describe('getRetiredPlanet failure handling', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(() => {
    consoleError.mockClear();
  });

  // Retired names 404ed before tombstones existed, so a failed read degrades to that, never to a 500.
  it('answers null and logs when the read fails', async () => {
    send.mockRejectedValue(new Error('AccessDeniedException'));
    const getRetiredPlanet = await importTombstoneWithCurrentEnv();

    await expect(getRetiredPlanet('Kepler-452 b')).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      'Error reading tombstone:',
      expect.objectContaining({ message: 'AccessDeniedException' })
    );
  });

  // The name comes straight off the URL, so it must never reach the log stream raw.
  it('keeps the requested name out of the log line', async () => {
    send.mockRejectedValue(new Error('AccessDeniedException'));
    const getRetiredPlanet = await importTombstoneWithCurrentEnv();

    await getRetiredPlanet('Kepler-452 b\n\nFATAL forged line');

    const logged = consoleError.mock.calls.flat().filter((arg) => typeof arg === 'string');
    expect(logged.join(' ')).not.toMatch(/Kepler|FATAL|\n/);
  });
});
