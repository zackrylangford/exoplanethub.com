import styles from './EmptySlot.module.css';

// Pick order, not left/right: Swap and the mobile reflow cannot make "first" lie.
export type Slot = 'first' | 'second';

interface EmptySlotProps {
  slot: Slot;
  unknownName: string | null;
}

export default function EmptySlot({ slot, unknownName }: EmptySlotProps) {
  return (
    <div className={styles.slot}>
      {unknownName !== null && (
        <p className={styles.unknown}>We don&apos;t have a planet called {unknownName}</p>
      )}
      <p className={styles.picker}>Search for the {slot} planet</p>
    </div>
  );
}
