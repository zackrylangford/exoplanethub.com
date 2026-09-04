import { formatSyncDate } from '@/lib/syncDate';
import styles from './RetiredNotice.module.css';

interface RetiredNoticeProps {
  planetName: string;
  removedAt: string;
}

export default function RetiredNotice({ planetName, removedAt }: RetiredNoticeProps) {
  const removed = formatSyncDate(removedAt);

  return (
    <div className={styles.notice} role="note" aria-labelledby="retired-notice-label">
      <p id="retired-notice-label" className={styles.label}>
        Retired planet
      </p>
      <p className={styles.body}>
        {planetName} was removed from the NASA Exoplanet Archive
        {removed === null ? '' : ` on ${removed}`} and is no longer listed as a confirmed planet.
        That usually means a closer look found the signal was stellar noise, an instrument artifact,
        or a duplicate of a planet already catalogued.
      </p>
      <p className={styles.body}>
        Everything below is the last data recorded before it was removed, not a current measurement.
      </p>
    </div>
  );
}
