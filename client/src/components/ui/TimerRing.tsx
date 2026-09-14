import { useEffect, useRef } from 'react';

interface TimerRingProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export default function TimerRing({
  totalSeconds,
  remainingSeconds,
  size = 72,
  strokeWidth = 6,
  showLabel = true,
  className = '',
}: TimerRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(1, totalSeconds);
  const progress = Math.max(0, Math.min(1, remainingSeconds / safeTotal));
  const dashOffset = circumference * (1 - progress);

  const isCritical = remainingSeconds <= 5;
  const isWarning = remainingSeconds > 5 && progress <= 0.4;

  const strokeColor = isCritical
    ? '#F28482'
    : isWarning
    ? '#F6BD60'
    : '#38A3A5';

  const textColorClass = isCritical
    ? 'text-[#F28482]'
    : isWarning
    ? 'text-[#F6BD60]'
    : 'text-[#38A3A5]';

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = String(dashOffset);
    }
  }, [dashOffset]);

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(26, 26, 26, 0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Animated progress ring */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>
      {showLabel && (
        <span
          className={[
            'absolute timer-number font-display font-black leading-none',
            size >= 72 ? 'text-lg sm:text-xl' : 'text-sm',
            textColorClass,
            isCritical ? 'animate-pulse scale-110' : '',
          ].join(' ')}
        >
          {remainingSeconds}
        </span>
      )}
    </div>
  );
}
