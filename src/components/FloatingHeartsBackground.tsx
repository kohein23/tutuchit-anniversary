import { Heart } from 'lucide-react';
import { useMemo } from 'react';

interface FloatingHeartItem {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  swayWidth: number;
  initialRotation: number;
  colorClass: string;
  fillColor: string;
  scaleVariation: number;
  opacity: number;
}

export function FloatingHeartsBackground() {
  // Balanced set of hardware-accelerated floating hearts
  const hearts = useMemo<FloatingHeartItem[]>(() => {
    const colorStyles = [
      { colorClass: 'text-pink-500', fill: 'currentColor', opacity: 0.55 },
      { colorClass: 'text-rose-500', fill: 'currentColor', opacity: 0.6 },
      { colorClass: 'text-pink-400', fill: 'currentColor', opacity: 0.65 },
      { colorClass: 'text-fuchsia-400', fill: 'currentColor', opacity: 0.5 },
      { colorClass: 'text-rose-400', fill: 'currentColor', opacity: 0.6 },
      { colorClass: 'text-red-400', fill: 'currentColor', opacity: 0.45 },
      { colorClass: 'text-pink-300', fill: 'currentColor', opacity: 0.7 },
      { colorClass: 'text-rose-300', fill: 'currentColor', opacity: 0.55 },
    ];

    return Array.from({ length: 18 }).map((_, i) => {
      const style = colorStyles[i % colorStyles.length];
      const size = Math.floor(16 + (i % 5) * 4); // 16px to 32px
      return {
        id: i,
        x: ((i * 5.5 + 3) % 94) + 3, // evenly distributed horizontally
        size,
        duration: 10 + (i % 6) * 1.8, // 10s to 19s
        delay: (i * 0.7) % 7,
        swayWidth: (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 8),
        initialRotation: ((i % 5) - 2) * 8,
        colorClass: style.colorClass,
        fillColor: style.fill,
        scaleVariation: 0.9 + (i % 3) * 0.15,
        opacity: style.opacity,
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {hearts.map((h) => (
        <div
          key={h.id}
          className={`absolute bottom-0 ${h.colorClass} animate-heart-float pointer-events-none`}
          style={{
            left: `${h.x}%`,
            // Pass CSS custom variables directly to hardware-accelerated CSS keyframe
            ['--heart-duration' as string]: `${h.duration}s`,
            ['--heart-delay' as string]: `${h.delay}s`,
            ['--heart-sway' as string]: `${h.swayWidth}px`,
            ['--heart-rot' as string]: `${h.initialRotation}deg`,
            ['--heart-scale' as string]: `${h.scaleVariation}`,
            ['--heart-opacity' as string]: `${h.opacity}`,
          }}
        >
          <Heart size={h.size} fill={h.fillColor} />
        </div>
      ))}
    </div>
  );
}
