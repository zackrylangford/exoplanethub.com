'use client';
import Link from 'next/link';
import styles from './page.module.css';

// findPlanet throws on an outage rather than resolving null, so a broken read lands here, not in an empty column.
export default function CompareError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className={styles.page}>
      <div className={styles.container} role="alert">
        <h1 className={styles.title}>We couldn&apos;t load this comparison</h1>
        <p className={styles.lede}>
          The request for the planets&apos; data didn&apos;t come back. This is usually temporary.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={reset}>
            Try again
          </button>
          <Link className={`${styles.action} ${styles.actionQuiet}`} href="/explore">
            Browse the archive
          </Link>
        </div>
      </div>
    </main>
  );
}
