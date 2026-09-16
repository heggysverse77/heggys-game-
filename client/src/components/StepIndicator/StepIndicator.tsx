import type { ReactNode } from 'react';

export interface Step {
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  className?: string;
}

export default function StepIndicator({ steps, className = '' }: StepIndicatorProps) {
  return (
    <div className={`hv-steps ${className}`}>
      {steps.map((step, i) => (
        <div key={i} className={`hv-card hv-step hv-step-${(i % 3) + 1}`}>
          <div className="hv-step-circle">
            {step.icon ?? <span>{i + 1}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="hv-step-label">
              {String(i + 1).padStart(2, '0')} — {step.title}
            </div>
            {step.description && <div className="hv-step-desc">{step.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
