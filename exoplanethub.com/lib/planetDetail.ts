import 'server-only';
import { cache } from 'react';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { documentClient, planetsTableName } from '@/lib/dynamo';
import type { Planet } from '@/lib/mockPlanets';
import { getRetiredPlanet, type RetiredPlanet } from '@/lib/tombstone';

// A live planet is one the archive still lists; a retired one is the snapshot the sweep kept.
export type FoundPlanet = { planet: Planet; removedAt: null } | RetiredPlanet;

// cache() shares one GetItem between generateMetadata and the page it titles.
// A read failure throws instead of resolving null, so only a genuine miss can become a cached 404.
export const getPlanetDetail = cache(async (planetName: string): Promise<Planet | null> => {
  const { Item } = await documentClient.send(
    new GetCommand({
      TableName: planetsTableName,
      Key: { pl_name: planetName },
    })
  );

  return (Item as Planet | undefined) ?? null;
});

// Tombstones are read only after a live miss, so a listed planet costs the one GetItem it always did.
export async function findPlanet(planetName: string): Promise<FoundPlanet | null> {
  const planet = await getPlanetDetail(planetName);
  return planet === null ? getRetiredPlanet(planetName) : { planet, removedAt: null };
}
