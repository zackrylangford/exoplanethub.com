'use client';
import { useAnnouncement } from '@/lib/useAnnouncement';
import styles from './ResultsCount.module.css';

export default function ResultsCount({ visible, total }: { visible: number; total: number }) {
  const summary = `${visible} of ${total} planets`;
  const announced = useAnnouncement(summary);

  return (
    <p className={styles.count}>
      <span aria-hidden="true">{summary}</span>
      <span className={styles.announcement} role="status">
        Showing {announced}
      </span>
    </p>
  );
}
