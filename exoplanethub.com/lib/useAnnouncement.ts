'use client';
import { useEffect, useState } from 'react';

const SETTLE_DELAY_MS = 500;

// Live-region text that waits for the visitor to stop typing: spoken per keystroke, it talks over them.
export function useAnnouncement(text: string): string {
  const [announced, setAnnounced] = useState(text);

  // Re-running on every change is the debounce: the cleanup drops the announcement the last change queued.
  useEffect(() => {
    const timer = setTimeout(() => setAnnounced(text), SETTLE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [text]);

  return announced;
}
