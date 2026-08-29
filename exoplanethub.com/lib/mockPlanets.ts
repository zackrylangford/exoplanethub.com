export interface Planet {
  pl_name: string;
  hostname: string;
  sy_snum: number;
  sy_pnum: number;
  sy_dist: number;
  discoverymethod: string;
  disc_year: number;
  disc_facility: string;
  pl_orbper: number;
  pl_orbsmax: number;
  pl_rade: number;
  pl_bmasse: number;
  pl_dens: number;
  pl_eqt: number;
  pl_insol: number;
  st_teff: number;
  st_rad: number;
  st_mass: number;
  st_logg: number;
  st_age: number;
  last_updated: string;
  esi?: number;
}

// Drives both the /api/planets projection and PlanetSummary, so rendering a new field
// without listing it here fails typecheck rather than yielding undefined at runtime.
export const PLANET_SUMMARY_FIELDS = [
  'pl_name',
  'hostname',
  'sy_dist',
  'discoverymethod',
  'disc_year',
  'pl_rade',
  'pl_bmasse',
  'pl_eqt',
  'esi',
] as const;

export type PlanetSummary = Pick<Planet, (typeof PLANET_SUMMARY_FIELDS)[number]>;
