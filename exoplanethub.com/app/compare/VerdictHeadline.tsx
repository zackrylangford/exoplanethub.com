import type { Verdict } from '@/lib/planetComparison';
import styles from './VerdictHeadline.module.css';

// A paragraph, not a heading: the outline stays the page, then its two planets.
export default function VerdictHeadline({ verdict }: { verdict: Verdict }) {
  return <p className={styles.headline}>{verdict.headline}</p>;
}
