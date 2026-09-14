import { useState, useEffect } from 'react';
import { avatarPath } from '../../utils/avatar.utils';

interface AvatarProps {
  avatarId?: string;
  nickname?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  ring?: 'gold' | 'teal' | 'pink' | 'purple' | 'orange' | 'none';
  showNickname?: boolean;
  isConnected?: boolean;
  animate?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-18 h-18',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32',
  '3xl': 'w-40 h-40',
};

const textSizeClasses = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  '2xl': 'text-xl',
  '3xl': 'text-2xl',
};

const ringClasses = {
  gold:   'ring-3 ring-heggy-gold shadow-[0_0_15px_rgba(255,183,3,0.5)]',
  orange: 'ring-3 ring-heggy-orange shadow-[0_0_15px_rgba(255,107,0,0.5)]',
  teal:   'ring-3 ring-heggy-teal shadow-[0_0_15px_rgba(0,201,177,0.4)]',
  pink:   'ring-3 ring-heggy-pink shadow-[0_0_15px_rgba(255,56,56,0.4)]',
  purple: 'ring-3 ring-heggy-orange shadow-[0_0_15px_rgba(255,107,0,0.4)]',
  none:   '',
};

export default function Avatar({
  avatarId,
  nickname,
  size = 'md',
  ring = 'orange',
  showNickname = false,
  isConnected,
  animate = false,
  className = '',
  onClick,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const src = avatarPath(avatarId);

  useEffect(() => {
    setImgError(false);
  }, [avatarId]);

  return (
    <div 
      className={`flex flex-col items-center gap-1.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="relative inline-block transition-transform duration-200 hover:scale-105">
        {!imgError ? (
          <img
            key={src}
            src={src}
            alt={nickname ?? 'لاعب'}
            onError={() => setImgError(true)}
            draggable={false}
            className={[
              sizeClasses[size],
              'rounded-full object-cover select-none bg-heggy-card/90 transition-all duration-300',
              ringClasses[ring],
              animate ? 'animate-[float_3s_ease-in-out_infinite]' : '',
            ].join(' ')}
          />
        ) : (
          <div
            className={[
              sizeClasses[size],
              'rounded-full select-none bg-gradient-to-br from-heggy-orange to-heggy-gold flex items-center justify-center font-bold text-white shadow-md',
              ringClasses[ring],
              textSizeClasses[size],
            ].join(' ')}
          >
            {nickname ? nickname.slice(0, 2).toUpperCase() : '🔥'}
          </div>
        )}

        {/* Online indicator dot */}
        {isConnected !== undefined && (
          <span
            className={[
              'absolute bottom-0 left-0 rounded-full border-2 border-heggy-deep shadow-md',
              size === 'xs' || size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
              isConnected ? 'bg-heggy-green animate-pulse' : 'bg-gray-500',
            ].join(' ')}
          />
        )}
      </div>

      {showNickname && nickname && (
        <span
          className={[
            'font-body font-bold text-white truncate max-w-[7rem] text-center drop-shadow',
            textSizeClasses[size],
          ].join(' ')}
        >
          {nickname}
        </span>
      )}
    </div>
  );
}
