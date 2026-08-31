'use client';
import { useMemo } from 'react';
import { PlanetSummary } from '@/lib/mockPlanets';
import { SortKey, SortOrder } from '@/lib/planetFilters';
import ESIInfoButton from './ESIInfoButton';
import { getESIBand } from './esiBands';
import styles from './PlanetTable.module.css';

interface PlanetTableProps {
  planets: PlanetSummary[];
  page: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPlanetClick: (planet: PlanetSummary) => void;
  sortKey: SortKey;
  sortOrder: SortOrder;
  onSort: (key: SortKey) => void;
}

type SortValue = PlanetSummary[SortKey];

// Unmeasured planets sort last in both directions: null coerces to 0 under <, which would
// otherwise rank every planet NASA has no value for ahead of the real measurements.
function compareSortValues(a: SortValue, b: SortValue, order: SortOrder): number {
  if (a == null || b == null) return a == null && b == null ? 0 : a == null ? 1 : -1;

  const direction = order === 'asc' ? 1 : -1;

  if (typeof a === 'string' && typeof b === 'string') {
    const left = a.toLowerCase();
    const right = b.toLowerCase();
    return left === right ? 0 : (left < right ? -1 : 1) * direction;
  }

  return (Number(a) - Number(b)) * direction;
}

function ESIScore({ score }: { score: number | undefined }) {
  if (typeof score !== 'number') {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className={styles.visuallyHidden}>Not scored</span>
      </>
    );
  }

  const band = getESIBand(score);

  return (
    <>
      <span className={styles.esiScore} style={band.style}>{score}</span>
      <span className={styles.esiBand}>{band.label}</span>
    </>
  );
}

export default function PlanetTable({ planets, page, itemsPerPage, onPageChange, onPlanetClick, sortKey, sortOrder, onSort }: PlanetTableProps) {
  const sorted = useMemo(
    () => [...planets].sort((a, b) => compareSortValues(a[sortKey], b[sortKey], sortOrder)),
    [planets, sortKey, sortOrder],
  );

  const esiAriaSort = sortKey !== 'esi' ? 'none' : sortOrder === 'asc' ? 'ascending' : 'descending';

  const paginatedPlanets = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));

  return (
    <>
      <div className={styles.tableContainer} role="region" aria-label="Exoplanet results" tabIndex={0}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => onSort('pl_name')}>
                Planet {sortKey === 'pl_name' && <span className={styles.sortIcon}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th>Star</th>
              <th onClick={() => onSort('discoverymethod')}>
                Method {sortKey === 'discoverymethod' && <span className={styles.sortIcon}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th onClick={() => onSort('pl_rade')}>
                Radius {sortKey === 'pl_rade' && <span className={styles.sortIcon}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th onClick={() => onSort('sy_dist')}>
                Distance {sortKey === 'sy_dist' && <span className={styles.sortIcon}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th onClick={() => onSort('disc_year')}>
                Discovered {sortKey === 'disc_year' && <span className={styles.sortIcon}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th className={styles.esiHeader} aria-sort={esiAriaSort}>
                <span className={styles.esiHeaderContent}>
                  <button className={styles.sortButton} onClick={() => onSort('esi')}>
                    ESI {sortKey === 'esi' && <span className={styles.sortIcon} aria-hidden="true">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                  <ESIInfoButton />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedPlanets.map((planet) => (
              <tr key={planet.pl_name} onClick={() => onPlanetClick(planet)}>
                <td className={styles.planetName}>{planet.pl_name}</td>
                <td>{planet.hostname || 'N/A'}</td>
                <td>{planet.discoverymethod || 'N/A'}</td>
                <td>{planet.pl_rade ? planet.pl_rade.toFixed(2) : 'N/A'}× Earth</td>
                <td>{planet.sy_dist ? planet.sy_dist.toFixed(2) : 'N/A'} pc</td>
                <td>{planet.disc_year || 'N/A'}</td>
                <td className={styles.esiCell}><ESIScore score={planet.esi} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button 
          onClick={() => onPageChange(Math.max(1, page - 1))} 
          disabled={page === 1}
          className={styles.paginationBtn}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>
          Page {page} of {totalPages} ({planets.length} planets)
        </span>
        <button 
          onClick={() => onPageChange(Math.min(totalPages, page + 1))} 
          disabled={page === totalPages}
          className={styles.paginationBtn}
        >
          Next
        </button>
      </div>
    </>
  );
}
