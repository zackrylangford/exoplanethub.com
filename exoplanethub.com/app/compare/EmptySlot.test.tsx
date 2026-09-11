import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EmptySlot from './EmptySlot';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

type SlotProps = Parameters<typeof EmptySlot>[0];

function renderSlot(props: Partial<SlotProps> = {}) {
  render(
    <EmptySlot slot="first" unknownName={null} otherName={null} excludedPlanetName={null} {...props} />
  );
}

describe('EmptySlot', () => {
  it.each([
    ['first', 'Search for the first planet'],
    ['second', 'Search for the second planet'],
  ] as const)('names the %s picker by pick order, not by side', (slot, name) => {
    renderSlot({ slot });

    expect(screen.getByRole('combobox', { name })).toBeInTheDocument();
  });

  it('says when the URL named a planet the archive lacks, before offering the picker', () => {
    renderSlot({ unknownName: 'Kepler-999 z' });

    const unknown = screen.getByText("We don't have a planet called Kepler-999 z");
    const picker = screen.getByRole('combobox');
    expect(unknown.compareDocumentPosition(picker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('says nothing about a name when the column is simply empty', () => {
    renderSlot();

    expect(screen.queryByText(/We don't have/)).toBeNull();
  });

  it('adds no heading, leaving the outline to the page and the resolved columns', () => {
    renderSlot({ slot: 'second', unknownName: 'Kepler-999 z' });

    expect(screen.queryByRole('heading')).toBeNull();
  });
});
