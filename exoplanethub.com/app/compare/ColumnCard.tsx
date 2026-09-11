import Link from 'next/link';
import ESIBadge from '@/components/explore/ESIBadge';
import type { FoundPlanet } from '@/lib/planetDetail';
import { planetUrl } from '@/lib/planetUrl';
import RetiredMark from './RetiredMark';
import styles from './ColumnCard.module.css';

interface ColumnCardProps {
  found: FoundPlanet;
  changeHref: string;
}

export default function ColumnCard({ found: { planet, removedAt }, changeHref }: ColumnCardProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.name}>
        <Link className={styles.planetLink} href={planetUrl(planet.pl_name)}>
          {planet.pl_name}
        </Link>
      </h2>
      <ESIBadge score={planet.esi} variant="page" />
      {removedAt !== null && <RetiredMark removedAt={removedAt} />}
      {/* Two cards means two Change links, so each carries its planet in its accessible name. */}
      <Link className={styles.change} href={changeHref} aria-label={`Change ${planet.pl_name}`}>
        Change
      </Link>
    </div>
  );
}
