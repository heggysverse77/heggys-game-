import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type SoundName =
  | 'join'
  | 'submit'
  | 'correct'
  | 'wrong'
  | 'round_start'
  | 'win'
  | 'dare'
  | 'tick';

interface SoundContextValue {
  soundEnabled: boolean;
  toggleSound: () => void;
  play: (name: SoundName) => void;
}

const SOUND_PATHS: Record<SoundName, string> = {
  join:        '/sounds/join.mp3',
  submit:      '/sounds/submit.mp3',
  correct:     '/sounds/correct.mp3',
  wrong:       '/sounds/wrong.mp3',
  round_start: '/sounds/round_start.mp3',
  win:         '/sounds/win.mp3',
  dare:        '/sounds/dare.mp3',
  tick:        '/sounds/tick.mp3',
};

const SoundContext = createContext<SoundContextValue>({
  soundEnabled: true,
  toggleSound: () => {},
  play: () => {},
});

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCache = useRef<Map<SoundName, HTMLAudioElement>>(new Map());

  const play = useCallback((name: SoundName) => {
    if (!soundEnabled) return;

    let audio = audioCache.current.get(name);
    if (!audio) {
      audio = new Audio(SOUND_PATHS[name]);
      audio.preload = 'auto';
      audioCache.current.set(name, audio);
    }

    audio.currentTime = 0;
    audio.play().catch(() => {}); // Ignore autoplay restrictions
  }, [soundEnabled]);

  const toggleSound = useCallback(() => setSoundEnabled((prev) => !prev), []);

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, play }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
