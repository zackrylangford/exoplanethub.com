import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptySlot from './EmptySlot';

describe('EmptySlot', () => {
  it.each([
    ['first', 'Search for the first planet'],
    ['second', 'Search for the second planet'],
  ] as const)('names the %s picker position by pick order, not by side', (slot, name) => {
    render(<EmptySlot slot={slot} unknownName={null} />);

    expect(screen.getByText(name)).toBeInTheDocument();
  });

  it('says when the URL named a planet the archive lacks', () => {
    render(<EmptySlot slot="first" unknownName="Kepler-999 z" />);

    expect(screen.getByText("We don't have a planet called Kepler-999 z")).toBeInTheDocument();
  });

  it('says nothing about a name when the column is simply empty', () => {
    render(<EmptySlot slot="first" unknownName={null} />);

    expect(screen.queryByText(/We don't have/)).toBeNull();
  });

  it('adds no heading, leaving the outline to the page and the resolved columns', () => {
    render(<EmptySlot slot="second" unknownName="Kepler-999 z" />);

    expect(screen.queryByRole('heading')).toBeNull();
  });
});
