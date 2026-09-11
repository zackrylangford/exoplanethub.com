import type { Metadata } from 'next';
import Link from 'next/link';
import { comparePlanets, type PlanetComparison } from '@/lib/planetComparison';
import { findPlanet, type FoundPlanet } from '@/lib/planetDetail';
import {
  compareUrl,
  FIRST_COLUMN_PARAM,
  planetNameFromParam,
  SECOND_COLUMN_PARAM,
} from '@/lib/planetUrl';
import { SITE_NAME } from '@/lib/site';
import ColumnCard from './ColumnCard';
import ComparisonTable, { type ColumnNames } from './ComparisonTable';
import EmptySlot from './EmptySlot';
import { type Slot } from './PlanetPicker';
import VerdictHeadline from './VerdictHeadline';
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
}

interface CompareRequest {
  columns: Columns;
  indexable: boolean;
}

// Both columns resolved: the names that head the table and the comparison beneath them.
interface ResolvedPair {
  names: ColumnNames;
  comparison: PlanetComparison;
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

async function loadRequest(searchParams: ComparePageProps['searchParams']): Promise<CompareRequest> {
  const params = await searchParams;
  const a = nameParam(params, FIRST_COLUMN_PARAM);
  const b = nameParam(params, SECOND_COLUMN_PARAM);

  // Only a bare /compare is worth indexing; a URL naming any planet is one state of a tool.
  const indexable = params[FIRST_COLUMN_PARAM] === undefined && params[SECOND_COLUMN_PARAM] === undefined;

  // The same planet twice is one planet, so the second pick reads as not yet made.
  const [columnA, columnB] = await Promise.all([loadColumn(a), loadColumn(b === a ? null : b)]);
  return { columns: { a: columnA, b: columnB }, indexable };
}

function resolvedPair({ a, b }: Columns): ResolvedPair | null {
  if (a.found === null || b.found === null) return null;

  const { planet: planetA } = a.found;
  const { planet: planetB } = b.found;
  return {
    names: { a: planetA.pl_name, b: planetB.pl_name },
    comparison: comparePlanets(planetA, planetB),
  };
}

function secondPickInvitation(planetName: string): string {
  return `Pick a second planet to compare with ${planetName}`;
}

function compareMetadata(columns: Columns): Metadata {
  const pair = resolvedPair(columns);
  if (pair !== null) {
    return {
      title: `${pair.names.a} vs ${pair.names.b} — Compare planets | ${SITE_NAME}`,
      description: pair.comparison.verdict.summary,
    };
  }

  const found = columns.a.found ?? columns.b.found;
  if (found === null) return COMPARE_METADATA;

  return {
    title: `Compare ${found.planet.pl_name} with another planet | ${SITE_NAME}`,
    description: secondPickInvitation(found.planet.pl_name),
  };
}

// Both lookups are cache()d, so titling the page and rendering it share the same reads.
export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const { columns, indexable } = await loadRequest(searchParams);
  const metadata = compareMetadata(columns);
  return indexable ? metadata : { ...metadata, robots: { index: false } };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { columns } = await loadRequest(searchParams);
  const pair = resolvedPair(columns);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Compare planets</h1>
        {pair !== null && <VerdictHeadline verdict={pair.comparison.verdict} />}
        <ColumnStrip {...columns} />
        {pair === null ? (
          <p className={styles.lede}>{invitation(columns.a.found ?? columns.b.found)}</p>
        ) : (
          <ComparisonTable sections={pair.comparison.sections} names={pair.names} />
        )}
      </div>
    </main>
  );
}

function ColumnStrip({ a, b }: Columns) {
  return (
    <div className={styles.strip}>
      <ColumnIdentity column={a} other={b} slot="first" changeHref={compareUrl(null, b.name)} />
      {a.name !== null && b.name !== null && (
        <Link className={styles.swap} href={compareUrl(b.name, a.name)}>
          Swap
        </Link>
      )}
      <ColumnIdentity column={b} other={a} slot="second" changeHref={compareUrl(a.name, null)} />
    </div>
  );
}

function ColumnIdentity({
  column: { name, found },
  other,
  slot,
  changeHref,
}: {
  column: Column;
  other: Column;
  slot: Slot;
  changeHref: string;
}) {
  return found === null ? (
    <EmptySlot
      slot={slot}
      unknownName={name}
      otherName={other.name}
      excludedPlanetName={other.found?.planet.pl_name ?? null}
    />
  ) : (
    <ColumnCard found={found} changeHref={changeHref} />
  );
}

function invitation(found: FoundPlanet | null): string {
  return found === null
    ? 'Pick two planets to put side by side'
    : secondPickInvitation(found.planet.pl_name);
}
