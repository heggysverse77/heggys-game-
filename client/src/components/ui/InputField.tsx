import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export default function InputField({
  label,
  error,
  hint,
  icon,
  className = '',
  id,
  ...props
}: InputFieldProps) {
  const inputId = id ?? (label ? label.replace(/\s+/g, '-') : undefined);

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
          dir="auto"
          className={['hv-input', error ? 'hv-input-error' : '', className].filter(Boolean).join(' ')}
          style={icon ? { paddingInlineStart: 42 } : undefined}
          {...props}
        />
      </div>
      {error && <p className="hv-error-text">{error}</p>}
      {hint && !error && <p className="hv-helper">{hint}</p>}
    </div>
  );
}
