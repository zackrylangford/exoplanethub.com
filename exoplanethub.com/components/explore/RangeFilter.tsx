'use client';
import { useId, useMemo } from 'react';
import { Range, isRangeActive, parseBound } from '@/lib/planetFilters';
import { logScale, toSignificantDigits } from './logScale';
import styles from './RangeFilter.module.css';

interface RangeFilterProps {
  label: string;
  unit: string;
  missingNote: string;
  extent: Range;
  value: Range;
  onChange: (next: Range) => void;
}

export default function RangeFilter({
  label,
  unit,
  missingNote,
  extent,
  value,
  onChange,
}: RangeFilterProps) {
  const ids = useId();
  const scale = useMemo(() => logScale(extent), [extent]);

  const noteId = `${ids}-note`;
  const describedBy = isRangeActive(value) ? noteId : undefined;
  const setBound = (edge: 'min' | 'max', raw: string) =>
    onChange({ ...value, [edge]: parseBound(raw) ?? null });

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>
        {label} <span className={styles.unit}>({unit})</span>
      </legend>

      <div className={styles.bounds}>
        <label className={styles.boundLabel} htmlFor={`${ids}-min`}>
          Min
        </label>
        <input
          id={`${ids}-min`}
          type="number"
          className={styles.number}
          value={value.min ?? ''}
          placeholder={scale ? String(toSignificantDigits(scale.min)) : ''}
          aria-describedby={describedBy}
          onChange={(event) => setBound('min', event.target.value)}
        />
        <label className={styles.boundLabel} htmlFor={`${ids}-max`}>
          Max
        </label>
        <input
          id={`${ids}-max`}
          type="number"
          className={styles.number}
          value={value.max ?? ''}
          placeholder={scale ? String(toSignificantDigits(scale.max)) : ''}
          aria-describedby={describedBy}
          onChange={(event) => setBound('max', event.target.value)}
        />
      </div>

      {scale && (
        <div className={styles.track}>
          <input
            type="range"
            className={styles.thumb}
            aria-label={`${label} lower bound`}
            aria-describedby={describedBy}
            min={0}
            max={value.max === null ? scale.steps : scale.toPosition(value.max)}
            value={scale.toPosition(value.min ?? scale.min)}
            onChange={(event) =>
              onChange({ ...value, min: scale.toValue(Number(event.target.value)) })
            }
          />
          <input
            type="range"
            className={styles.thumb}
            aria-label={`${label} upper bound`}
            aria-describedby={describedBy}
            min={value.min === null ? 0 : scale.toPosition(value.min)}
            max={scale.steps}
            value={scale.toPosition(value.max ?? scale.max)}
            onChange={(event) =>
              onChange({ ...value, max: scale.toValue(Number(event.target.value)) })
            }
          />
        </div>
      )}

      {describedBy && (
        <p className={styles.note} id={noteId}>
          {missingNote}
        </p>
      )}
    </fieldset>
  );
}
