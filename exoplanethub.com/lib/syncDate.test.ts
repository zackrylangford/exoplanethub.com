import { describe, expect, it } from 'vitest';
import { formatSyncDate } from '@/lib/syncDate';

describe('formatSyncDate', () => {
  it('reads a sync timestamp as a long English date', () => {
    expect(formatSyncDate('2026-08-30T06:00:00Z')).toBe('August 30, 2026');
  });

  it('keeps the UTC calendar day, so a late sync is not shifted by the server clock', () => {
    expect(formatSyncDate('2026-08-30T23:59:59Z')).toBe('August 30, 2026');
    expect(formatSyncDate('2026-08-31T00:00:01Z')).toBe('August 31, 2026');
  });

  it('gives no date for a stamp it cannot parse', () => {
    expect(formatSyncDate('not a timestamp')).toBeNull();
    expect(formatSyncDate('')).toBeNull();
  });
});
