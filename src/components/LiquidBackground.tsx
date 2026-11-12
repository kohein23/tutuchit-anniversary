import { FloatingElements } from './FloatingElements';
import { FloatingHeartsBackground } from './FloatingHeartsBackground';
import React from 'react';

export function LiquidBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#FFE4EC] to-[#FFD8E4] font-sans text-gray-800 relative overflow-hidden flex flex-col">
      {/* 
        High-performance atmospheric glow layers:
        Using feathered radial gradients instead of heavy CPU/GPU blur filters
        Runs silky smooth on mobile and low-power devices.
      */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vw] max-w-[700px] max-h-[700px] rounded-full pointer-events-none animate-bg-glow-1"
        style={{
          background: 'radial-gradient(circle, rgba(255, 83, 136, 0.28) 0%, rgba(255, 163, 186, 0.15) 45%, transparent 70%)',
        }}
      />
      <div 
        className="absolute top-[25%] -right-[10%] w-[60vw] h-[60vw] max-w-[650px] max-h-[650px] rounded-full pointer-events-none animate-bg-glow-2"
        style={{
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.25) 0%, rgba(236, 72, 153, 0.16) 45%, transparent 70%)',
        }}
      />
      <div 
        className="absolute -bottom-[10%] left-[20%] w-[70vw] h-[70vw] max-w-[750px] max-h-[750px] rounded-full pointer-events-none animate-bg-glow-1"
        style={{
          background: 'radial-gradient(circle, rgba(255, 107, 149, 0.22) 0%, rgba(251, 113, 133, 0.14) 45%, transparent 70%)',
        }}
      />
      
      {/* Sparkle Pattern Overlay */}
      <div className='absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none mix-blend-overlay z-0'>
        <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
          <defs>
            <pattern id='sparkle' x='0' y='0' width='90' height='90' patternUnits='userSpaceOnUse'>
              <path d='M45 5 L47 43 L85 45 L47 47 L45 85 L43 47 L5 45 L43 43 Z' fill='#FF4081' transform='scale(0.12)' />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#sparkle)' />
        </svg>
      </div>

      {/* Floating Animated Hearts Rising in Background (pure CSS compositor thread) */}
      <FloatingHeartsBackground />

      {/* Cute Floating Accent Icons */}
      <FloatingElements />

      <div className="relative z-10 flex flex-col flex-grow w-full h-full min-h-screen">
        {children}
      </div>
    </div>
  );
}
