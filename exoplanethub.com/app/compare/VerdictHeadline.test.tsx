import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Planet } from '@/lib/mockPlanets';
import { comparePlanets } from '@/lib/planetComparison';
import VerdictHeadline from './VerdictHeadline';

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

function renderVerdict(a: Partial<Planet>, b: Partial<Planet>): HTMLElement {
  const { verdict } = comparePlanets({ ...ALPHA, ...a }, { ...BETA, ...b });
  render(<VerdictHeadline verdict={verdict} />);
  return screen.getByText(verdict.headline);
}

describe('VerdictHeadline', () => {
  it('is a paragraph, not a heading, so the outline stays the page then its two planets', () => {
    const headline = renderVerdict({ ...EARTHLIKE, esi: 83 }, { ...EARTHLIKE, esi: 61 });

    expect(headline.tagName).toBe('P');
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('names the closer planet when both are scored, quoting no number', () => {
    const headline = renderVerdict({ ...EARTHLIKE, esi: 61 }, { ...EARTHLIKE, esi: 83 });

    expect(headline).toHaveTextContent("Beta c is closer to Earth's conditions than Alpha b");
    expect(headline.textContent).not.toMatch(/\d/);
    expect(headline.textContent).not.toMatch(/habitable/i);
  });

  it('calls identical scores equally close', () => {
    const headline = renderVerdict({ ...EARTHLIKE, esi: 83 }, { ...EARTHLIKE, esi: 83 });

    expect(headline).toHaveTextContent("Alpha b and Beta c are equally close to Earth's conditions");
  });

  it('explains a lone score by the input the other planet lacks', () => {
    const headline = renderVerdict({ ...EARTHLIKE, esi: 83 }, { ...EARTHLIKE, pl_bmasse: null });

    expect(headline).toHaveTextContent('Only Alpha b can be scored: Beta c has no measured mass');
  });

  it("names each planet's missing inputs when neither is scored", () => {
    const headline = renderVerdict({ ...EARTHLIKE, pl_bmasse: null }, { ...EARTHLIKE, pl_eqt: null });

    expect(headline).toHaveTextContent(
      'Neither planet can be scored: Alpha b has no measured mass, and Beta c has no measured temperature'
    );
  });
});
