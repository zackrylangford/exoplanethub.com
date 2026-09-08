import { amount, isComparable } from '@/lib/earthComparison';
import { esiScoreText } from '@/lib/esiBands';
import type { Planet } from '@/lib/mockPlanets';
import {
  lightYearsAway,
  planetStatSections,
  type PlanetStat,
  type PlanetStatSection,
  type StatKey,
} from '@/lib/planetStats';

export interface Cell {
  value: string | null;
  note: string | null;
}

export interface ComparisonRow {
  id: StatKey;
  label: string;
  a: Cell;
  b: Cell;
}

export interface ComparisonSection {
  id: string;
  title: string;
  rows: ComparisonRow[];
  note: string | null;
}

export interface Verdict {
  headline: string;
  summary: string;
}

export interface PlanetComparison {
  sections: ComparisonSection[];
  verdict: Verdict;
}

// Typed off StatKey so a stat added to the registry must choose its word (or null) before it can render.
const COMPARATIVES: Record<StatKey, string | null> = {
  pl_rade: 'wider',
  pl_bmasse: 'heavier',
  pl_dens: 'denser',
  pl_eqt: 'hotter',
  pl_insol: 'more starlight',
  pl_orbper: 'longer year',
  pl_orbsmax: 'farther from its star',
  hostname: null,
  spectral_class: null,
  st_teff: 'hotter star',
  st_rad: 'larger star',
  st_mass: 'heavier star',
  st_age: 'older star',
  sy_dist: 'farther from Earth',
  sy_snum: null,
  sy_pnum: null,
  disc_year: null,
  discoverymethod: null,
  disc_facility: null,
};

// The inputs compute_esi (aws-backend/lambda/sync/esi.py) needs, under its same finite-and-positive rule.
const ESI_INPUTS = [
  ['pl_rade', 'radius'],
  ['pl_bmasse', 'mass'],
  ['pl_eqt', 'temperature'],
] as const;

const STAR_SECTION = 'star';
const SYSTEM_SECTION = 'system';
const NO_MEASURED_DATA = 'Neither planet has measured data for this section';

// Pinned locale so the verdict reads identically wherever the page is rendered or cached.
const MISSING_INPUTS = new Intl.ListFormat('en-US', { type: 'disjunction' });

type ScoredPlanet = Planet & { esi: number };

function isScored(planet: Planet): planet is ScoredPlanet {
  return typeof planet.esi === 'number';
}

function hasNoMeasured(planet: Planet): string {
  const missing = ESI_INPUTS.filter(([id]) => !isComparable(planet[id])).map(([, input]) => input);
  return `${planet.pl_name} has no measured ${MISSING_INPUTS.format(missing)}`;
}

interface Judgement {
  headline: string;
  scored: ScoredPlanet[];
}

function onlyScored(scored: ScoredPlanet, other: Planet): Judgement {
  return { headline: `Only ${scored.pl_name} can be scored: ${hasNoMeasured(other)}`, scored: [scored] };
}

function judge(a: Planet, b: Planet): Judgement {
  if (isScored(a) && isScored(b)) {
    if (a.esi === b.esi) {
      return {
        headline: `${a.pl_name} and ${b.pl_name} are equally close to Earth's conditions`,
        scored: [a, b],
      };
    }

    const [closer, farther] = a.esi > b.esi ? [a, b] : [b, a];
    return {
      headline: `${closer.pl_name} is closer to Earth's conditions than ${farther.pl_name}`,
      scored: [closer, farther],
    };
  }

  if (isScored(a)) return onlyScored(a, b);
  if (isScored(b)) return onlyScored(b, a);

  return {
    headline: `Neither planet can be scored: ${hasNoMeasured(a)}, and ${hasNoMeasured(b)}`,
    scored: [],
  };
}

// The summary lists the scores in the order the headline names the planets, so "X is closer" is followed by X's score.
function esiVerdict(a: Planet, b: Planet): Verdict {
  const { headline, scored } = judge(a, b);
  const scores = scored.map((planet) => esiScoreText(planet.esi)).join(' vs ');
  return { headline, summary: scores === '' ? headline : `${headline} — ${scores}` };
}

function ratioNotes(a: PlanetStat, b: PlanetStat): [string | null, string | null] {
  const comparative = COMPARATIVES[a.id];
  if (comparative === null || !isComparable(a.measure) || !isComparable(b.measure)) return [null, null];

  // >= so an exact tie's "About the same" lands on a's side.
  const aIsLarger = a.measure >= b.measure;
  const multiple = amount(aIsLarger ? a.measure / b.measure : b.measure / a.measure);
  const note = multiple === '1' ? 'About the same' : `${multiple}× ${comparative}`;
  return aIsLarger ? [note, null] : [null, note];
}

function row(a: PlanetStat, b: PlanetStat): ComparisonRow {
  const [noteA, noteB] = ratioNotes(a, b);
  return { id: a.id, label: a.label, a: { value: a.value, note: noteA }, b: { value: b.value, note: noteB } };
}

type StatsById = Map<StatKey, PlanetStat>;

function statsById(sections: PlanetStatSection[]): StatsById {
  return new Map(sections.flatMap((section) => section.stats).map((stat): [StatKey, PlanetStat] => [stat.id, stat]));
}

function comparedSection(section: PlanetStatSection, statsB: StatsById): ComparisonSection {
  const rows = section.stats.flatMap((statA): ComparisonRow[] => {
    const statB = statsB.get(statA.id);
    if (statB === undefined || (statA.value === null && statB.value === null)) return [];
    return [row(statA, statB)];
  });

  return { id: section.id, title: section.title, rows, note: rows.length === 0 ? NO_MEASURED_DATA : null };
}

function hostNameOf(stats: StatsById): string | null {
  return stats.get('hostname')?.value ?? null;
}

// Yields the shared name itself, so two null hosts come out as no shared star rather than a match.
function sharedHost(statsA: StatsById, statsB: StatsById): string | null {
  const host = hostNameOf(statsA);
  return host === hostNameOf(statsB) ? host : null;
}

function sameSystemLine(host: string, a: Planet, b: Planet): string {
  const distance = lightYearsAway(a.sy_dist) ?? lightYearsAway(b.sy_dist);
  return `Both orbit ${host} — same star, same system${distance === null ? '' : `, ${distance}`}`;
}

export function comparePlanets(a: Planet, b: Planet): PlanetComparison {
  const sectionsA = planetStatSections(a);
  const statsB = statsById(planetStatSections(b));
  const host = sharedHost(statsById(sectionsA), statsB);

  const sections = sectionsA.flatMap((section): ComparisonSection[] => {
    if (host === null) return [comparedSection(section, statsB)];
    if (section.id === SYSTEM_SECTION) return [];
    if (section.id === STAR_SECTION) {
      return [{ id: section.id, title: section.title, rows: [], note: sameSystemLine(host, a, b) }];
    }
    return [comparedSection(section, statsB)];
  });

  return { sections, verdict: esiVerdict(a, b) };
}
