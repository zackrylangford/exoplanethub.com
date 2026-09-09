import Link from 'next/link';
import type { Cell, ComparisonSection } from '@/lib/planetComparison';
import { planetUrl } from '@/lib/planetUrl';
import styles from './ComparisonTable.module.css';

export interface ColumnNames {
  a: string;
  b: string;
}

interface ComparisonTableProps {
  sections: ComparisonSection[];
  names: ColumnNames;
}

// Every role is explicit: the mobile reflow puts grid on the rows, which strips native table semantics.
export default function ComparisonTable({ sections, names }: ComparisonTableProps) {
  return (
    <table className={styles.table} role="table">
      <thead className={styles.head} role="rowgroup">
        <tr className={styles.row} role="row">
          <th className={styles.corner} role="columnheader">
            <span className={styles.visuallyHidden}>Stat</span>
          </th>
          <PlanetHeader name={names.a} />
          <PlanetHeader name={names.b} />
        </tr>
      </thead>
      {sections.map((section) => (
        <SectionBody key={section.id} section={section} />
      ))}
    </table>
  );
}

// The name alone: a screen reader repeats a column header every time a row crosses it.
function PlanetHeader({ name }: { name: string }) {
  return (
    <th className={styles.planet} role="columnheader" scope="col">
      <Link className={styles.planetLink} href={planetUrl(name)}>
        {name}
      </Link>
    </th>
  );
}

function SectionBody({ section: { title, rows, note } }: { section: ComparisonSection }) {
  return (
    <tbody className={styles.body} role="rowgroup">
      <tr className={styles.row} role="row">
        <th className={styles.sectionTitle} role="rowheader" colSpan={3} aria-colspan={3}>
          {title}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.id} className={styles.row} role="row">
          <th className={styles.label} role="rowheader" scope="row">
            {row.label}
          </th>
          <ValueCell cell={row.a} />
          <ValueCell cell={row.b} />
        </tr>
      ))}
      {note !== null && (
        <tr className={styles.row} role="row">
          <td className={styles.note} role="cell" colSpan={3} aria-colspan={3}>
            {note}
          </td>
        </tr>
      )}
    </tbody>
  );
}

// Side by side, a gap is the information, so absence gets words rather than the planet page's dash.
function ValueCell({ cell: { value, note } }: { cell: Cell }) {
  return (
    <td className={styles.value} role="cell">
      {value === null ? <span className={styles.notMeasured}>Not measured</span> : <span>{value}</span>}
      {note !== null && <span className={styles.ratio}>{note}</span>}
    </td>
  );
}
