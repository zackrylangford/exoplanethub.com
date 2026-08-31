'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FilterState, parseFilters, serializeFilters } from '@/lib/planetFilters';

const WRITE_DELAY_MS = 300;

export function useFilterParams(): [FilterState, (next: FilterState) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();

  const [unwritten, setUnwritten] = useState<FilterState | null>(null);
  const [lastQuery, setLastQuery] = useState(query);
  const pendingWrite = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The URL is the truth and reclaims it the moment it moves on its own — Back/Forward, or
  // params arriving after hydration on a prerendered page — so a stale edit cannot resurrect.
  let edit = unwritten;
  if (query !== lastQuery) {
    setLastQuery(query);
    setUnwritten(null);
    edit = null;
  }

  // Memoised so the filter object stays referentially stable, keeping callers' memos alive.
  const fromUrl = useMemo(() => parseFilters(new URLSearchParams(query)), [query]);

  // A queued write describes the URL it was queued from; once that moved, it is stale.
  useEffect(() => () => clearTimeout(pendingWrite.current), [query]);

  const update = useCallback(
    (next: FilterState) => {
      setUnwritten(next);
      const serialized = serializeFilters(next);

      clearTimeout(pendingWrite.current);
      pendingWrite.current = setTimeout(() => {
        router.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false });
      }, WRITE_DELAY_MS);
    },
    [pathname, router],
  );

  return [edit ?? fromUrl, update];
}
