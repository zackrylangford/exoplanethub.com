import PlanetPicker, { type Slot } from './PlanetPicker';
import styles from './EmptySlot.module.css';

interface EmptySlotProps {
  slot: Slot;
  unknownName: string | null;
  otherName: string | null;
  excludedPlanetName: string | null;
}

export default function EmptySlot({ slot, unknownName, otherName, excludedPlanetName }: EmptySlotProps) {
  return (
    <div className={styles.slot}>
      {unknownName !== null && (
        <p className={styles.unknown}>We don&apos;t have a planet called {unknownName}</p>
      )}
      <PlanetPicker slot={slot} otherName={otherName} excludedPlanetName={excludedPlanetName} />
    </div>
  );
}
