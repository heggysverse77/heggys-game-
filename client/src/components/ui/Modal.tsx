import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
}

const sizeClasses = {
  sm: 'w-[min(92vw,480px)]',
  md: 'w-[min(94vw,640px)]',
  lg: 'w-[min(95vw,760px)]',
  xl: 'w-[min(96vw,980px)]',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  // Lock body scroll and handle Escape key when open
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.15s_ease] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 pointer-events-auto"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* ── 3-Part Modal Shell: Fixed Header, Scrollable Body, Fixed Footer ── */}
      <div
        className={[
          'relative z-10 my-auto bg-[#FFF6E5] text-[#1A1A1A]',
          'border-3 border-[#1A1A1A] rounded-2xl sm:rounded-3xl',
          'shadow-[6px_6px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A]',
          'flex flex-col max-h-[min(90vh,840px)] overflow-hidden',
          'animate-[pop_0.2s_ease] select-none text-right',
          sizeClasses[size],
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. FIXED HEADER */}
        {(title || onClose) && (
          <div className="flex-shrink-0 px-5 sm:px-7 py-4 sm:py-5 border-b-2.5 border-[#1A1A1A] bg-[#FFF6E5] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#F6BD60] border-2 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h2 className="text-lg sm:text-2xl font-display font-black text-[#1A1A1A] leading-tight truncate">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-[#1A1A1A]/70 font-body font-bold mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F28482] hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
          </div>
        )}

        {/* 2. SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 sm:py-6 flex flex-col gap-5 sm:gap-6 custom-scrollbar">
          {children}
        </div>

        {/* 3. FIXED FOOTER */}
        {footer && (
          <div className="flex-shrink-0 px-5 sm:px-7 py-4 sm:py-5 border-t-2.5 border-[#1A1A1A] bg-[#FFF6E5] flex items-center justify-end gap-3 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
