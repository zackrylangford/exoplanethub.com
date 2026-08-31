import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePagination } from '@/lib/usePagination';

const PER_PAGE = 10;

function Harness({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const { page, totalPages, goTo } = usePagination(count, PER_PAGE);

  return (
    <>
      <output data-testid="state">{`${page} of ${totalPages}`}</output>
      <button onClick={() => goTo(page + 1)}>next</button>
      <button onClick={() => goTo(page - 1)}>previous</button>
      <button onClick={() => goTo(99)}>jump past the end</button>
      <button onClick={() => setCount(15)}>narrow</button>
    </>
  );
}

function mount(initialCount: number) {
  render(<Harness initialCount={initialCount} />);
}

function state() {
  return screen.getByTestId('state').textContent;
}

function press(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

describe('usePagination', () => {
  it('starts on the first page', () => {
    mount(100);

    expect(state()).toBe('1 of 10');
  });

  it('keeps a single page for an empty set, so there is always a page to show', () => {
    mount(0);

    expect(state()).toBe('1 of 1');
  });

  it('counts a partial last page', () => {
    mount(101);

    expect(state()).toBe('1 of 11');
  });

  it('moves between pages', () => {
    mount(100);

    press('next');
    press('next');
    expect(state()).toBe('3 of 10');

    press('previous');
    expect(state()).toBe('2 of 10');
  });

  it('refuses to leave the last page', () => {
    mount(100);

    press('jump past the end');

    expect(state()).toBe('10 of 10');
  });

  it('refuses to go before the first page', () => {
    mount(100);

    press('previous');

    expect(state()).toBe('1 of 10');
  });

  // The result set can shrink without anyone paging, so the clamp has to survive that too.
  it('pulls back to the last page when the set shrinks underneath it', () => {
    mount(100);

    press('next');
    press('next');
    press('narrow');

    expect(state()).toBe('2 of 2');
  });

  // The bug this hook exists to prevent: a caller stepping back from a page the clamp is hiding.
  it('steps back from the page the clamp put it on, not the one it asked for', () => {
    mount(100);

    press('next');
    press('next');
    press('narrow');
    press('previous');

    expect(state()).toBe('1 of 2');
  });
});
