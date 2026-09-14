import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti() {
  const celebrate = useCallback(() => {
    // Main burst
    confetti({
      particleCount: 180,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#f5c842', '#e91e8c', '#00c9b1', '#7b2fff', '#ff7b2f'],
    });

    // Side cannons after 300ms
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
      confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
    }, 300);
  }, []);

  const smallPop = useCallback(() => {
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#f5c842', '#00c9b1'],
    });
  }, []);

  return { celebrate, smallPop };
}
