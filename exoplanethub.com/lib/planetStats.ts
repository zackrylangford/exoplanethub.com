import type { Planet, PlanetSummary } from '@/lib/mockPlanets';
import { starBandOf } from '@/lib/starBands';

// Ids rather than labels, because "Radius" and "Mass" name both a planet stat and a star stat.
type NumericStatKey = keyof Pick<
  Planet,
  | 'pl_rade'
  | 'pl_bmasse'
  | 'pl_dens'
  | 'pl_eqt'
  | 'pl_insol'
  | 'pl_orbper'
  | 'pl_orbsmax'
  | 'st_teff'
  | 'st_rad'
  | 'st_mass'
  | 'st_age'
  | 'sy_dist'
  | 'sy_snum'
  | 'sy_pnum'
  | 'disc_year'
>;

type TextStatKey = keyof Pick<Planet, 'hostname' | 'discoverymethod' | 'disc_facility'>;

export type StatKey = NumericStatKey | TextStatKey | 'spectral_class';

export interface PlanetStat {
  id: StatKey;
  label: string;
  value: string | null;
  // The stored column in the archive's own unit (parsecs, kelvin), whatever unit `value` displays.
  measure: number | null;
}

export type SectionId = 'planet' | 'star' | 'system' | 'discovery';

export interface PlanetStatSection {
  id: SectionId;
  title: string;
  stats: PlanetStat[];
}

const LIGHT_YEARS_PER_PARSEC = 3.26156;

// Pinned locale so a value reads identically wherever the page is rendered or cached.
const NUMBER = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 4 });

// The stored item is only a claim that a field is a number; a corrupt row must read as
// unknown rather than render NaN.
function isMeasured(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function measurement(value: number | null, unit: string): string | null {
  return isMeasured(value) ? `${NUMBER.format(value)} ${unit}` : null;
}

// Years and counts are exact, so grouping separators would misread them as quantities.
function exact(value: number | null): string | null {
  return isMeasured(value) ? String(value) : null;
}

function text(value: string | null): string | null {
  return value !== null && value.trim() !== '' ? value : null;
}

function lightYearsFrom(parsecs: number): number {
  return parsecs * LIGHT_YEARS_PER_PARSEC;
}

function distanceFromEarth(parsecs: number | null): string | null {
  if (!isMeasured(parsecs)) return null;

  const lightYears = NUMBER.format(lightYearsFrom(parsecs));
  return `${lightYears} light-years (${NUMBER.format(parsecs)} parsecs)`;
}

function spectralClass(starTemperature: number | null): string | null {
  return starBandOf(starTemperature)?.label ?? null;
}

// Reading the column by id is what keeps `measure` and `value` from ever describing different fields.
function numeric<K extends NumericStatKey>(
  planet: Pick<Planet, K>,
  id: K,
  label: string,
  format: (value: number | null) => string | null
): PlanetStat {
  const value = planet[id];
  return { id, label, value: format(value), measure: isMeasured(value) ? value : null };
}

function measured<K extends NumericStatKey>(
  planet: Pick<Planet, K>,
  id: K,
  label: string,
  unit: string
): PlanetStat {
  return numeric(planet, id, label, (value) => measurement(value, unit));
}

function textual<K extends TextStatKey>(planet: Pick<Planet, K>, id: K, label: string): PlanetStat {
  return { id, label, value: text(planet[id]), measure: null };
}

function highlight(value: number | null, phrase: (amount: string) => string): string | null {
  return isMeasured(value) ? phrase(NUMBER.format(value)) : null;
}

export function lightYearsAway(parsecs: number | null): string | null {
  return isMeasured(parsecs) ? `${NUMBER.format(lightYearsFrom(parsecs))} light-years away` : null;
}

export function discoveredIn(year: number | null): string | null {
  return isMeasured(year) ? `Discovered in ${year}` : null;
}

// Same numbers as the sections below, so a link preview can never quote a figure the page contradicts.
export function planetHighlights(planet: Planet): string[] {
  return [
    highlight(planet.pl_rade, (radius) => `${radius}× Earth's radius`),
    highlight(planet.pl_orbper, (days) => `${days}-day orbit`),
    lightYearsAway(planet.sy_dist),
  ].filter((phrase): phrase is string => phrase !== null);
}

// Shares the section formatters so the quick look cannot round a field differently from the page it links to.
export function planetKeyStats(planet: PlanetSummary): PlanetStat[] {
  return [
    measured(planet, 'sy_dist', 'Distance', 'parsecs'),
    measured(planet, 'pl_rade', 'Radius', '× Earth'),
    measured(planet, 'pl_bmasse', 'Mass', '× Earth'),
    measured(planet, 'pl_eqt', 'Temperature', 'K'),
    numeric(planet, 'disc_year', 'Discovered', exact),
    textual(planet, 'discoverymethod', 'Detection Method'),
  ];
}

export function planetStatSections(planet: Planet): PlanetStatSection[] {
  return [
    {
      id: 'planet',
      title: 'Planet',
      stats: [
        measured(planet, 'pl_rade', 'Radius', '× Earth'),
        measured(planet, 'pl_bmasse', 'Mass', '× Earth'),
        measured(planet, 'pl_dens', 'Density', 'g/cm³'),
        measured(planet, 'pl_eqt', 'Equilibrium temperature', 'K'),
        measured(planet, 'pl_insol', 'Starlight received', '× Earth'),
        measured(planet, 'pl_orbper', 'Orbital period', 'days'),
        measured(planet, 'pl_orbsmax', 'Average distance from its star', 'AU'),
      ],
    },
    {
      id: 'star',
      title: 'Star',
      stats: [
        textual(planet, 'hostname', 'Host star'),
        {
          id: 'spectral_class',
          label: 'Spectral class',
          value: spectralClass(planet.st_teff),
          measure: null,
        },
        measured(planet, 'st_teff', 'Surface temperature', 'K'),
        measured(planet, 'st_rad', 'Radius', '× Sun'),
        measured(planet, 'st_mass', 'Mass', '× Sun'),
        measured(planet, 'st_age', 'Age', 'billion years'),
      ],
    },
    {
      id: 'system',
      title: 'System',
      stats: [
        numeric(planet, 'sy_dist', 'Distance from Earth', distanceFromEarth),
        numeric(planet, 'sy_snum', 'Stars in system', exact),
        numeric(planet, 'sy_pnum', 'Known planets', exact),
      ],
    },
    {
      id: 'discovery',
      title: 'Discovery',
      stats: [
        numeric(planet, 'disc_year', 'Year', exact),
        textual(planet, 'discoverymethod', 'Method'),
        textual(planet, 'disc_facility', 'Facility'),
      ],
    },
  ];
}
