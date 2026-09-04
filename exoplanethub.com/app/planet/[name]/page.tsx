import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ESIBadge from '@/components/explore/ESIBadge';
import { earthComparisons, type EarthComparison } from '@/lib/earthComparison';
import type { Planet } from '@/lib/mockPlanets';
import { getPlanetDetail } from '@/lib/planetDetail';
import { planetMetadata, retiredPlanetMetadata } from '@/lib/planetMetadata';
import { planetNameFromParam } from '@/lib/planetUrl';
import { planetStatSections, type PlanetStatSection } from '@/lib/planetStats';
import { formatSyncDate } from '@/lib/syncDate';
import { getRetiredPlanet, type RetiredPlanet } from '@/lib/tombstone';
import PageSection from './PageSection';
import RetiredNotice from './RetiredNotice';
import styles from './page.module.css';

export const revalidate = 3600;

const ARCHIVE_URL = 'https://exoplanetarchive.ipac.caltech.edu/';

interface PlanetPageProps {
  params: Promise<{ name: string }>;
}

// A live planet is one the archive still lists; a retired one is the snapshot the sweep kept.
type FoundPlanet = { planet: Planet; removedAt: null } | RetiredPlanet;

// A malformed segment and an unstocked name are the same answer, so callers get one null.
// Tombstones are read only after a live miss, so a listed planet costs the one GetItem it always did.
async function loadPlanet(params: PlanetPageProps['params']): Promise<FoundPlanet | null> {
  const planetName = planetNameFromParam((await params).name);
  if (planetName === null) return null;

  const planet = await getPlanetDetail(planetName);
  return planet === null ? getRetiredPlanet(planetName) : { planet, removedAt: null };
}

// Both lookups are cache()d, so titling the page and rendering it share the same reads.
export async function generateMetadata({ params }: PlanetPageProps): Promise<Metadata> {
  const found = await loadPlanet(params);
  if (found === null) return planetMetadata(null);

  return found.removedAt === null ? planetMetadata(found.planet) : retiredPlanetMetadata(found);
}

export default async function PlanetPage({ params }: PlanetPageProps) {
  const found = await loadPlanet(params);
  if (found === null) notFound();
  const { planet } = found;

  return (
    <main className={styles.page}>
      <article className={styles.container}>
        {found.removedAt !== null && (
          <RetiredNotice planetName={planet.pl_name} removedAt={found.removedAt} />
        )}

        <header className={styles.header}>
          <h1 className={styles.title}>{planet.pl_name}</h1>
          <p className={styles.summary}>{summarize(found)}</p>
          <ESIBadge score={planet.esi} variant="page" />
        </header>

        <div className={styles.sections}>
          <EarthComparisonSection comparisons={earthComparisons(planet)} />
          {planetStatSections(planet).map((section) => (
            <StatSection key={section.id} section={section} />
          ))}
        </div>

        <p className={styles.provenance}>
          Data from the{' '}
          <a className={styles.provenanceLink} href={ARCHIVE_URL} target="_blank" rel="noopener noreferrer">
            NASA Exoplanet Archive
          </a>
          {describeProvenance(found)}
        </p>
      </article>
    </main>
  );
}

function EarthComparisonSection({ comparisons }: { comparisons: EarthComparison[] }) {
  if (comparisons.length === 0) return null;

  return (
    <PageSection id="earth-comparison" title="Compared with Earth">
      <dl className={styles.comparisons}>
        {comparisons.map(({ aspect, detail }) => (
          <div key={aspect} className={styles.comparison}>
            <dt className={styles.statLabel}>{aspect}</dt>
            <dd className={styles.comparisonDetail}>{detail}</dd>
          </div>
        ))}
      </dl>
    </PageSection>
  );
}

function StatSection({ section }: { section: PlanetStatSection }) {
  return (
    <PageSection id={section.id} title={section.title}>
      <dl className={styles.stats}>
        {section.stats.map(({ label, value }) => (
          <div key={label} className={styles.stat}>
            <dt className={styles.statLabel}>{label}</dt>
            <dd className={styles.statValue}>{value ?? <Unknown />}</dd>
          </div>
        ))}
      </dl>
    </PageSection>
  );
}

// A bare em dash is silence to a screen reader, so the two audiences get separate copy.
function Unknown() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className={styles.visuallyHidden}>Unknown</span>
    </>
  );
}

function summarize({ planet, removedAt }: FoundPlanet): string {
  const orbit = planet.hostname ? ` orbiting ${planet.hostname}` : '';
  return removedAt === null
    ? `A confirmed exoplanet${orbit}.`
    : `Formerly listed as a confirmed exoplanet${orbit}.`;
}

// A retired page must not read as freshly synced: its data stopped at the removal, so date that.
function describeProvenance({ planet, removedAt }: FoundPlanet): string {
  if (removedAt === null) {
    const synced = formatSyncDate(planet.last_updated);
    return synced === null ? '.' : `, synced ${synced}.`;
  }

  const removed = formatSyncDate(removedAt);
  return removed === null
    ? ', as last recorded before this planet was removed.'
    : `, as last recorded before this planet was removed on ${removed}.`;
}
