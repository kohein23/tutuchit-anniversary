import { Heart, Sparkles, Music, Star, Flower2 } from 'lucide-react';
import { useMemo } from 'react';

export function FloatingElements() {
  // A light, curated set of floating accent icons
  const elements = useMemo(() => {
    return [
      { id: 1, x: 12, y: 18, delay: 0, duration: 8, icon: Sparkles, color: 'text-fuchsia-400', size: 22 },
      { id: 2, x: 88, y: 22, delay: 1.5, duration: 9, icon: Star, color: 'text-amber-300', size: 20 },
      { id: 3, x: 8, y: 65, delay: 2.5, duration: 10, icon: Music, color: 'text-rose-400', size: 20 },
      { id: 4, x: 85, y: 72, delay: 1, duration: 8.5, icon: Heart, color: 'text-pink-400', size: 22 },
      { id: 5, x: 48, y: 88, delay: 3, duration: 9.5, icon: Flower2, color: 'text-pink-300', size: 22 },
      { id: 6, x: 92, y: 48, delay: 2, duration: 8, icon: Sparkles, color: 'text-pink-400', size: 18 },
    ];
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {elements.map((el) => {
        const Icon = el.icon;
        return (
          <div
            key={el.id}
            className={`absolute ${el.color} opacity-60 pointer-events-none`}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              animation: `gentlePulseGlow ${el.duration}s ease-in-out infinite`,
              animationDelay: `${el.delay}s`,
              willChange: 'transform',
            }}
          >
            <Icon size={el.size} fill={el.icon === Heart || el.icon === Star ? 'currentColor' : 'none'} />
          </div>
        );
      })}
    </div>
  );
}
