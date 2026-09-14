import { useEffect, useRef, useState } from 'react';

interface UseTimerReturn {
  remaining: number;
  progress: number; // 0.0 → 1.0 (1 = full)
  isExpired: boolean;
  phase: 'safe' | 'warn' | 'danger';
}

export function useTimer(totalSeconds: number, active = true): UseTimerReturn {
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!active || remaining <= 0) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [active, totalSeconds]);

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const phase = progress > 0.5 ? 'safe' : progress > 0.25 ? 'warn' : 'danger';

  return {
    remaining,
    progress,
    isExpired: remaining === 0,
    phase,
  };
}
