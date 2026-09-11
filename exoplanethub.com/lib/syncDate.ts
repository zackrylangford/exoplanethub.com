// Pinned locale and zone so a sync date reads identically wherever the page is rendered or cached.
const SYNC_DATE = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/;

// The Lambda stamps UTC without an offset, which Date would otherwise read in the host's zone.
export function parseSyncDate(timestamp: string): Date | null {
  const synced = new Date(HAS_ZONE.test(timestamp) ? timestamp : `${timestamp}Z`);
  return Number.isNaN(synced.getTime()) ? null : synced;
}

// A corrupt stamp reads as no date rather than "Invalid Date".
export function formatSyncDate(timestamp: string): string | null {
  const synced = parseSyncDate(timestamp);
  return synced === null ? null : SYNC_DATE.format(synced);
}
