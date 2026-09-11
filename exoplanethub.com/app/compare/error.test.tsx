import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CompareError from './error';

function renderError(reset = vi.fn()) {
  render(<CompareError error={new Error('DynamoDB unavailable')} reset={reset} />);
  return reset;
}

describe('CompareError', () => {
  it('explains the outage in the app voice rather than leaving Next to say "Application error"', () => {
    renderError();

    expect(
      screen.getByRole('heading', { level: 1, name: "We couldn't load this comparison" })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('This is usually temporary.');
  });

  it('retries the render in place', async () => {
    const reset = renderError();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('offers the archive as a way out when the retry keeps failing', () => {
    renderError();

    expect(screen.getByRole('link', { name: 'Browse the archive' })).toHaveAttribute(
      'href',
      '/explore'
    );
  });

  it('never prints the underlying failure', () => {
    renderError();

    expect(screen.queryByText(/DynamoDB/)).toBeNull();
  });
});
