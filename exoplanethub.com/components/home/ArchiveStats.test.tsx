import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ArchiveStats, { ArchiveStatsLine } from '@/components/home/ArchiveStats';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class {},
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send }) },
  ScanCommand: class {
    constructor(readonly input: Record<string, unknown>) {}
  },
}));

vi.mock('next/server', () => ({ connection: async () => {} }));
vi.mock('next/cache', () => ({ unstable_cache: (scan: unknown) => scan }));

const SYNC = '2026-08-30T06:00:00';

// `planets` rows spread across `systems` distinct hosts, every row carrying the same sync stamp.
function archive(planets: number, systems: number, last_updated: string | null = SYNC) {
  return Array.from({ length: planets }, (_, index) => ({
    hostname: `Host ${index % systems}`,
    last_updated,
  }));
}

async function renderArchive(items: ReturnType<typeof archive>) {
  send.mockResolvedValue({ Items: items });
  return render(await ArchiveStatsLine());
}

function line() {
  return screen.getByText(/confirmed planet/).closest('p') as HTMLElement;
}

beforeEach(() => {
  send.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ArchiveStatsLine', () => {
  it('states the archive size and sync date as one sentence with thousands separators', async () => {
    await renderArchive(archive(5847, 4312));

    expect(line()).toHaveTextContent(
      '5,847 confirmed planets across 4,312 systems — last synced August 30, 2026'
    );
  });

  it('emphasises the two counts and nothing else', async () => {
    await renderArchive(archive(5847, 4312));

    expect(screen.getByText('5,847 confirmed planets').tagName).toBe('STRONG');
    expect(screen.getByText('4,312 systems').tagName).toBe('STRONG');
    expect(line().querySelectorAll('strong')).toHaveLength(2);
  });

  it('hides the dash from screen readers so it is not read as a word', async () => {
    await renderArchive(archive(2, 1));

    expect(screen.getByText('—')).toHaveAttribute('aria-hidden', 'true');
  });

  it('drops the sync clause, dash included, when the stamp cannot be read', async () => {
    await renderArchive(archive(2, 1, 'not a date'));

    expect(line()).toHaveTextContent(/^2 confirmed planets across 1 system$/);
    expect(line()).not.toHaveTextContent(/—|Invalid|last synced/);
  });

  it('reads "1 confirmed planet" and "1 system" in the singular', async () => {
    await renderArchive(archive(1, 1));

    expect(screen.getByText('1 confirmed planet')).toBeInTheDocument();
    expect(screen.getByText('1 system')).toBeInTheDocument();
    expect(screen.queryByText(/planets|systems/)).not.toBeInTheDocument();
  });

  it('renders nothing at all for an empty archive', async () => {
    const { container } = await renderArchive([]);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing rather than failing the page when the table cannot be read', async () => {
    send.mockRejectedValue(new Error('AccessDeniedException'));
    const { container } = render(await ArchiveStatsLine());

    expect(container).toBeEmptyDOMElement();
  });
});

describe('ArchiveStats shell', () => {
  it('holds the line with a silent skeleton while the count streams in', () => {
    const { container } = render(<ArchiveStats />);

    const placeholder = container.querySelector('p');
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(placeholder).toHaveTextContent('');
    expect(screen.queryByText(/planet/)).not.toBeInTheDocument();
  });
});
