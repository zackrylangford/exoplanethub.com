import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Planet } from '@/lib/mockPlanets';
import { comparePlanets } from '@/lib/planetComparison';
import { planetStatSections } from '@/lib/planetStats';
import ComparisonTable from './ComparisonTable';

const ALPHA: Planet = {
  pl_name: 'Alpha b',
  hostname: 'Alpha',
  sy_snum: 1,
  sy_pnum: 3,
  sy_dist: 12.43,
  discoverymethod: 'Transit',
  disc_year: 2016,
  disc_facility: 'Kepler',
  pl_orbper: 384.843,
  pl_orbsmax: null,
  pl_rade: 1.63,
  pl_bmasse: null,
  pl_dens: null,
  pl_eqt: 265,
  pl_insol: null,
  st_teff: 5757,
  st_rad: null,
  st_mass: null,
  st_logg: null,
  st_age: null,
  last_updated: '2026-08-30T06:00:00Z',
  esi: 83,
};

const BETA: Planet = {
  ...ALPHA,
  pl_name: 'Beta c',
  hostname: 'Beta',
  sy_dist: null,
  disc_year: null,
  pl_orbper: 6.099,
  pl_rade: 0.92,
  pl_bmasse: 0.69,
  pl_eqt: null,
  st_teff: 2566,
  esi: 61,
};

const UNDISCOVERED: Partial<Planet> = { discoverymethod: null, disc_year: null, disc_facility: null };

function renderTable(a: Planet = ALPHA, b: Planet = BETA) {
  const { sections } = comparePlanets(a, b);
  return render(<ComparisonTable sections={sections} names={{ a: a.pl_name, b: b.pl_name }} />);
}

function sectionBodies(): HTMLElement[] {
  return screen.getAllByRole('rowgroup').slice(1);
}

function titleOf(body: HTMLElement): string | null {
  return within(body).getAllByRole('rowheader')[0].textContent;
}

function bodyOf(title: string): HTMLElement {
  const body = sectionBodies().find((candidate) => titleOf(candidate) === title);
  if (!body) throw new Error(`No section "${title}"`);
  return body;
}

function cellsOf(section: string, label: string): HTMLElement[] {
  const row = within(bodyOf(section)).getByRole('rowheader', { name: label }).closest('tr') as HTMLElement;
  return within(row).getAllByRole('cell');
}

function expectedRole(element: Element): string {
  switch (element.tagName) {
    case 'TABLE':
      return 'table';
    case 'THEAD':
    case 'TBODY':
      return 'rowgroup';
    case 'TR':
      return 'row';
    case 'TD':
      return 'cell';
    default:
      return element.closest('thead') === null ? 'rowheader' : 'columnheader';
  }
}

describe('ComparisonTable', () => {
  it('heads its three columns with a hidden "Stat" and the two planet names, nothing else', () => {
    renderTable();

    const headers = within(screen.getByRole('table')).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual(['Stat', 'Alpha b', 'Beta c']);
    expect(headers[0]).toHaveAccessibleName('Stat');

    for (const [header, name] of [
      [headers[1], 'Alpha b'],
      [headers[2], 'Beta c'],
    ] as const) {
      expect(header).toHaveAccessibleName(name);
      expect(Array.from(header.children).map((child) => child.tagName)).toEqual(['A']);
      expect(within(header).getByRole('link', { name })).toHaveAttribute(
        'href',
        `/planet/${encodeURIComponent(name)}`
      );
    }
  });

  it('carries an explicit role on every element, so the mobile grid reflow cannot strip them', () => {
    const { container } = renderTable();

    const elements = Array.from(container.querySelectorAll('table, thead, tbody, tr, th, td'));
    expect(elements.length).toBeGreaterThan(40);
    for (const element of elements) {
      expect(element.getAttribute('role'), element.outerHTML).toBe(expectedRole(element));
    }

    const spanning = Array.from(container.querySelectorAll('[colspan]'));
    expect(spanning.length).toBeGreaterThan(0);
    for (const element of spanning) {
      expect(element.getAttribute('colspan')).toBe('3');
      expect(element.getAttribute('aria-colspan')).toBe('3');
    }
  });

  it('opens one body per section with its title spanning the row, in registry order', () => {
    renderTable();

    expect(sectionBodies().map(titleOf)).toEqual(['Planet', 'Star', 'System', 'Discovery']);

    const title = within(bodyOf('Planet')).getAllByRole('rowheader')[0];
    expect(title).toHaveAttribute('colspan', '3');
    expect(title.closest('tr')?.children).toHaveLength(1);
  });

  it('labels each stat as a row header with the two values beside it', () => {
    renderTable();

    const [a, b] = cellsOf('Planet', 'Equilibrium temperature');
    expect(a).toHaveTextContent('265 K');
    expect(b).toHaveTextContent('Not measured');
  });

  it("spells every value exactly as the planet page's formatters do", () => {
    renderTable();

    const table = screen.getByRole('table');
    for (const stat of planetStatSections(ALPHA).flatMap((section) => section.stats)) {
      if (stat.value !== null) expect(within(table).getAllByText(stat.value).length).toBeGreaterThan(0);
    }
  });

  it('reads a value the archive lacks as "Not measured", in words, never a dash', () => {
    renderTable();

    const [a, b] = cellsOf('Planet', 'Mass');
    expect(a).toHaveTextContent(/^Not measured$/);
    expect(b).toHaveTextContent(/^0\.69 × Earth$/);
    expect(screen.queryByRole('cell', { name: '—' })).toBeNull();
  });

  it('sets the ratio note beside the larger value only', () => {
    renderTable();

    const [a, b] = cellsOf('Planet', 'Radius');
    expect(within(a).getByText('1.63 × Earth')).toBeInTheDocument();
    expect(within(a).getByText('1.8× wider')).toBeInTheDocument();
    expect(b).toHaveTextContent(/^0\.92 × Earth$/);
  });

  it('leaves counts side by side with no note', () => {
    renderTable();

    expect(cellsOf('System', 'Known planets').map((cell) => cell.textContent)).toEqual(['3', '3']);
  });

  it('drops a row neither planet has measured', () => {
    renderTable();

    expect(within(bodyOf('Planet')).queryByRole('rowheader', { name: 'Density' })).toBeNull();
  });

  it('renders a section neither planet has data for as its title and one spanning line', () => {
    renderTable({ ...ALPHA, ...UNDISCOVERED }, { ...BETA, ...UNDISCOVERED });

    const discovery = bodyOf('Discovery');
    expect(within(discovery).getAllByRole('rowheader')).toHaveLength(1);
    const note = within(discovery).getByRole('cell');
    expect(note).toHaveTextContent('Neither planet has data for this section');
    expect(note).toHaveAttribute('aria-colspan', '3');
  });

  it('collapses a shared star into its heading and the same-system line, with no System section', () => {
    renderTable({ ...ALPHA, hostname: 'TRAPPIST-1' }, { ...BETA, hostname: 'TRAPPIST-1' });

    const star = bodyOf('Star');
    expect(within(star).getAllByRole('row')).toHaveLength(2);
    expect(within(star).getByRole('cell')).toHaveTextContent(
      'Both orbit TRAPPIST-1 — same star, same system, 40.54 light-years away'
    );
    expect(sectionBodies().map(titleOf)).toEqual(['Planet', 'Star', 'Discovery']);
  });
});
