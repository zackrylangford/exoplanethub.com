import type { Metadata } from 'next';
import Link from 'next/link';
import type { Planet } from '@/lib/mockPlanets';
import { comparePlanets } from '@/lib/planetComparison';
import { findPlanet, type FoundPlanet } from '@/lib/planetDetail';
import {
  compareUrl,
  FIRST_COLUMN_PARAM,
  planetNameFromParam,
  SECOND_COLUMN_PARAM,
} from '@/lib/planetUrl';
import { SITE_NAME } from '@/lib/site';
import ColumnCard from './ColumnCard';
import EmptySlot, { type Slot } from './EmptySlot';
import styles from './page.module.css';

type SearchParams = Record<string, string | string[] | undefined>;

interface ComparePageProps {
  searchParams: Promise<SearchParams>;
}

// name is what the URL said; found is what the archive answered. Swap and Change use only name.
interface Column {
  name: string | null;
  found: FoundPlanet | null;
}

interface Columns {
  a: Column;
  b: Column;
  indexable: boolean;
}

const COMPARE_METADATA: Metadata = {
  title: `Compare planets | ${SITE_NAME}`,
  description:
    'Put two confirmed exoplanets side by side — size, mass, temperature, orbit and star — and see ' +
    "which is closer to Earth's conditions",
};

// A repeated param arrives as an array and a malformed one fails validation: both read as absent.
function nameParam(params: SearchParams, param: string): string | null {
  const value = params[param];
  return typeof value === 'string' ? planetNameFromParam(value) : null;
}

async function loadColumn(name: string | null): Promise<Column> {
  return { name, found: name === null ? null : await findPlanet(name) };
}

async function loadColumns(searchParams: ComparePageProps['searchParams']): Promise<Columns> {
  const params = await searchParams;
  const a = nameParam(params, FIRST_COLUMN_PARAM);
  const b = nameParam(params, SECOND_COLUMN_PARAM);

  // Only a bare /compare is worth indexing; a URL naming any planet is one state of a tool.
  const indexable = params[FIRST_COLUMN_PARAM] === undefined && params[SECOND_COLUMN_PARAM] === undefined;

  // The same planet twice is one planet, so the second pick reads as not yet made.
  const [columnA, columnB] = await Promise.all([loadColumn(a), loadColumn(b === a ? null : b)]);
  return { a: columnA, b: columnB, indexable };
}

function resolvedPair({ a, b }: Columns): [Planet, Planet] | null {
  return a.found !== null && b.found !== null ? [a.found.planet, b.found.planet] : null;
}

function compareMetadata(columns: Columns): Metadata {
  const pair = resolvedPair(columns);
  if (pair !== null) {
    const [planetA, planetB] = pair;
    return {
      title: `${planetA.pl_name} vs ${planetB.pl_name} — Compare planets | ${SITE_NAME}`,
      description: comparePlanets(planetA, planetB).verdict.summary,
    };
  }

  const found = columns.a.found ?? columns.b.found;
  if (found === null) return COMPARE_METADATA;

  return {
    title: `Compare ${found.planet.pl_name} with another planet | ${SITE_NAME}`,
    description: `Pick a second planet to compare with ${found.planet.pl_name}`,
  };
}

// Both lookups are cache()d, so titling the page and rendering it share the same reads.
export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const columns = await loadColumns(searchParams);
  const metadata = compareMetadata(columns);
  return columns.indexable ? metadata : { ...metadata, robots: { index: false } };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const columns = await loadColumns(searchParams);
  const pair = resolvedPair(columns);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Compare planets</h1>
        {pair !== null && (
          <p className={styles.verdict}>{comparePlanets(...pair).verdict.headline}</p>
        )}
        <ColumnStrip {...columns} />
        {pair === null && (
          <p className={styles.lede}>{invitation(columns.a.found ?? columns.b.found)}</p>
        )}
      </div>
    </main>
  );
}

function ColumnStrip({ a, b }: Columns) {
  return (
    <div className={styles.strip}>
      <ColumnIdentity column={a} slot="first" changeHref={compareUrl(null, b.name)} />
      {a.name !== null && b.name !== null && (
        <Link className={styles.swap} href={compareUrl(b.name, a.name)}>
          Swap
        </Link>
      )}
      <ColumnIdentity column={b} slot="second" changeHref={compareUrl(a.name, null)} />
    </div>
  );
}

function ColumnIdentity({
  column: { name, found },
  slot,
  changeHref,
}: {
  column: Column;
  slot: Slot;
  changeHref: string;
}) {
  return found === null ? (
    <EmptySlot slot={slot} unknownName={name} />
  ) : (
    <ColumnCard found={found} changeHref={changeHref} />
  );
}

function invitation(found: FoundPlanet | null): string {
  return found === null
    ? 'Pick two planets to put side by side'
    : `Pick a second planet to compare with ${found.planet.pl_name}`;
}
