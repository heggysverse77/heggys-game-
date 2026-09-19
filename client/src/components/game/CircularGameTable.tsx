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
  statusText?: string;
  isAssignedInMatching?: boolean;
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
  radiusPercent = 42,
}: CircularGameTableProps) {
  const total = players.length;

  return (
    <div className={`relative flex flex-col items-center justify-center w-full ${className}`}>
      <div
        className="relative flex items-center justify-center select-none my-2 sm:my-4"
        style={{
          width: 'clamp(280px, min(92vw, 80vh), 520px)',
          height: 'clamp(280px, min(92vw, 50vh), 520px)',
          maxWidth: '94vw',
        }}
      >
        {/* SVG Orbital Dashed Ring Connecting All Player Nodes */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r={radiusPercent}
            fill="none"
            stroke="rgba(51, 169, 172, 0.45)"
            strokeWidth="1.2"
            strokeDasharray="2 3"
            opacity="0.9"
          />
        </svg>

        {/* Center Content Slot (Question Disk or Matching Answer Stack) */}
        <div className="relative z-10 w-[72%] h-[72%] flex items-center justify-center p-2 sm:p-4">
          {children}
        </div>

        {/* Perimeter Player Nodes Connected to Orbit */}
        {players.map((player, index) => {
          // Standard 12 o'clock start position
          const angle = (2 * Math.PI * index) / (total || 1) - Math.PI / 2;
          const xPercent = 50 + radiusPercent * Math.cos(angle);
          const yPercent = 50 + radiusPercent * Math.sin(angle);
          const isTop = yPercent < 35;

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
              className="absolute z-20 flex flex-col items-center pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => isClickable && onPlayerClick?.(player)}
                disabled={!isClickable}
                className={[
                  'flex items-center group relative outline-none transition-transform duration-150',
                  isTop ? 'flex-col-reverse' : 'flex-col',
                  isClickable ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default',
                ].join(' ')}
              >
                {/* Avatar Badge with Comic Border */}
                <div className="relative">
                  <div
                    className={[
                      'rounded-full p-1 transition-all duration-150 shadow-[3px_3px_0px_#1A1A1A] border-2.5 sm:border-3',
                      isSelected
                        ? 'bg-[#FFA646] border-[#1A1A1A] ring-4 ring-[#FFA646] scale-105'
                        : player.isAssignedInMatching
                        ? 'bg-[#33A9AC]/20 border-[#33A9AC] ring-2 ring-[#33A9AC]'
                        : player.hasActed
                        ? 'bg-[#33A9AC]/30 border-[#1A1A1A]'
                        : 'bg-[#FFF6E5] border-[#1A1A1A]',
                    ].join(' ')}
                  >
                    <Avatar
                      avatarId={player.avatarId ? String(player.avatarId) : undefined}
                      nickname={player.nickname}
                      size="md"
                      ring="none"
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 border-1.5 border-[#1A1A1A]"
                    />
                  </div>

                  {/* 1. Finished Action Badge (Green Checkmark) */}
                  {player.hasActed ? (
                    <div className="absolute -top-1 -right-1 z-30 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#33A9AC] border-2 border-[#1A1A1A] text-white flex items-center justify-center text-xs font-black shadow-[1.5px_1.5px_0px_#1A1A1A] animate-[pop_0.2s_ease]">
                      <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                    </div>
                  ) : (
                    /* 2. Still Thinking / Answering / Matching Loading Chip */
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FFA646] text-[#1A1A1A] border-1.5 border-[#1A1A1A] text-[9px] sm:text-[10px] font-display font-black shadow-[1px_1px_0px_#1A1A1A] flex items-center gap-1 animate-pulse whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] animate-ping shrink-0" />
                      <span>{player.statusText || 'يفكر...'}</span>
                    </div>
                  )}
                </div>

                {/* Nickname pill badge */}
                <div
                  className={[
                    'px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-[13px] font-display font-black border-2 transition-all max-w-[100px] sm:max-w-[130px] truncate shadow-[2px_2px_0px_#1A1A1A] z-30 leading-none flex items-center gap-1',
                    isTop ? 'mb-1' : 'mt-1',
                    isSelected
                      ? 'bg-[#FFA646] text-[#1A1A1A] border-[#1A1A1A] scale-105'
                      : player.isAssignedInMatching
                      ? 'bg-[#33A9AC] text-white border-[#1A1A1A]'
                      : 'bg-[#FFF6E5] text-[#1A1A1A] border-[#1A1A1A]',
                  ].join(' ')}
                >
                  <span className="truncate">{player.nickname}</span>
                  {player.isAssignedInMatching && <span className="text-[10px]">🔗</span>}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Optional bottom badge (Timer / Counter) */}
      {footerBadge && <div className="mt-1 sm:mt-2 z-20">{footerBadge}</div>}
    </div>
  );
}
