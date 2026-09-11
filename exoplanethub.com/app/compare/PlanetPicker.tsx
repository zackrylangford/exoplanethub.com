'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import type { PlanetSummary } from '@/lib/mockPlanets';
import { planetMatcher } from '@/lib/planetFilters';
import { measurement } from '@/lib/planetStats';
import { compareUrl } from '@/lib/planetUrl';
import { useAnnouncement } from '@/lib/useAnnouncement';
import { loadPlanetArchive } from './planetArchive';
import styles from './PlanetPicker.module.css';

// Pick order, not left/right: Swap and the mobile reflow cannot make "first" lie.
export type Slot = 'first' | 'second';

const MAX_SUGGESTIONS = 8;

type Archive =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'loaded'; planets: PlanetSummary[] };

interface PlanetPickerProps {
  slot: Slot;
  // The other column's URL name travels into the pushed URL; its resolved planet is never offered.
  otherName: string | null;
  excludedPlanetName: string | null;
}

export default function PlanetPicker({ slot, otherName, excludedPlanetName }: PlanetPickerProps) {
  const router = useRouter();
  const id = useId();
  const [archive, setArchive] = useState<Archive>({ status: 'idle' });
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const matches = useMemo(
    () => (archive.status === 'loaded' ? matching(archive.planets, query, excludedPlanetName) : []),
    [archive, query, excludedPlanetName]
  );
  const suggestions = matches.slice(0, MAX_SUGGESTIONS);
  const expanded = open && suggestions.length > 0;
  // The list can shrink beneath a remembered index, so the active option is re-derived each render.
  const active = expanded && activeIndex !== null && activeIndex < suggestions.length ? activeIndex : null;

  const inputId = `${id}-input`;
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const activeOptionId = active === null ? undefined : optionId(active);

  useEffect(() => {
    if (activeOptionId !== undefined) document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' });
  }, [activeOptionId]);

  const status = statusLine(archive, query, open, suggestions.length, matches.length);
  const announced = useAnnouncement(status);

  function loadOnce() {
    if (archive.status === 'loading' || archive.status === 'loaded') return;
    setArchive({ status: 'loading' });
    loadPlanetArchive()
      .then((planets) => setArchive({ status: 'loaded', planets }))
      .catch(() => setArchive({ status: 'unavailable' }));
  }

  function close() {
    setOpen(false);
    setActiveIndex(null);
  }

  function choose(planet: PlanetSummary) {
    close();
    router.push(
      slot === 'first' ? compareUrl(planet.pl_name, otherName) : compareUrl(otherName, planet.pl_name)
    );
  }

  function step(direction: 1 | -1) {
    if (suggestions.length === 0) return;
    setOpen(true);
    if (active === null) setActiveIndex(direction === 1 ? 0 : suggestions.length - 1);
    else setActiveIndex((active + direction + suggestions.length) % suggestions.length);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      step(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && active !== null) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      close();
    }
  }

  return (
    <div className={styles.picker} data-slot={slot}>
      <label className={styles.label} htmlFor={inputId}>
        Search for the {slot} planet
      </label>
      <div className={styles.field}>
        <input
          id={inputId}
          className={styles.input}
          type="text"
          role="combobox"
          autoComplete="off"
          placeholder="Planet or star name"
          value={query}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          onFocus={() => {
            loadOnce();
            setOpen(true);
          }}
          onBlur={close}
          onChange={(event) => {
            loadOnce();
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(null);
          }}
          onKeyDown={onKeyDown}
        />
        {/* Pressing on the list must not blur the input, or it closes before the click lands. */}
        <ul
          id={listboxId}
          role="listbox"
          aria-label={`Suggestions for the ${slot} planet`}
          className={styles.listbox}
          hidden={!expanded}
          onMouseDown={(event) => event.preventDefault()}
        >
          {suggestions.map((planet, index) => {
            const planetHint = hint(planet);
            return (
              <li
                key={planet.pl_name}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                className={styles.option}
                onClick={() => choose(planet)}
              >
                <span className={styles.optionName}>{planet.pl_name}</span>
                {planetHint !== null && <span className={styles.optionHint}>{planetHint}</span>}
              </li>
            );
          })}
        </ul>
      </div>
      <p className={styles.status}>
        <span aria-hidden="true">{status}</span>
        <span className={styles.announcement} role="status">
          {announced}
        </span>
      </p>
    </div>
  );
}

function matching(
  planets: PlanetSummary[],
  query: string,
  excludedPlanetName: string | null
): PlanetSummary[] {
  if (query.trim() === '') return [];
  const matches = planetMatcher(query);
  return planets.filter((planet) => planet.pl_name !== excludedPlanetName && matches(planet));
}

function hint({ pl_rade, esi }: PlanetSummary): string | null {
  const radius = measurement(pl_rade, '× Earth');
  const parts = [radius === null ? null : `Radius ${radius}`, typeof esi === 'number' ? `ESI ${esi}` : null];
  const known = parts.filter((part): part is string => part !== null);
  return known.length === 0 ? null : known.join(' · ');
}

function statusLine(archive: Archive, query: string, open: boolean, shown: number, total: number): string {
  if (archive.status === 'unavailable') return "Couldn't load the planet list. Try again in a moment.";
  if (archive.status === 'loading') return 'Loading the planet list…';
  const needle = query.trim();
  if (archive.status !== 'loaded' || !open || needle === '') return '';
  if (total === 0) return `No planet or star matches “${needle}”`;
  return `Showing ${shown} of ${total} ${total === 1 ? 'planet' : 'planets'}`;
}
