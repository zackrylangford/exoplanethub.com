import { Suspense } from 'react';
import { connection } from 'next/server';
import { fetchArchiveStats } from '@/lib/archiveStats';
import { formatSyncDate } from '@/lib/syncDate';
import styles from './ArchiveStats.module.css';

export default function ArchiveStats() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <ArchiveStatsLine />
    </Suspense>
  );
}

// Exported for its test only: rendering it directly skips the Suspense boundary above.
export async function ArchiveStatsLine() {
  // Defers this subtree to request time so a failed read costs one response, not a cached page.
  await connection();
  const result = await fetchArchiveStats();

  // An empty or unreadable archive says nothing rather than "0 confirmed planets".
  if (result.status === 'unavailable' || result.planetCount === 0) return null;

  const synced = result.lastSynced === null ? null : formatSyncDate(result.lastSynced);

  return (
    <p className={styles.line}>
      <strong className={styles.figure}>{counted(result.planetCount, 'confirmed planet')}</strong>
      {' across '}
      <strong className={styles.figure}>{counted(result.systemCount, 'system')}</strong>
      {synced !== null && <SyncedClause date={synced} />}
    </p>
  );
}

function counted(count: number, noun: string): string {
  return `${count.toLocaleString('en-US')} ${noun}${count === 1 ? '' : 's'}`;
}

// The dash is punctuation for sighted readers only; a screen reader would announce it or fall silent mid-sentence.
function SyncedClause({ date }: { date: string }) {
  return (
    <>
      {' '}
      <span aria-hidden="true">—</span>
      {' last synced '}
      {date}
    </>
  );
}

// Holds the line's height while the count streams in, so the sections below do not jump.
function LoadingPlaceholder() {
  return (
    <p className={styles.line} aria-hidden="true">
      <span className={styles.skeleton} /> <span className={styles.skeleton} /> <span className={styles.skeleton} />
    </p>
  );
}
