import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warn';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

const typeClasses: Record<ToastType, string> = {
  success: 'border-heggy-green bg-heggy-green/20 text-heggy-green',
  error:   'border-heggy-pink bg-heggy-pink/20 text-heggy-pink',
  info:    'border-heggy-teal bg-heggy-teal/20 text-heggy-teal',
  warn:    'border-heggy-orange bg-heggy-orange/20 text-heggy-orange',
};

const typeIcons: Record<ToastType, string> = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warn:    '⚠️',
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
        'fixed top-4 right-1/2 translate-x-1/2 z-[100]',
        'flex items-center gap-3 px-5 py-3 rounded-2xl',
        'border backdrop-blur-md font-body font-semibold text-sm',
        'shadow-xl transition-all duration-300',
        typeClasses[type],
        visible
          ? 'opacity-100 translate-y-0 animate-[slideUp_0.3s_ease]'
          : 'opacity-0 -translate-y-2',
      ].join(' ')}
      role="alert"
    >
      <span>{typeIcons[type]}</span>
      <span>{message}</span>
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
