import { describe, expect, it } from 'vitest';
import type { Planet } from '@/lib/mockPlanets';
import {
  comparePlanets,
  type ComparisonRow,
  type ComparisonSection,
  type PlanetComparison,
} from '@/lib/planetComparison';
import type { SectionId, StatKey } from '@/lib/planetStats';

// Digit-free names, so a headline that quotes a number cannot hide behind "Kepler-452 b".
const ALPHA: Planet = {
  pl_name: 'Alpha b',
  hostname: null,
  sy_snum: null,
  sy_pnum: null,
  sy_dist: null,
  discoverymethod: null,
  disc_year: null,
  disc_facility: null,
  pl_orbper: null,
  pl_orbsmax: null,
  pl_rade: null,
  pl_bmasse: null,
  pl_dens: null,
  pl_eqt: null,
  pl_insol: null,
  st_teff: null,
  st_rad: null,
  st_mass: null,
  st_logg: null,
  st_age: null,
  last_updated: '2026-08-30T06:00:00Z',
};

const BETA: Planet = { ...ALPHA, pl_name: 'Beta c' };

const EARTHLIKE: Partial<Planet> = { pl_rade: 1, pl_bmasse: 1, pl_eqt: 288 };

const TRAPPIST: Partial<Planet> = { hostname: 'TRAPPIST-1', st_teff: 2566, sy_pnum: 7 };

const NO_DATA = 'Neither planet has data for this section';

function compare(a: Partial<Planet>, b: Partial<Planet>): PlanetComparison {
  return comparePlanets({ ...ALPHA, ...a }, { ...BETA, ...b });
}

function sectionIds(comparison: PlanetComparison): SectionId[] {
  return comparison.sections.map((section) => section.id);
}

function sectionOf(comparison: PlanetComparison, id: SectionId): ComparisonSection {
  const section = comparison.sections.find((candidate) => candidate.id === id);
  if (!section) throw new Error(`No section "${id}"`);
  return section;
}

function rowOf(comparison: PlanetComparison, id: StatKey): ComparisonRow {
  const row = comparison.sections.flatMap((section) => section.rows).find((candidate) => candidate.id === id);
  if (!row) throw new Error(`No row "${id}"`);
  return row;
}

function notesOn(row: ComparisonRow): [string | null, string | null] {
  return [row.a.note, row.b.note];
}

function ratioNotes(id: StatKey, a: number, b: number): [string | null, string | null] {
  return notesOn(rowOf(comparePlanets({ ...ALPHA, [id]: a }, { ...BETA, [id]: b }), id));
}

describe('comparePlanets rows', () => {
  it('zips the two registries by stat id, keeping section and row order', () => {
    const comparison = compare(
      { pl_rade: 1.63, st_teff: 5757, sy_dist: 12.5, disc_year: 2015 },
      { pl_bmasse: 5, st_rad: 1.1, sy_pnum: 3, disc_facility: 'Kepler' }
    );

    expect(sectionIds(comparison)).toEqual(['planet', 'star', 'system', 'discovery']);
    expect(comparison.sections.map((section) => section.rows.map((row) => row.id))).toEqual([
      ['pl_rade', 'pl_bmasse'],
      ['spectral_class', 'st_teff', 'st_rad'],
      ['sy_dist', 'sy_pnum'],
      ['disc_year', 'disc_facility'],
    ]);
  });

  it('titles each section as the registry does', () => {
    expect(compare({}, {}).sections.map((section) => section.title)).toEqual([
      'Planet',
      'Star',
      'System',
      'Discovery',
    ]);
  });

  it('passes each value through as the registry formats it, null where the archive has none', () => {
    const row = rowOf(compare({ pl_rade: 1.63 }, {}), 'pl_rade');

    expect(row.label).toBe('Radius');
    expect(row.a.value).toBe('1.63 × Earth');
    expect(row.b.value).toBeNull();
  });

  it('carries text stats side by side', () => {
    const row = rowOf(
      compare({ discoverymethod: 'Transit' }, { discoverymethod: 'Radial Velocity' }),
      'discoverymethod'
    );

    expect([row.a.value, row.b.value]).toEqual(['Transit', 'Radial Velocity']);
  });

  it('drops a row neither planet has a value for', () => {
    const planetSection = sectionOf(compare({ pl_rade: 1.63 }, { pl_rade: 2 }), 'planet');

    expect(planetSection.rows.map((row) => row.id)).toEqual(['pl_rade']);
  });

  it('keeps a stored zero as a value, since the registry renders it', () => {
    expect(rowOf(compare({ pl_insol: 0 }, {}), 'pl_insol').a.value).toBe('0 × Earth');
  });

  it('notes a section left with no rows and leaves a section with rows unnoted', () => {
    const comparison = compare({ pl_rade: 1.63 }, {});

    expect(sectionOf(comparison, 'planet').note).toBeNull();
    expect(sectionOf(comparison, 'discovery')).toEqual({
      id: 'discovery',
      title: 'Discovery',
      rows: [],
      note: NO_DATA,
    });
  });

  it('emits every section for two name-only planets, each noted rather than dropped', () => {
    const comparison = compare({}, {});

    expect(sectionIds(comparison)).toEqual(['planet', 'star', 'system', 'discovery']);
    for (const section of comparison.sections) {
      expect(section.rows).toEqual([]);
      expect(section.note).toBe(NO_DATA);
    }
  });
});

describe('comparePlanets ratio notes', () => {
  it('notes the larger side with the multiple and the comparative, and nothing on the smaller', () => {
    expect(ratioNotes('pl_rade', 1.8, 1)).toEqual(['1.8× wider', null]);
    expect(ratioNotes('pl_orbper', 365, 4380)).toEqual([null, '12× longer year']);
  });

  it('rounds like the Earth comparisons: whole numbers from 10 up, two significant digits below', () => {
    expect(ratioNotes('pl_orbper', 267, 1)).toEqual(['267× longer year', null]);
    expect(ratioNotes('pl_bmasse', 2.345, 1)).toEqual(['2.3× heavier', null]);
  });

  const COMPARATIVES: [StatKey, string][] = [
    ['pl_rade', 'wider'],
    ['pl_bmasse', 'heavier'],
    ['pl_dens', 'denser'],
    ['pl_eqt', 'hotter'],
    ['pl_insol', 'more starlight'],
    ['pl_orbper', 'longer year'],
    ['pl_orbsmax', 'farther from its star'],
    ['st_teff', 'hotter star'],
    ['st_rad', 'larger star'],
    ['st_mass', 'heavier star'],
    ['st_age', 'older star'],
    ['sy_dist', 'farther from Earth'],
  ];

  it.each(COMPARATIVES)('says %s in words: "2× %s"', (id, comparative) => {
    expect(ratioNotes(id, 2, 1)).toEqual([`2× ${comparative}`, null]);
  });

  it('reads a ratio that rounds to 1 as "About the same", on the larger side', () => {
    expect(ratioNotes('pl_bmasse', 1.02, 1)).toEqual(['About the same', null]);
    expect(ratioNotes('pl_bmasse', 1, 1.02)).toEqual([null, 'About the same']);
  });

  it("puts an exact tie's note on a's side", () => {
    expect(ratioNotes('pl_bmasse', 1, 1)).toEqual(['About the same', null]);
  });

  it.each(['sy_snum', 'sy_pnum', 'disc_year'] as const)('leaves %s, a count or year, without a note', (id) => {
    expect(ratioNotes(id, 5, 2)).toEqual([null, null]);
  });

  it('leaves text rows without a note, while the number behind the spectral class still gets one', () => {
    const comparison = compare(
      { hostname: 'Kepler-A', st_teff: 5757, discoverymethod: 'Transit', disc_facility: 'Kepler' },
      { hostname: 'Kepler-B', st_teff: 3000, discoverymethod: 'Imaging', disc_facility: 'Gemini' }
    );

    for (const id of ['hostname', 'spectral_class', 'discoverymethod', 'disc_facility'] as const) {
      expect(notesOn(rowOf(comparison, id))).toEqual([null, null]);
    }
    expect(notesOn(rowOf(comparison, 'st_teff'))).toEqual(['1.9× hotter star', null]);
  });

  it('gives no note when one side is unmeasured', () => {
    expect(notesOn(rowOf(compare({ pl_rade: 2 }, {}), 'pl_rade'))).toEqual([null, null]);
  });

  it('gives no note against a stored zero or negative, which is not a measurement', () => {
    expect(ratioNotes('pl_insol', 0, 1)).toEqual([null, null]);
    expect(ratioNotes('pl_eqt', 300, -5)).toEqual([null, null]);
  });
});

describe('comparePlanets same host', () => {
  it('collapses Star into one line and leaves System out when both orbit the same named star', () => {
    const comparison = compare({ ...TRAPPIST, sy_dist: 12.5 }, TRAPPIST);

    expect(sectionIds(comparison)).toEqual(['planet', 'star', 'discovery']);
    expect(sectionOf(comparison, 'star')).toEqual({
      id: 'star',
      title: 'Star',
      rows: [],
      note: 'Both orbit TRAPPIST-1 — same star, same system, 40.77 light-years away',
    });
  });

  it("quotes a's distance when both are measured, b's only when a's is not", () => {
    expect(sectionOf(compare({ ...TRAPPIST, sy_dist: 12.5 }, { ...TRAPPIST, sy_dist: 20 }), 'star').note).toBe(
      'Both orbit TRAPPIST-1 — same star, same system, 40.77 light-years away'
    );

    expect(sectionOf(compare(TRAPPIST, { ...TRAPPIST, sy_dist: 12.5 }), 'star').note).toBe(
      'Both orbit TRAPPIST-1 — same star, same system, 40.77 light-years away'
    );
  });

  it('ends the line at "same system" when neither planet has a distance', () => {
    expect(sectionOf(compare(TRAPPIST, TRAPPIST), 'star').note).toBe(
      'Both orbit TRAPPIST-1 — same star, same system'
    );
  });

  it('still compares the Planet and Discovery sections', () => {
    const comparison = compare({ ...TRAPPIST, pl_rade: 2, disc_year: 2017 }, { ...TRAPPIST, pl_rade: 1 });

    expect(notesOn(rowOf(comparison, 'pl_rade'))).toEqual(['2× wider', null]);
    expect(rowOf(comparison, 'disc_year').a.value).toBe('2017');
  });

  it('does not collapse two planets that merely both lack a host name', () => {
    const comparison = compare({ st_teff: 2566, sy_pnum: 7 }, { st_teff: 2566, sy_pnum: 7 });

    expect(sectionIds(comparison)).toEqual(['planet', 'star', 'system', 'discovery']);
    expect(sectionOf(comparison, 'star').note).toBeNull();
    expect(sectionOf(comparison, 'star').rows.map((row) => row.id)).toEqual(['spectral_class', 'st_teff']);
  });

  it("inherits the registry's blank-host rule, so two whitespace hosts are not the same star", () => {
    expect(sectionIds(compare({ hostname: '  ' }, { hostname: '  ' }))).toContain('system');
  });

  it('does not collapse different hosts', () => {
    const comparison = compare({ hostname: 'Kepler-452' }, { hostname: 'Kepler-186' });

    expect(sectionIds(comparison)).toContain('system');
    expect(rowOf(comparison, 'hostname').b.value).toBe('Kepler-186');
  });
});

describe('comparePlanets verdict', () => {
  it("names the higher-scored planet as closer to Earth's conditions, then both scores with their bands", () => {
    const { verdict } = compare({ ...EARTHLIKE, esi: 83 }, { ...EARTHLIKE, esi: 61 });

    expect(verdict.headline).toBe("Alpha b is closer to Earth's conditions than Beta c");
    expect(verdict.summary).toBe(
      "Alpha b is closer to Earth's conditions than Beta c — ESI 83 · Good similarity vs ESI 61 · Moderate similarity"
    );
  });

  it('leads with b when b scores higher, and orders the scores the same way', () => {
    const { verdict } = compare({ ...EARTHLIKE, esi: 61 }, { ...EARTHLIKE, esi: 83 });

    expect(verdict.headline).toBe("Beta c is closer to Earth's conditions than Alpha b");
    expect(verdict.summary).toBe(
      "Beta c is closer to Earth's conditions than Alpha b — ESI 83 · Good similarity vs ESI 61 · Moderate similarity"
    );
  });

  it('reads "closer" for 83 against 82 though both share a band, leaving the numbers to the summary', () => {
    const { verdict } = compare({ ...EARTHLIKE, esi: 83 }, { ...EARTHLIKE, esi: 82 });

    expect(verdict.headline).toBe("Alpha b is closer to Earth's conditions than Beta c");
    expect(verdict.summary).toContain('ESI 83 · Good similarity vs ESI 82 · Good similarity');
  });

  it('calls the two equally close only when the stored scores are identical', () => {
    const { verdict } = compare({ ...EARTHLIKE, esi: 83 }, { ...EARTHLIKE, esi: 83 });

    expect(verdict.headline).toBe("Alpha b and Beta c are equally close to Earth's conditions");
    expect(verdict.summary).toBe(
      "Alpha b and Beta c are equally close to Earth's conditions — ESI 83 · Good similarity vs ESI 83 · Good similarity"
    );
  });

  it('trusts the stored score rather than recomputing it from the inputs', () => {
    expect(compare({ esi: 50 }, { esi: 40 }).verdict.headline).toBe(
      "Alpha b is closer to Earth's conditions than Beta c"
    );
  });

  it('scores only the planet with a score and names the input the other lacks', () => {
    const { verdict } = compare({ ...EARTHLIKE, esi: 83 }, { pl_rade: 1, pl_eqt: 288 });

    expect(verdict.headline).toBe('Only Alpha b can be scored: Beta c has no measured mass');
    expect(verdict.summary).toBe(
      'Only Alpha b can be scored: Beta c has no measured mass — ESI 83 · Good similarity'
    );
  });

  it('reports a stored 0 K temperature as missing rather than passing a null check', () => {
    const { verdict } = compare({ pl_rade: 1, pl_bmasse: 1, pl_eqt: 0 }, { ...EARTHLIKE, esi: 83 });

    expect(verdict.headline).toBe('Only Beta c can be scored: Alpha b has no measured temperature');
  });

  it('lists every input an unscored planet lacks', () => {
    expect(compare({ ...EARTHLIKE, esi: 83 }, {}).verdict.headline).toBe(
      'Only Alpha b can be scored: Beta c has no measured radius, mass, or temperature'
    );
  });

  it("names each planet's missing inputs when neither is scored, with no scores to add", () => {
    const { verdict } = compare({ pl_rade: 1, pl_eqt: 288 }, { pl_bmasse: 1 });

    expect(verdict.headline).toBe(
      'Neither planet can be scored: Alpha b has no measured mass, and Beta c has no measured radius or temperature'
    );
    expect(verdict.summary).toBe(verdict.headline);
  });

  it.each<[Partial<Planet>, Partial<Planet>]>([
    [{ ...EARTHLIKE, esi: 83 }, { ...EARTHLIKE, esi: 61 }],
    [{ ...EARTHLIKE, esi: 83 }, { ...EARTHLIKE, esi: 83 }],
    [{ ...EARTHLIKE, esi: 83 }, {}],
    [{}, {}],
  ])('keeps numbers out of the headline and "habitable" out of both lines (%o vs %o)', (a, b) => {
    const { verdict } = compare(a, b);

    expect(verdict.headline).not.toMatch(/\d/);
    expect(verdict.headline).not.toContain('habitable');
    expect(verdict.summary).not.toContain('habitable');
  });
});
