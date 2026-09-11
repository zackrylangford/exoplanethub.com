import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getESIBand } from '@/lib/esiBands';
import type { Planet } from '@/lib/mockPlanets';
import ColumnCard from './ColumnCard';

const KEPLER_452B: Planet = {
  pl_name: 'Kepler-452 b',
  hostname: 'Kepler-452',
  sy_snum: 1,
  sy_pnum: 1,
  sy_dist: 551.7,
  discoverymethod: 'Transit',
  disc_year: 2015,
  disc_facility: 'Kepler',
  pl_orbper: 384.843,
  pl_orbsmax: 1.046,
  pl_rade: 1.63,
  pl_bmasse: null,
  pl_dens: null,
  pl_eqt: 265,
  pl_insol: 1.1,
  st_teff: 5757,
  st_rad: 1.11,
  st_mass: 1.04,
  st_logg: null,
  st_age: 6,
  last_updated: '2026-08-30T06:00:00Z',
  esi: 83,
};

const CHANGE_HREF = '/compare?b=TRAPPIST-1%20e';

function renderLive(planet: Planet = KEPLER_452B) {
  render(<ColumnCard found={{ planet, removedAt: null }} changeHref={CHANGE_HREF} />);
}

describe('ColumnCard', () => {
  it('names the planet in a second-level heading that links to its page', () => {
    renderLive();

    const heading = screen.getByRole('heading', { level: 2, name: 'Kepler-452 b' });
    expect(within(heading).getByRole('link')).toHaveAttribute('href', '/planet/Kepler-452%20b');
  });

  it('carries the ESI badge with its band label, the way the planet page header does', () => {
    renderLive();

    const badge = screen.getByRole('button', { name: /^ESI 83, / });
    expect(badge).toHaveTextContent(getESIBand(83).label);
  });

  it('shows no badge for a planet the sync could not score', () => {
    renderLive({ ...KEPLER_452B, esi: undefined });

    expect(screen.queryByRole('button', { name: /^ESI /i })).toBeNull();
  });

  // Two cards mean two Change links; naming the planet keeps them apart for a screen reader.
  it('offers Change under the planet name, pointing where the page said', () => {
    renderLive();

    const change = screen.getByRole('link', { name: 'Change Kepler-452 b' });
    expect(change).toHaveTextContent('Change');
    expect(change).toHaveAttribute('href', CHANGE_HREF);
  });

  it('marks nothing on a live planet', () => {
    renderLive();

    expect(screen.queryByRole('note')).toBeNull();
  });

  it('marks a retired planet before any value, dating the removal', () => {
    render(
      <ColumnCard
        found={{ planet: KEPLER_452B, removedAt: '2026-09-01T03:00:12' }}
        changeHref={CHANGE_HREF}
      />
    );

    expect(screen.getByRole('note')).toHaveTextContent(
      'Retired planet — removed from the archive on September 1, 2026; values are the last recorded'
    );
  });
});
