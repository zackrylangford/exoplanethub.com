import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RetiredMark from './RetiredMark';

describe('RetiredMark', () => {
  it('dates the removal in the sync-date long form', () => {
    render(<RetiredMark removedAt="2026-03-12T03:00:12" />);

    expect(screen.getByRole('note')).toHaveTextContent(
      'Retired planet — removed from the archive on March 12, 2026; values are the last recorded'
    );
  });

  it('drops the date clause rather than printing Invalid Date for a corrupt stamp', () => {
    render(<RetiredMark removedAt="not-a-date" />);

    expect(screen.getByRole('note')).toHaveTextContent(
      'Retired planet — removed from the archive; values are the last recorded'
    );
    expect(document.body).not.toHaveTextContent(/Invalid Date/);
  });

  // The planet page's notice hardcodes an id; two retired columns need two marks that cannot collide.
  it('carries no id, so both columns can be retired at once', () => {
    render(
      <>
        <RetiredMark removedAt="2026-03-12T03:00:12" />
        <RetiredMark removedAt="2026-09-01T03:00:12" />
      </>
    );

    expect(screen.getAllByRole('note')).toHaveLength(2);
    expect(document.querySelectorAll('[id]')).toHaveLength(0);
  });
});
