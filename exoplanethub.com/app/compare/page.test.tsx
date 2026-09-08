import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Planet } from '@/lib/mockPlanets';
import { comparePlanets } from '@/lib/planetComparison';
import type { FoundPlanet } from '@/lib/planetDetail';
import ComparePage, { generateMetadata } from './page';

const { findPlanet } = vi.hoisted(() => ({ findPlanet: vi.fn() }));

vi.mock('@/lib/planetDetail', () => ({ findPlanet }));

const NAME_ONLY: Planet = {
  pl_name: 'HD 000001 b',
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

const KEPLER_452B: Planet = {
  ...NAME_ONLY,
  pl_name: 'Kepler-452 b',
  hostname: 'Kepler-452',
  sy_dist: 551.7,
  pl_orbper: 384.843,
  pl_rade: 1.63,
  pl_eqt: 265,
  st_teff: 5757,
  esi: 83,
};

const TRAPPIST_1E: Planet = {
  ...NAME_ONLY,
  pl_name: 'TRAPPIST-1 e',
  hostname: 'TRAPPIST-1',
  sy_dist: 12.43,
  pl_orbper: 6.099,
  pl_rade: 0.92,
  pl_bmasse: 0.69,
  pl_eqt: 250,
  st_teff: 2566,
  esi: 85,
};

const RETIRED_AT = '2026-09-01T03:00:12';

type Params = Record<string, string | string[] | undefined>;

function live(planet: Planet): FoundPlanet {
  return { planet, removedAt: null };
}

// A fake archive keyed by name, so a page that looks up two planets gets each its own answer.
function stock(found: Record<string, FoundPlanet>) {
  findPlanet.mockImplementation(async (name: string) => found[name] ?? null);
}

async function renderPage(params: Params) {
  render(await ComparePage({ searchParams: Promise.resolve(params) }));
}

function metadataFor(params: Params) {
  return generateMetadata({ searchParams: Promise.resolve(params) });
}

function columnHeadings() {
  return screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
}

function cardOf(planetName: string) {
  return screen.getByRole('heading', { level: 2, name: planetName }).parentElement as HTMLElement;
}

function swapLink() {
  return screen.queryByRole('link', { name: 'Swap' });
}

function changeLink(planetName: string) {
  return screen.getByRole('link', { name: `Change ${planetName}` });
}

function precedes(before: HTMLElement, after: HTMLElement) {
  return Boolean(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING);
}

beforeEach(() => {
  findPlanet.mockReset();
  stock({
    'Kepler-452 b': live(KEPLER_452B),
    'TRAPPIST-1 e': live(TRAPPIST_1E),
    'HD 000001 b': live(NAME_ONLY),
  });
});

describe('ComparePage with nothing chosen', () => {
  it('titles the page and offers two pickers without a lookup', async () => {
    await renderPage({});

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Compare planets');
    expect(screen.getByText('Search for the first planet')).toBeInTheDocument();
    expect(screen.getByText('Search for the second planet')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(findPlanet).not.toHaveBeenCalled();
  });

  it('invites the pair instead of framing an empty comparison', async () => {
    await renderPage({});

    expect(screen.getByText('Pick two planets to put side by side')).toBeInTheDocument();
    expect(swapLink()).toBeNull();
  });
});

describe('ComparePage with one planet', () => {
  it('looks the planet up by name and leaves the other column to its picker', async () => {
    await renderPage({ a: 'Kepler-452 b' });

    expect(findPlanet.mock.calls).toEqual([['Kepler-452 b']]);
    expect(columnHeadings()).toEqual(['Kepler-452 b']);
    expect(screen.getByText('Search for the second planet')).toBeInTheDocument();
    expect(screen.queryByText('Search for the first planet')).toBeNull();
  });

  it('links the card to the planet page and badges its score', async () => {
    await renderPage({ a: 'Kepler-452 b' });

    expect(within(cardOf('Kepler-452 b')).getByRole('link', { name: 'Kepler-452 b' })).toHaveAttribute(
      'href',
      '/planet/Kepler-452%20b'
    );
    expect(within(cardOf('Kepler-452 b')).getByRole('button', { name: /^ESI 83, / })).toBeInTheDocument();
  });

  it('invites the second pick by name, with no verdict and no Swap to move one name right', async () => {
    await renderPage({ a: 'Kepler-452 b' });

    expect(screen.getByText('Pick a second planet to compare with Kepler-452 b')).toBeInTheDocument();
    expect(screen.queryByText(/Earth's conditions/)).toBeNull();
    expect(swapLink()).toBeNull();
  });

  it('clears the column with Change', async () => {
    await renderPage({ a: 'Kepler-452 b' });

    expect(changeLink('Kepler-452 b')).toHaveAttribute('href', '/compare');
  });

  it('keeps a planet named as b in the right-hand column', async () => {
    await renderPage({ b: 'Kepler-452 b' });

    expect(precedes(screen.getByText('Search for the first planet'), cardOf('Kepler-452 b'))).toBe(true);
    expect(screen.getByText('Pick a second planet to compare with Kepler-452 b')).toBeInTheDocument();
    expect(swapLink()).toBeNull();
  });
});

describe('ComparePage with a name the archive lacks', () => {
  it('says so in that column and keeps its picker', async () => {
    await renderPage({ a: 'Kepler-999 z', b: 'Kepler-452 b' });

    expect(screen.getByText("We don't have a planet called Kepler-999 z")).toBeInTheDocument();
    expect(screen.getByText('Search for the first planet')).toBeInTheDocument();
    expect(columnHeadings()).toEqual(['Kepler-452 b']);
  });

  // Resolution never feeds back into the URL: the typo is the visitor's intent until they change it.
  it('carries the unknown name through Swap and through a Change on the other column', async () => {
    await renderPage({ a: 'Kepler-999 z', b: 'Kepler-452 b' });

    expect(swapLink()).toHaveAttribute('href', '/compare?a=Kepler-452%20b&b=Kepler-999%20z');
    expect(changeLink('Kepler-452 b')).toHaveAttribute('href', '/compare?a=Kepler-999%20z');
  });

  it('shows two unknown columns with a Swap between them and no verdict', async () => {
    await renderPage({ a: 'Kepler-999 z', b: 'Kepler-999 y' });

    expect(screen.getAllByText(/We don't have a planet called/)).toHaveLength(2);
    expect(swapLink()).toHaveAttribute('href', '/compare?a=Kepler-999%20y&b=Kepler-999%20z');
    expect(screen.getByText('Pick two planets to put side by side')).toBeInTheDocument();
  });
});

describe('ComparePage with both planets', () => {
  it('orders the columns as the URL does', async () => {
    await renderPage({ a: 'TRAPPIST-1 e', b: 'Kepler-452 b' });

    expect(columnHeadings()).toEqual(['TRAPPIST-1 e', 'Kepler-452 b']);
  });

  it('opens with the verdict, above the cards, and drops the invitation', async () => {
    await renderPage({ a: 'Kepler-452 b', b: 'TRAPPIST-1 e' });

    const verdict = screen.getByText(comparePlanets(KEPLER_452B, TRAPPIST_1E).verdict.headline);
    expect(precedes(screen.getByRole('heading', { level: 1 }), verdict)).toBe(true);
    expect(precedes(verdict, cardOf('Kepler-452 b'))).toBe(true);
    expect(screen.queryByText(/^Pick /)).toBeNull();
  });

  it('swaps the columns and clears one column at a time, all by URL', async () => {
    await renderPage({ a: 'Kepler-452 b', b: 'TRAPPIST-1 e' });

    expect(swapLink()).toHaveAttribute('href', '/compare?a=TRAPPIST-1%20e&b=Kepler-452%20b');
    expect(changeLink('Kepler-452 b')).toHaveAttribute('href', '/compare?b=TRAPPIST-1%20e');
    expect(changeLink('TRAPPIST-1 e')).toHaveAttribute('href', '/compare?a=Kepler-452%20b');
  });

  it('looks each planet up once and keeps one top-level heading', async () => {
    await renderPage({ a: 'Kepler-452 b', b: 'TRAPPIST-1 e' });

    expect(findPlanet.mock.calls).toEqual([['Kepler-452 b'], ['TRAPPIST-1 e']]);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('ComparePage with a retired planet', () => {
  beforeEach(() => {
    stock({
      'Kepler-452 b': { planet: KEPLER_452B, removedAt: RETIRED_AT },
      'TRAPPIST-1 e': live(TRAPPIST_1E),
    });
  });

  it('counts it as resolved and marks its column alone', async () => {
    await renderPage({ a: 'Kepler-452 b', b: 'TRAPPIST-1 e' });

    expect(columnHeadings()).toEqual(['Kepler-452 b', 'TRAPPIST-1 e']);
    expect(screen.getAllByRole('note')).toHaveLength(1);
    expect(within(cardOf('Kepler-452 b')).getByRole('note')).toHaveTextContent(
      'Retired planet — removed from the archive on September 1, 2026; values are the last recorded'
    );
    expect(within(cardOf('TRAPPIST-1 e')).queryByRole('note')).toBeNull();
  });

  it('still reaches a verdict', async () => {
    await renderPage({ a: 'Kepler-452 b', b: 'TRAPPIST-1 e' });

    expect(
      screen.getByText(comparePlanets(KEPLER_452B, TRAPPIST_1E).verdict.headline)
    ).toBeInTheDocument();
  });
});

describe('ComparePage param rules', () => {
  it('reads a repeated param as absent, without a lookup', async () => {
    await renderPage({ a: ['Kepler-452 b', 'TRAPPIST-1 e'] });

    expect(findPlanet).not.toHaveBeenCalled();
    expect(screen.getByText('Search for the first planet')).toBeInTheDocument();
  });

  it('reads b naming the same planet as a as not yet picked', async () => {
    await renderPage({ a: 'Kepler-452 b', b: 'Kepler-452 b' });

    expect(findPlanet.mock.calls).toEqual([['Kepler-452 b']]);
    expect(columnHeadings()).toEqual(['Kepler-452 b']);
    expect(screen.getByText('Search for the second planet')).toBeInTheDocument();
    expect(swapLink()).toBeNull();
  });

  it.each(['%ZZ', '', '   ', 'K'.repeat(81)])('reads the invalid param "%s" as absent', async (value) => {
    await renderPage({ a: value, b: 'Kepler-452 b' });

    expect(findPlanet.mock.calls).toEqual([['Kepler-452 b']]);
    expect(screen.queryByText(/We don't have/)).toBeNull();
    expect(swapLink()).toBeNull();
  });

  // A throttled or broken read is not an unknown planet; the error boundary must see it.
  it('lets a read failure surface instead of rendering an empty column', async () => {
    findPlanet.mockRejectedValue(new Error('ProvisionedThroughputExceededException'));

    await expect(renderPage({ a: 'Kepler-452 b' })).rejects.toThrow(
      'ProvisionedThroughputExceededException'
    );
  });
});

describe('ComparePage metadata', () => {
  it('describes the tool, and stays indexable, when nothing is chosen', async () => {
    const metadata = await metadataFor({});

    expect(metadata.title).toBe('Compare planets | ExoplanetHub');
    expect(metadata.description).toBe(
      'Put two confirmed exoplanets side by side — size, mass, temperature, orbit and star — and ' +
        "see which is closer to Earth's conditions"
    );
    expect(metadata.robots).toBeUndefined();
  });

  it('invites the second pick by name once one planet resolves', async () => {
    const metadata = await metadataFor({ a: 'Kepler-452 b' });

    expect(metadata.title).toBe('Compare Kepler-452 b with another planet | ExoplanetHub');
    expect(metadata.description).toBe('Pick a second planet to compare with Kepler-452 b');
    expect(metadata.robots).toEqual({ index: false });
  });

  it('names whichever column resolved, not just a', async () => {
    const metadata = await metadataFor({ a: 'Kepler-999 z', b: 'TRAPPIST-1 e' });

    expect(metadata.title).toBe('Compare TRAPPIST-1 e with another planet | ExoplanetHub');
  });

  it('titles the pair and describes it with the verdict summary, scores included', async () => {
    const metadata = await metadataFor({ a: 'Kepler-452 b', b: 'TRAPPIST-1 e' });

    expect(metadata.title).toBe('Kepler-452 b vs TRAPPIST-1 e — Compare planets | ExoplanetHub');
    expect(metadata.description).toBe(comparePlanets(KEPLER_452B, TRAPPIST_1E).verdict.summary);
    expect(metadata.description).toContain('ESI 85');
    expect(metadata.robots).toEqual({ index: false });
  });

  // Nothing links to a pair URL, so per-page noindex is the one guard on ~40M possible pairs.
  it.each([{ a: 'Kepler-999 z' }, { a: '' }, { b: ['Kepler-452 b', 'TRAPPIST-1 e'] }])(
    'keeps %o out of the index even though nothing resolved',
    async (params) => {
      const metadata = await metadataFor(params);

      expect(metadata.title).toBe('Compare planets | ExoplanetHub');
      expect(metadata.robots).toEqual({ index: false });
    }
  );

  it('asks for the same planets when titling as when rendering', async () => {
    const searchParams = Promise.resolve({ a: 'Kepler-452 b', b: 'TRAPPIST-1 e' });

    await generateMetadata({ searchParams });
    render(await ComparePage({ searchParams }));

    expect(findPlanet.mock.calls).toEqual([
      ['Kepler-452 b'],
      ['TRAPPIST-1 e'],
      ['Kepler-452 b'],
      ['TRAPPIST-1 e'],
    ]);
  });
});
