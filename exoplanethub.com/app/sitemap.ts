import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { connection } from 'next/server';
import { scanAllPlanets } from '@/lib/dynamo';
import { planetUrl } from '@/lib/planetUrl';
import { SITE_ORIGIN } from '@/lib/site';

// The same hour the planet pages and the API cache use, so the sitemap is never fresher than the data behind it.
const REVALIDATE_SECONDS = 3600;

const STATIC_PATHS = ['/', '/explore', '/about', '/contact'];

// A full-table Scan, so it projects the two attributes a URL entry needs and nothing else.
const URL_FIELDS = ['pl_name', 'last_updated'] as const;

// Bounds a public endpoint that would otherwise Scan ~6k items on every crawler request.
const cachedPlanetRows = unstable_cache(() => scanAllPlanets(URL_FIELDS), ['sitemap-planet-urls'], {
  revalidate: REVALIDATE_SECONDS,
});

// Scanned rows are cast rather than validated, and `new Date(null)` would silently date a URL to 1970.
function parseTimestamp(timestamp: string): Date | undefined {
  if (typeof timestamp !== 'string') return undefined;

  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Defers the Scan to request time: a deploy without Dynamo access must not bake a planet-less sitemap.
  await connection();

  const planets = await cachedPlanetRows();

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_ORIGIN}${path}` })),
    ...planets.map(({ pl_name, last_updated }) => {
      const url = `${SITE_ORIGIN}${planetUrl(pl_name)}`;
      const lastModified = parseTimestamp(last_updated);
      return lastModified ? { url, lastModified } : { url };
    }),
  ];
}
