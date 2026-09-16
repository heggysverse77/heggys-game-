import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warn';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

const typeClasses: Record<ToastType, string> = {
  success: 'bg-[#33A9AC] text-white border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]',
  error:   'bg-[#F86041] text-white border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]',
  info:    'bg-[#FFF6E5] text-[#1A1A1A] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]',
  warn:    'bg-[#FFA646] text-[#1A1A1A] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]',
};

const typeIcons: Record<ToastType, string> = {
  success: '✨',
  error:   '💥',
  info:    '💡',
  warn:    '⚡',
};

export default function Toast({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={[
        'fixed top-5 right-1/2 translate-x-1/2 z-[100] pointer-events-auto',
        'inline-flex items-center gap-3 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full',
        'border-2.5 sm:border-3 font-body font-black text-sm sm:text-base select-none',
        'transition-all duration-300 shrink-0 whitespace-nowrap max-w-[90vw]',
        typeClasses[type],
        visible
          ? 'opacity-100 translate-y-0 scale-100 animate-[pop_0.2s_ease]'
          : 'opacity-0 -translate-y-3 scale-95',
      ].join(' ')}
      role="alert"
      dir="rtl"
    >
      <span className="text-lg sm:text-xl shrink-0">{typeIcons[type]}</span>
      <span className="truncate">{message}</span>
    </div>
  );
}

/* --- Toast Manager hook (simple global queue) --- */
// Usage: import { useToast } from './Toast';
// const { showToast } = useToast();
// showToast({ message: 'تم!', type: 'success' });

import { createContext, useCallback, useContext, useRef } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (opts: Omit<ToastItem, 'id'>) => void;
}

export const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, ...opts }]);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 inset-x-0 flex flex-col items-center gap-2 z-[100] pointer-events-none">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onDismiss={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
