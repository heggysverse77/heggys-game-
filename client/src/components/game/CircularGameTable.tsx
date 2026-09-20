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
          width: 'clamp(300px, min(94vw, 78vh), 540px)',
          height: 'clamp(300px, min(94vw, 78vh), 540px)',
          maxWidth: '96vw',
        }}
      >
        {/* ── 1. AUTHENTIC WESTERN SALOON POKER TABLE (SVG BACKGROUND) ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0 shadow-2xl rounded-full"
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Rich Saloon Emerald Green Felt Gradient */}
            <radialGradient id="pokerFelt" cx="50%" cy="48%" r="52%">
              <stop offset="0%" stopColor="#155E45" />
              <stop offset="45%" stopColor="#0D4432" />
              <stop offset="80%" stopColor="#082E22" />
              <stop offset="100%" stopColor="#041B13" />
            </radialGradient>

            {/* Padded Saddle Leather / Walnut Wood Armrest Outer Ring */}
            <radialGradient id="leatherArmrest" cx="50%" cy="46%" r="54%">
              <stop offset="78%" stopColor="#54280E" />
              <stop offset="86%" stopColor="#78350F" />
              <stop offset="93%" stopColor="#3B1806" />
              <stop offset="100%" stopColor="#1A0902" />
            </radialGradient>

            {/* Brass / Gold Rivet Studs Gradient */}
            <radialGradient id="brassStud" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </radialGradient>
          </defs>

          {/* Outer Padded Leather Armrest Ring */}
          <circle cx="200" cy="200" r="192" fill="url(#leatherArmrest)" stroke="#1C1917" strokeWidth="5" />

          {/* Leather Double Stitching Line */}
          <circle cx="200" cy="200" r="185" fill="none" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.4" />
          <circle cx="200" cy="200" r="162" fill="none" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.4" />

          {/* 16 Brass Rivet Studs Around the Armrest */}
          {[...Array(16)].map((_, i) => {
            const angle = (i * 2 * Math.PI) / 16;
            const cx = 200 + 174 * Math.cos(angle);
            const cy = 200 + 174 * Math.sin(angle);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="4.2"
                fill="url(#brassStud)"
                stroke="#1C1917"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Inner Saloon Green Felt */}
          <circle cx="200" cy="200" r="154" fill="url(#pokerFelt)" stroke="#1C1917" strokeWidth="4" />

          {/* Gold Inlaid Betting Line & Orbit Ring */}
          <circle
            cx="200"
            cy="200"
            r="138"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.6"
          />
          <circle
            cx="200"
            cy="200"
            r="108"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            opacity="0.35"
          />

          {/* Classic Western Poker Card Suits Inlaid in Felt (♠ ♥ ♦ ♣) */}
          <g fill="#F59E0B" opacity="0.15" transform="scale(1)">
            <text x="200" y="78" textAnchor="middle" fontSize="16" fontWeight="900">♠</text>
            <text x="200" y="332" textAnchor="middle" fontSize="16" fontWeight="900">♥</text>
            <text x="74" y="206" textAnchor="middle" fontSize="16" fontWeight="900">♦</text>
            <text x="326" y="206" textAnchor="middle" fontSize="16" fontWeight="900">♣</text>
          </g>

          {/* Subtle Warm Light Glow over Table Center */}
          <circle cx="200" cy="190" r="75" fill="#FEF3C7" opacity="0.08" />
        </svg>

        {/* ── 2. CENTER CONTENT SLOT (Question Card / Answer Stack) ── */}
        <div className="relative z-10 w-[50%] h-[50%] sm:w-[54%] sm:h-[54%] max-w-[240px] sm:max-w-[290px] max-h-[240px] sm:max-h-[290px] flex items-center justify-center p-1 sm:p-2">
          {children}
        </div>

        {/* ── 3. PERIMETER PLAYER STATIONS (SEATS AROUND POKER TABLE) ── */}
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
                {/* Avatar Badge on Leather Poker Coaster */}
                <div className="relative">
                  <div
                    className={[
                      'rounded-full p-1 transition-all duration-200 shadow-[3px_3px_0px_#1C1917] border-2.5 sm:border-3',
                      isSelected
                        ? 'bg-[#F59E0B] border-[#1C1917] ring-4 ring-[#F59E0B] scale-105 shadow-[0_0_16px_rgba(245,158,11,0.7)]'
                        : player.isAssignedInMatching
                        ? 'bg-[#0D9488]/30 border-[#0D9488] ring-2 ring-[#0D9488]'
                        : player.hasActed
                        ? 'bg-[#155E45] border-[#F59E0B]'
                        : 'bg-[#FFF8EB] border-[#1C1917]',
                    ].join(' ')}
                  >
                    <Avatar
                      avatarId={player.avatarId ? String(player.avatarId) : undefined}
                      nickname={player.nickname}
                      size="md"
                      ring="none"
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 border-1.5 border-[#1C1917]"
                    />
                  </div>

                  {/* 1. Finished Action Badge (Green Checked Poker Chip) */}
                  {player.hasActed ? (
                    <div className="absolute -top-1 -right-1 z-30 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#10B981] border-2 border-[#1C1917] text-white flex items-center justify-center text-xs font-black shadow-[2px_2px_0px_#1C1917] animate-[pop_0.2s_ease]">
                      <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                    </div>
                  ) : (
                    /* 2. Still Thinking / Matching Poker Chip */
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#F59E0B] text-[#1C1917] border-1.5 border-[#1C1917] text-[9px] sm:text-[10px] font-display font-black shadow-[1px_1px_0px_#1C1917] flex items-center gap-1 animate-pulse whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917] animate-ping shrink-0" />
                      <span>{player.statusText || 'يفكر...'}</span>
                    </div>
                  )}
                </div>

                {/* Nickname Parchment Chip */}
                <div
                  className={[
                    'px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-[13px] font-display font-black border-2 transition-all max-w-[100px] sm:max-w-[130px] truncate shadow-[2px_2px_0px_#1C1917] z-30 leading-none flex items-center gap-1',
                    isTop ? 'mb-1' : 'mt-1',
                    isSelected
                      ? 'bg-[#F59E0B] text-[#1C1917] border-[#1C1917] scale-105 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : player.isAssignedInMatching
                      ? 'bg-[#0D9488] text-white border-[#1C1917]'
                      : 'bg-[#FFF8EB] text-[#1C1917] border-[#1C1917]',
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
