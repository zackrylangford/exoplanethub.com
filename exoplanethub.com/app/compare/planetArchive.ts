import type { PlanetSummary } from '@/lib/mockPlanets';

// Numeric collation so Kepler-4 b sorts before Kepler-40 b, and a capped slice reads as a run.
const BY_DESIGNATION = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

let archiveRequest: Promise<PlanetSummary[]> | null = null;

async function fetchArchive(): Promise<PlanetSummary[]> {
  const response = await fetch('/api/planets');
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error('Planets endpoint did not return a list');
  return data.sort((a: PlanetSummary, b: PlanetSummary) => BY_DESIGNATION.compare(a.pl_name, b.pl_name));
}

// One request per page however many pickers ask; a failure forgets itself so the next ask retries.
export function loadPlanetArchive(): Promise<PlanetSummary[]> {
  archiveRequest ??= fetchArchive().catch((error: unknown) => {
    archiveRequest = null;
    throw error;
  });
  return archiveRequest;
}
