const PLANET_PATH = '/planet';
const COMPARE_PATH = '/compare';

// No archive designation comes close to this; a longer segment is someone's prose, not a name.
const MAX_NAME_LENGTH = 80;

export function planetUrl(planetName: string): string {
  return `${PLANET_PATH}/${encodeURIComponent(planetName)}`;
}

// Query strings are form-decoded, so a bare '+' in a designation would arrive as a space.
export function compareUrl(a: string | null, b: string | null): string {
  const query = Object.entries({ a, b })
    .filter((entry): entry is [string, string] => entry[1] !== null)
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
