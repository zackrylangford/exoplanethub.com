// Pinned locale and zone so a sync date reads identically wherever the page is rendered or cached.
const SYNC_DATE = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

// A corrupt stamp reads as no date rather than "Invalid Date".
export function formatSyncDate(timestamp: string): string | null {
  const synced = new Date(timestamp);
  return Number.isNaN(synced.getTime()) ? null : SYNC_DATE.format(synced);
}
