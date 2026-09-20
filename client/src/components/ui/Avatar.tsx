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
  xs: 'w-8 h-8 shrink-0',
  sm: 'w-10 h-10 shrink-0',
  md: 'w-14 h-14 shrink-0',
  lg: 'w-16 h-16 sm:w-18 sm:h-18 shrink-0',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 shrink-0',
  '2xl': 'w-28 h-28 sm:w-32 sm:h-32 shrink-0',
  '3xl': 'w-36 h-36 sm:w-40 sm:h-40 shrink-0',
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
  gold:   'ring-2.5 sm:ring-3 ring-[#F59E0B] border-2 border-[#1C1917] shadow-[2.5px_2.5px_0px_#1C1917]',
  cyan:   'ring-2.5 sm:ring-3 ring-[#0D9488] border-2 border-[#1C1917] shadow-[0_0_12px_rgba(13,148,136,0.4)]',
  teal:   'ring-2.5 sm:ring-3 ring-[#0D9488] border-2 border-[#1C1917] shadow-[2.5px_2.5px_0px_#1C1917]',
  pink:   'ring-2.5 sm:ring-3 ring-[#EA580C] border-2 border-[#1C1917] shadow-[2.5px_2.5px_0px_#1C1917]',
  orange: 'ring-2.5 sm:ring-3 ring-[#F59E0B] border-2 border-[#1C1917] shadow-[2.5px_2.5px_0px_#1C1917]',
  purple: 'ring-2.5 sm:ring-3 ring-[#991B1B] border-2 border-[#1C1917] shadow-[2.5px_2.5px_0px_#1C1917]',
  none:   'border-2 border-[#1C1917] shadow-[2px_2px_0px_#1C1917]',
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
      className={`flex flex-col items-center gap-1.5 shrink-0 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="relative inline-block transition-transform duration-200 hover:scale-105 shrink-0">
        {!imgError ? (
          <img
            key={src}
            src={src}
            alt={nickname ?? 'صورة اللاعب'}
            onError={() => setImgError(true)}
            draggable={false}
            className={[
              sizeClasses[size],
              'rounded-full object-cover select-none bg-[#FFF8EB] transition-all duration-300',
              ringClasses[ring],
              animate ? 'animate-[float_3s_ease-in-out_infinite]' : '',
            ].join(' ')}
          />
        ) : (
          <div
            className={[
              sizeClasses[size],
              'rounded-full select-none bg-gradient-to-br from-[#F59E0B] to-[#EA580C] flex items-center justify-center font-display font-black text-[#1C1917]',
              ringClasses[ring],
              textSizeClasses[size],
            ].join(' ')}
          >
            🤠
          </div>
        )}

        {/* Online indicator dot */}
        {isConnected !== undefined && (
          <span
            className={[
              'absolute bottom-0 left-0 rounded-full border-2 border-[#1C1917] shadow-md',
              size === 'xs' || size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
              isConnected ? 'bg-[#0D9488] animate-pulse' : 'bg-gray-400',
            ].join(' ')}
          />
        )}
      </div>

      {showNickname && nickname && (
        <span
          className={[
            'font-display font-black text-[#FFF8EB] drop-shadow-[2px_2px_0px_#1C1917] truncate max-w-[7.5rem] text-center',
            textSizeClasses[size],
          ].join(' ')}
        >
          {nickname}
        </span>
      )}
    </div>
  );
}

