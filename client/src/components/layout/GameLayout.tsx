import type { ReactNode } from 'react';

interface GameLayoutProps {
  children: ReactNode;
  className?: string;
  hideBg?: boolean;
}

export default function GameLayout({ children, className = '' }: GameLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center text-[#F7EDE2] overflow-x-hidden font-body relative" dir="rtl">
      {/* Retro-Futuristic Egyptian Comic Background Image with Depth Blur */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat filter blur-[7px] scale-105 transition-all duration-700"
        style={{
          backgroundImage: "url('/images/retro_egypt_bg.jpg')",
        }}
      />

      {/* Cinematic Ambient Tint & Vignette for Depth & Focus */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#0B1519]/35 via-[#0B1519]/20 to-[#0B1519]/55"
        aria-hidden="true"
      />

      {/* Content container */}
      <div className={`relative z-10 flex-1 flex flex-col items-center w-full pb-12 sm:pb-16 ${className}`}>
        {children}
      </div>
    </div>
  );
}

