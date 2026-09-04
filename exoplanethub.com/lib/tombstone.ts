import 'server-only';
import { cache } from 'react';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { documentClient, tombstonesTableName } from '@/lib/dynamo';
import type { Planet } from '@/lib/mockPlanets';

export interface RetiredPlanet {
  planet: Planet;
  removedAt: string;
}

// The item the sync's sweep.py writes just before it deletes a planet the archive dropped.
interface StoredTombstone {
  pl_name: string;
  removed_at: string;
  last_known_snapshot: Planet;
}

// Never throws: a retired name 404ed before tombstones existed, so a failed read (an outage, or a
// missing table grant) must degrade back to that 404 rather than 500 a page that used to work.
export const getRetiredPlanet = cache(async (planetName: string): Promise<RetiredPlanet | null> => {
  try {
    const { Item } = await documentClient.send(
      new GetCommand({
        TableName: tombstonesTableName,
        Key: { pl_name: planetName },
      })
    );

    const tombstone = Item as StoredTombstone | undefined;
    return tombstone ? { planet: tombstone.last_known_snapshot, removedAt: tombstone.removed_at } : null;
  } catch (error) {
    console.error(`Error reading tombstone for ${planetName}:`, error);
    return null;
  }
});
