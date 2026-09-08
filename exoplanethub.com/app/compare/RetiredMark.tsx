import { formatSyncDate } from '@/lib/syncDate';
import styles from './RetiredMark.module.css';

// No DOM id: both columns can be retired, and two marks must not bind to one node.
export default function RetiredMark({ removedAt }: { removedAt: string }) {
  const removed = formatSyncDate(removedAt);

  return (
    <p className={styles.mark} role="note">
      Retired planet — removed from the archive{removed === null ? '' : ` on ${removed}`}; values
      are the last recorded
    </p>
  );
}
