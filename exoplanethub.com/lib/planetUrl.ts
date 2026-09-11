const PLANET_PATH = '/planet';
const COMPARE_PATH = '/compare';

// The /compare query contract: a names the left column, b the right.
export const FIRST_COLUMN_PARAM = 'a';
export const SECOND_COLUMN_PARAM = 'b';

// No archive designation comes close to this; a longer segment is someone's prose, not a name.
const MAX_NAME_LENGTH = 80;

export function planetUrl(planetName: string): string {
  return `${PLANET_PATH}/${encodeURIComponent(planetName)}`;
}

// Query strings are form-decoded, so a bare '+' in a designation would arrive as a space.
export function compareUrl(a: string | null, b: string | null): string {
  const columns: [string, string | null][] = [
    [FIRST_COLUMN_PARAM, a],
    [SECOND_COLUMN_PARAM, b],
  ];
  const query = columns
    .filter((column): column is [string, string] => column[1] !== null)
    .map(([param, planetName]) => `${param}=${encodeURIComponent(planetName)}`)
    .join('&');

  return query === '' ? COMPARE_PATH : `${COMPARE_PATH}?${query}`;
}

// Tolerates the segment arriving encoded or already decoded: no archive name contains a
// literal '%', so decoding twice is a no-op rather than a corruption.
export function planetNameFromParam(param: string): string | null {
  let planetName: string;

  try {
    planetName = decodeURIComponent(param);
  } catch {
    return null;
  }

  if (planetName.trim() === '' || planetName.length > MAX_NAME_LENGTH) return null;

  return planetName;
}
