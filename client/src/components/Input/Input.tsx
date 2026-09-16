import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
}

export default function Input({
  label,
  helper,
  hint,
  error,
  icon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? `hv-input-${label.replace(/\s+/g, '-')}` : undefined);
  const helperText = error ?? helper ?? hint;

  return (
    <div className="hv-field">
      {label && (
        <label htmlFor={inputId} className="hv-label">
          {label}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              insetInlineStart: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9E9E9E',
              pointerEvents: 'none',
              display: 'inline-flex',
            }}
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={['hv-input', error ? 'hv-input-error' : '', className].filter(Boolean).join(' ')}
          style={icon ? { paddingInlineStart: 42 } : undefined}
          {...props}
        />
      </div>
      {helperText && (
        <p className={error ? 'hv-error-text' : 'hv-helper'}>{helperText}</p>
      )}
    </div>
  );
}
