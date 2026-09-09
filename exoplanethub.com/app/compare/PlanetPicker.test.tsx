import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlanetSummary } from '@/lib/mockPlanets';
import PlanetPicker, { type Slot } from './PlanetPicker';

const { push, loadPlanetArchive } = vi.hoisted(() => ({ push: vi.fn(), loadPlanetArchive: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('./planetArchive', () => ({ loadPlanetArchive }));

function summary(pl_name: string, fields: Partial<PlanetSummary> = {}): PlanetSummary {
  return {
    pl_name,
    hostname: null,
    sy_dist: null,
    discoverymethod: null,
    disc_year: null,
    pl_orbper: null,
    pl_rade: null,
    pl_bmasse: null,
    pl_eqt: null,
    st_teff: null,
    ...fields,
  };
}

const KEPLER_452B = summary('Kepler-452 b', { hostname: 'Kepler-452', pl_rade: 1.63, esi: 83 });
const TRAPPIST_1E = summary('TRAPPIST-1 e', { hostname: 'TRAPPIST-1', pl_rade: 0.92, esi: 85 });
const TRAPPIST_1F = summary('TRAPPIST-1 f', { hostname: 'TRAPPIST-1', pl_rade: 1.05 });
const DIMIDIUM = summary('Dimidium', { hostname: 'Helvetios' });
const NAME_ONLY = summary('HD 000001 b');
const KEPLER_40S = Array.from({ length: 10 }, (_, index) => summary(`Kepler-4${index} b`));

const ARCHIVE = [KEPLER_452B, TRAPPIST_1E, TRAPPIST_1F, DIMIDIUM, NAME_ONLY, ...KEPLER_40S];

interface PickerProps {
  slot?: Slot;
  otherName?: string | null;
  excludedPlanetName?: string | null;
}

function renderPicker({ slot = 'first', otherName = null, excludedPlanetName = null }: PickerProps = {}) {
  render(<PlanetPicker slot={slot} otherName={otherName} excludedPlanetName={excludedPlanetName} />);
  return { user: userEvent.setup(), input: screen.getByRole('combobox') };
}

function activeOptionId(input: HTMLElement) {
  return input.getAttribute('aria-activedescendant');
}

beforeEach(() => {
  loadPlanetArchive.mockResolvedValue(ARCHIVE);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PlanetPicker naming', () => {
  it.each([
    ['first', 'Search for the first planet'],
    ['second', 'Search for the second planet'],
  ] as const)('names the %s picker by pick order, not by side', (slot, name) => {
    renderPicker({ slot });

    expect(screen.getByRole('combobox', { name })).toBeInTheDocument();
  });

  it('gives two pickers on one page distinct input, listbox and option ids', async () => {
    render(
      <>
        <PlanetPicker slot="first" otherName={null} excludedPlanetName={null} />
        <PlanetPicker slot="second" otherName={null} excludedPlanetName={null} />
      </>
    );
    const user = userEvent.setup();
    const [first, second] = screen.getAllByRole('combobox');

    await user.type(first, 'trappist');
    const firstOptionIds = (await screen.findAllByRole('option')).map((option) => option.id);
    await user.type(second, 'trappist');
    const secondOptionIds = (await screen.findAllByRole('option')).map((option) => option.id);

    expect(first.id).not.toBe('');
    expect(first.id).not.toBe(second.id);
    expect(first.getAttribute('aria-controls')).not.toBe(second.getAttribute('aria-controls'));
    expect(firstOptionIds.every((id) => id !== '' && !secondOptionIds.includes(id))).toBe(true);
  });
});

describe('PlanetPicker archive loading', () => {
  it('asks for the archive on first focus, not on mount, and never again', async () => {
    const { user, input } = renderPicker();

    expect(loadPlanetArchive).not.toHaveBeenCalled();
    await user.click(input);
    expect(loadPlanetArchive).toHaveBeenCalledTimes(1);

    await user.tab();
    await user.click(input);
    await user.type(input, 'k');
    expect(loadPlanetArchive).toHaveBeenCalledTimes(1);
  });

  it('says the list is loading while the archive is on its way', async () => {
    loadPlanetArchive.mockReturnValue(new Promise(() => {}));
    const { user, input } = renderPicker();

    await user.click(input);

    expect(screen.getByRole('status')).toHaveTextContent('Loading the planet list…');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('keeps the box usable, says so, and retries on the next keystroke when the archive will not load', async () => {
    loadPlanetArchive.mockRejectedValue(new Error('down'));
    const { user, input } = renderPicker();

    await user.type(input, 'k');

    expect(await screen.findByText("Couldn't load the planet list. Try again in a moment.")).toBeInTheDocument();
    expect(input).toHaveValue('k');
    expect(screen.queryByRole('listbox')).toBeNull();

    const failedAttempts = loadPlanetArchive.mock.calls.length;
    loadPlanetArchive.mockResolvedValue(ARCHIVE);
    await user.type(input, 'e');
    await screen.findByRole('listbox');
    await user.type(input, 'pler-452');

    expect(screen.getByRole('option', { name: /Kepler-452 b/ })).toBeInTheDocument();
    expect(loadPlanetArchive).toHaveBeenCalledTimes(failedAttempts + 1);
  });
});

describe('PlanetPicker suggestions', () => {
  it('lists nothing until something is typed', async () => {
    const { user, input } = renderPicker();

    await user.type(input, '  ');

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it("matches planet or host name by explore's rule, from the raw typed text", async () => {
    const { user, input } = renderPicker();

    await user.type(input, '  HELVETIOS ');

    expect(await screen.findByRole('option', { name: /Dimidium/ })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('offers at most eight matches', async () => {
    const { user, input } = renderPicker();

    await user.type(input, 'kepler-4');

    expect(await screen.findAllByRole('option')).toHaveLength(8);
  });

  it("never offers the other column's planet", async () => {
    const { user, input } = renderPicker({ excludedPlanetName: 'TRAPPIST-1 e' });

    await user.type(input, 'trappist');

    expect(await screen.findByRole('option', { name: /TRAPPIST-1 f/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /TRAPPIST-1 e/ })).toBeNull();
  });

  it('hints each suggestion with the stats it has measured', async () => {
    const { user, input } = renderPicker();

    await user.type(input, 'kepler-452');
    expect(await screen.findByRole('option')).toHaveTextContent('Kepler-452 bRadius 1.63 × Earth · ESI 83');

    await user.clear(input);
    await user.type(input, 'trappist-1 f');
    expect(await screen.findByRole('option')).toHaveTextContent(/^TRAPPIST-1 fRadius 1.05 × Earth$/);

    await user.clear(input);
    await user.type(input, 'hd 000001');
    expect(await screen.findByRole('option')).toHaveTextContent(/^HD 000001 b$/);
  });

  it('says when nothing matches instead of showing an empty list', async () => {
    const { user, input } = renderPicker();

    await user.type(input, 'zzz ');

    expect(await screen.findByText('No planet or star matches “zzz”')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('PlanetPicker keyboard', () => {
  it('walks the list with the arrow keys, wrapping, and selects the active option with Enter', async () => {
    const { user, input } = renderPicker({ slot: 'second', otherName: 'Kepler-452 b' });

    await user.type(input, 'trappist');
    const [first, second] = await screen.findAllByRole('option');

    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
    expect(activeOptionId(input)).toBeNull();

    await user.keyboard('{ArrowDown}');
    expect(activeOptionId(input)).toBe(first.id);
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(second).toHaveAttribute('aria-selected', 'false');

    await user.keyboard('{ArrowDown}');
    expect(activeOptionId(input)).toBe(second.id);
    expect(first).toHaveAttribute('aria-selected', 'false');

    await user.keyboard('{ArrowDown}');
    expect(activeOptionId(input)).toBe(first.id);

    await user.keyboard('{ArrowUp}');
    expect(activeOptionId(input)).toBe(second.id);

    await user.keyboard('{Enter}');
    expect(push).toHaveBeenCalledWith('/compare?a=Kepler-452%20b&b=TRAPPIST-1%20f');
  });

  it('does not navigate on Enter until an option is active', async () => {
    const { user, input } = renderPicker();

    await user.type(input, 'trappist');
    await screen.findByRole('listbox');
    await user.keyboard('{Enter}');

    expect(push).not.toHaveBeenCalled();
  });

  it('closes the list on Escape, keeps the text, and reopens from the end on ArrowUp', async () => {
    const { user, input } = renderPicker();

    await user.type(input, 'trappist');
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(activeOptionId(input)).toBeNull();
    expect(input).toHaveValue('trappist');

    await user.keyboard('{ArrowUp}');
    const options = screen.getAllByRole('option');
    expect(activeOptionId(input)).toBe(options[options.length - 1].id);
  });

  it('forgets the active option when the text changes', async () => {
    const { user, input } = renderPicker();

    await user.type(input, 'trappist');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}');
    expect(activeOptionId(input)).not.toBeNull();

    await user.type(input, '-1 f');
    expect(activeOptionId(input)).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('closes the list when focus leaves the box', async () => {
    const { user, input } = renderPicker();

    await user.type(input, 'trappist');
    await screen.findByRole('listbox');
    await user.tab();

    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

describe('PlanetPicker selection', () => {
  it('reaches the same option by mouse as by keyboard', async () => {
    const { user, input } = renderPicker({ otherName: 'TRAPPIST-1 e' });

    await user.type(input, 'kepler-452');
    const option = await screen.findByRole('option', { name: /Kepler-452 b/ });
    await user.keyboard('{ArrowDown}');
    expect(activeOptionId(input)).toBe(option.id);

    await user.click(option);

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/compare?a=Kepler-452%20b&b=TRAPPIST-1%20e');
  });

  it.each([
    ['first', null, '/compare?a=Kepler-452%20b'],
    ['second', null, '/compare?b=Kepler-452%20b'],
    ['first', 'TRAPPIST-1 e', '/compare?a=Kepler-452%20b&b=TRAPPIST-1%20e'],
    ['second', 'Kepler-999 z', '/compare?a=Kepler-999%20z&b=Kepler-452%20b'],
  ] as const)(
    'fills the %s column of the URL beside the other column as the URL spelt it (%s)',
    async (slot, otherName, url) => {
      const { user, input } = renderPicker({ slot, otherName });

      await user.type(input, 'kepler-452');
      await user.click(await screen.findByRole('option', { name: /Kepler-452 b/ }));

      expect(push).toHaveBeenCalledWith(url);
    }
  );
});
