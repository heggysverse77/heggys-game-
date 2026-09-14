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
    <div className="flex flex-col gap-2 w-full text-right" dir="rtl">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[#1A1A1A] text-sm sm:text-base font-body font-black select-none"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70 pointer-events-none text-xl z-10">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          dir="auto"
          className={[
            'w-full h-13 sm:h-14 rounded-xl sm:rounded-2xl font-body text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-right',
            'bg-white border-2.5 border-[#1A1A1A] transition-all duration-150 outline-none text-base sm:text-lg font-bold shadow-inner',
            icon ? 'pr-12 pl-4' : 'px-4 sm:px-5',
            error
              ? 'border-red-500 focus:ring-3 focus:ring-red-500/30'
              : 'focus:border-[#1A1A1A] focus:ring-3 focus:ring-[#F6BD60]/50',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-600 text-xs sm:text-sm font-body font-bold animate-[slideUp_0.15s_ease]">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[#1A1A1A]/70 text-xs font-body font-medium">{hint}</p>
      )}
    </div>
  );
}
