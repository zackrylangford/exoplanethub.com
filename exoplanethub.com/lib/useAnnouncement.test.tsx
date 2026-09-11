import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAnnouncement } from '@/lib/useAnnouncement';

afterEach(() => {
  vi.useRealTimers();
});

describe('useAnnouncement', () => {
  it('announces the first text without waiting, so a page opens complete', () => {
    const { result } = renderHook(() => useAnnouncement('Showing 12 of 6000 planets'));

    expect(result.current).toBe('Showing 12 of 6000 planets');
  });

  it('speaks a change only once the text has stood still for half a second, skipping what came between', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ text }) => useAnnouncement(text), { initialProps: { text: 'k' } });

    rerender({ text: 'ke' });
    act(() => vi.advanceTimersByTime(400));
    rerender({ text: 'kep' });
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe('k');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('kep');
  });
});
