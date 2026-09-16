import type { ReactNode } from 'react';
import { useEffect } from 'react';

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

const sizeMaxWidth: Record<string, string> = {
  sm: 'min(92vw,480px)',
  md: 'min(94vw,640px)',
  lg: 'min(95vw,760px)',
  xl: 'min(96vw,980px)',
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
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
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
      className="hv-modal-backdrop"
      role="dialog"
      aria-modal="true"
      dir="rtl"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className="hv-modal"
        style={{ width: sizeMaxWidth[size] }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="hv-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              {icon && (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg,#FFA646,#F86041)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                {title && <h2 className="hv-modal-title">{title}</h2>}
                {subtitle && <p className="hv-modal-subtitle">{subtitle}</p>}
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hv-btn hv-btn-ghost hv-btn-sm"
                style={{ minWidth: 40, padding: '8px 12px' }}
                aria-label="إغلاق"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="hv-modal-body">{children}</div>

        {footer && <div className="hv-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
