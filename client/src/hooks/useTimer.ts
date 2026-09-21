import { useEffect, useRef, useState, useCallback } from 'react';

interface UseTimerReturn {
  remaining: number;
  progress: number; // 0.0 → 1.0 (1 = full)
  isExpired: boolean;
  phase: 'safe' | 'warn' | 'danger';
  reset: (newSeconds?: number) => void;
}

/**
 * Robust countdown timer using absolute timestamps (Date.now())
 * Prevents mobile pauses, interval drift, and stale closure freezes.
 */
export function useTimer(
  totalSeconds: number,
  active = true,
  resetKey?: string | number | null
): UseTimerReturn {
  const [remaining, setRemaining] = useState(() => Math.max(0, totalSeconds));
  const endTimeRef = useRef<number>(Date.now() + Math.max(0, totalSeconds) * 1000);
  const totalDurationRef = useRef<number>(Math.max(1, totalSeconds));

  // Initialize or reset when totalSeconds or resetKey changes
  useEffect(() => {
    const sec = Math.max(0, totalSeconds);
    totalDurationRef.current = Math.max(1, sec);
    endTimeRef.current = Date.now() + sec * 1000;
    setRemaining(sec);
  }, [totalSeconds, resetKey]);

  useEffect(() => {
    if (!active) return;

    const tick = () => {
      const now = Date.now();
      const diffMs = endTimeRef.current - now;
      const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));
      setRemaining(secondsLeft);
    };

    // Run first tick immediately
    tick();

    // High frequency interval (every 200ms) to ensure smooth seconds transition
    const interval = setInterval(tick, 200);

    // Recalculate immediately when mobile Safari resumes from background / screen lock
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [active]);

  const progress = totalDurationRef.current > 0 ? remaining / totalDurationRef.current : 0;
  const phase = progress > 0.5 ? 'safe' : progress > 0.25 ? 'warn' : 'danger';

  const reset = useCallback((newSeconds?: number) => {
    const sec = Math.max(0, newSeconds ?? totalDurationRef.current);
    totalDurationRef.current = Math.max(1, sec);
    endTimeRef.current = Date.now() + sec * 1000;
    setRemaining(sec);
  }, []);

  return {
    remaining,
    progress,
    isExpired: remaining === 0,
    phase,
    reset,
  };
}
