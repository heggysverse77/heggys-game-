import React from 'react';
import { Avatar } from '../ui';
import { Check } from 'lucide-react';

export interface TablePlayer {
  id: string;
  nickname: string;
  avatarId?: number | string;
  isHost?: boolean;
  hasActed?: boolean;
  isMe?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
}

interface CircularGameTableProps {
  players: TablePlayer[];
  activePlayerId?: string | null;
  onPlayerClick?: (player: TablePlayer) => void;
  children?: React.ReactNode;
  footerBadge?: React.ReactNode;
  className?: string;
  radiusPercent?: number;
}

export default function CircularGameTable({
  players,
  activePlayerId,
  onPlayerClick,
  children,
  footerBadge,
  className = '',
  radiusPercent = 41,
}: CircularGameTableProps) {
  const total = players.length;

  return (
    <div className={`relative flex flex-col items-center justify-center w-full ${className}`}>
      {/* Circular Game Table */}
      <div className="relative w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] md:w-[580px] md:h-[580px] lg:w-[640px] lg:h-[640px] max-w-[96vw] max-h-[96vw] flex items-center justify-center select-none my-2">
        
        {/* Outer Table Rim (Warm Gold) */}
        <div className="absolute inset-0 rounded-full bg-[#F6BD60] border-3 sm:border-4 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A]" />

        {/* Inner Table Felt Surface (Warm Cream) */}
        <div className="absolute inset-[3.5%] sm:inset-[4%] rounded-full bg-[#FFF6E5] border-2 sm:border-3 border-[#1A1A1A] shadow-inner" />

        {/* Dashed Accent Perimeter Ring */}
        <div className="absolute inset-[7%] sm:inset-[8%] rounded-full border-2 border-dashed border-[#F28482]/40 pointer-events-none" />

        {/* Center Content Slot (Question Disk or Matching Slot) */}
        <div className="relative z-10 w-[72%] h-[72%] flex items-center justify-center p-2 sm:p-4">
          {children}
        </div>

        {/* Perimeter Player Nodes */}
        {players.map((player, index) => {
          const angle = (2 * Math.PI * index) / (total || 1) - Math.PI / 2;
          const xPercent = 50 + radiusPercent * Math.cos(angle);
          const yPercent = 50 + radiusPercent * Math.sin(angle);
          const isTopHalf = yPercent < 45;

          const isClickable = Boolean(onPlayerClick && !player.isDisabled);
          const isSelected = activePlayerId === player.id || player.isSelected;

          return (
            <div
              key={player.id || index}
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-30 flex flex-col items-center pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => isClickable && onPlayerClick?.(player)}
                disabled={!isClickable}
                className={[
                  'flex items-center group relative outline-none transition-transform duration-150',
                  isTopHalf ? 'flex-col-reverse' : 'flex-col',
                  isClickable ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default',
                ].join(' ')}
              >
                {/* Avatar Badge */}
                <div className="relative">
                  <div
                    className={[
                      'rounded-full p-1 sm:p-1.5 transition-all duration-150 shadow-[2px_2px_0px_#1A1A1A] border-2 sm:border-2.5 border-[#1A1A1A]',
                      isSelected
                        ? 'bg-[#F6BD60] ring-3 ring-[#F6BD60]/80 scale-105 shadow-[0_0_15px_rgba(246,189,96,0.8)]'
                        : player.hasActed
                        ? 'bg-[#38A3A5]/30'
                        : 'bg-[#FFF6E5]',
                    ].join(' ')}
                  >
                    <Avatar
                      avatarId={player.avatarId ? String(player.avatarId) : undefined}
                      nickname={player.nickname}
                      size="md"
                      ring="none"
                      className="w-10 h-10 sm:w-13 sm:h-13 md:w-15 md:h-15 border-1.5 border-[#1A1A1A]"
                    />
                  </div>

                  {/* Completed action checkmark */}
                  {player.hasActed && (
                    <div className="absolute -top-1 -right-1 z-40 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#38A3A5] border-1.5 border-[#1A1A1A] text-white flex items-center justify-center text-xs font-black shadow-xs animate-[pop_0.2s_ease]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Nickname pill */}
                <div
                  className={[
                    'px-2 py-0.5 rounded-full text-[10px] sm:text-xs md:text-sm font-body font-black border-1.5 border-[#1A1A1A] transition-all max-w-[80px] sm:max-w-[120px] truncate shadow-xs z-40',
                    isTopHalf ? 'mb-1' : 'mt-1',
                    isSelected
                      ? 'bg-[#F6BD60] text-[#1A1A1A] scale-105'
                      : 'bg-[#FFF6E5] text-[#1A1A1A]',
                  ].join(' ')}
                >
                  {player.nickname}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Badge (Timer) */}
      {footerBadge && (
        <div className="mt-2 sm:mt-4 z-20 animate-[slideUp_0.25s_ease]">
          {footerBadge}
        </div>
      )}
    </div>
  );
}
