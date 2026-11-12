import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, RefreshCcw, Gift, Sparkles } from 'lucide-react';

interface CupidShooterGameProps {
  title?: string;
  subtitle?: string;
  winTitle?: string;
  winSubtitle?: string;
  targetScore?: number;
  onClaimPrize: () => void;
}

interface Target {
  id: number;
  x: number; // percentage (0 - 100)
  y: number; // percentage (15 - 55)
  speed: number;
  direction: 1 | -1;
  type: 'heart' | 'gift' | 'golden_heart';
  icon: string;
  points: number;
  size: number;
}

interface Arrow {
  id: number;
  x: number; // percentage
  y: number; // percentage
}

export function CupidShooterGame({
  title = "Cupid's Love Arrow! ကျူးပစ်မြှားပစ်ဂိမ်း 🏹",
  subtitle = "ကျူးပစ်လေးရဲ့ အချစ်မြှားဖြင့် လွင့်မျောနေသော အသည်းပစ်မှတ်များကို ပစ်ခတ်ပါ",
  winTitle = "ကျူးပစ်မြှား အားလုံး ထိမှန်သွားပါပြီ! 🎉",
  winSubtitle = "There is a special final prize for you 💕",
  targetScore = 12,
  onClaimPrize
}: CupidShooterGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [arrowsLeft, setArrowsLeft] = useState(25);
  const [bowX, setBowX] = useState(50); // percentage 0 - 100
  const [targets, setTargets] = useState<Target[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [isWin, setIsWin] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hitPopups, setHitPopups] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<number>(0);
  const targetsRef = useRef<Target[]>([]);
  const arrowsRef = useRef<Arrow[]>([]);
  const scoreRef = useRef(0);
  const isPlayingRef = useRef(false);

  const startGame = () => {
    setIsPlaying(true);
    isPlayingRef.current = true;
    setScore(0);
    scoreRef.current = 0;
    setArrowsLeft(25);
    setIsWin(false);
    setIsGameOver(false);
    setHitPopups([]);
    setBowX(50);

    // Initial targets
    const initialTargets: Target[] = [
      { id: 1, x: 10, y: 18, speed: 0.35, direction: 1, type: 'heart', icon: '💖', points: 1, size: 32 },
      { id: 2, x: 80, y: 32, speed: 0.45, direction: -1, type: 'heart', icon: '💕', points: 1, size: 32 },
      { id: 3, x: 30, y: 46, speed: 0.55, direction: 1, type: 'gift', icon: '🎁', points: 2, size: 34 },
      { id: 4, x: 60, y: 24, speed: 0.7, direction: -1, type: 'golden_heart', icon: '✨💖✨', points: 3, size: 36 }
    ];
    targetsRef.current = initialTargets;
    setTargets(initialTargets);
    arrowsRef.current = [];
    setArrows([]);

    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    loopRef.current = requestAnimationFrame(gameLoop);
  };

  const shootArrow = () => {
    if (!isPlayingRef.current || isWin || isGameOver) return;

    setArrowsLeft(prev => {
      if (prev <= 0) return 0;
      const newArrows = [...arrowsRef.current, { id: Date.now(), x: bowX, y: 80 }];
      arrowsRef.current = newArrows;
      setArrows(newArrows);

      if (prev - 1 <= 0 && scoreRef.current < targetScore) {
        setTimeout(() => {
          if (scoreRef.current < targetScore) {
            setIsGameOver(true);
            setIsPlaying(false);
            isPlayingRef.current = false;
          }
        }, 1200);
      }
      return prev - 1;
    });
  };

  const gameLoop = () => {
    if (!isPlayingRef.current) return;

    // Move targets
    targetsRef.current = targetsRef.current.map(target => {
      let nextX = target.x + target.speed * target.direction;
      let nextDir = target.direction;

      if (nextX > 92) {
        nextX = 92;
        nextDir = -1;
      } else if (nextX < 4) {
        nextX = 4;
        nextDir = 1;
      }
      return { ...target, x: nextX, direction: nextDir };
    });

    // Spawn new target if less than 4
    if (targetsRef.current.length < 4 && Math.random() < 0.03) {
      const rand = Math.random();
      const newTarget: Target = {
        id: Date.now() + Math.random(),
        x: Math.random() > 0.5 ? 5 : 90,
        y: Math.floor(Math.random() * 32) + 16,
        speed: Math.random() * 0.4 + 0.35,
        direction: Math.random() > 0.5 ? 1 : -1,
        type: rand < 0.55 ? 'heart' : rand < 0.85 ? 'gift' : 'golden_heart',
        icon: rand < 0.55 ? '💖' : rand < 0.85 ? '🎁' : '✨💖✨',
        points: rand < 0.55 ? 1 : rand < 0.85 ? 2 : 3,
        size: 34
      };
      targetsRef.current.push(newTarget);
    }

    // Move arrows upward and check collision
    const nextArrows: Arrow[] = [];
    const activeTargets = [...targetsRef.current];

    for (const arrow of arrowsRef.current) {
      const nextY = arrow.y - 2.8; // Move up fast
      let hitTargetId: number | null = null;

      for (const t of activeTargets) {
        // Collision check
        const xDist = Math.abs(arrow.x - t.x);
        const yDist = Math.abs(nextY - t.y);

        if (xDist < 8 && yDist < 8) {
          hitTargetId = t.id;
          const gained = t.points;
          scoreRef.current += gained;
          setScore(scoreRef.current);

          // Popup
          const popupId = Math.random();
          setHitPopups(prev => [
            ...prev,
            { id: popupId, text: `+${gained} 🎯`, x: t.x, y: t.y }
          ]);
          setTimeout(() => {
            setHitPopups(prev => prev.filter(p => p.id !== popupId));
          }, 700);

          if (scoreRef.current >= targetScore) {
            setIsWin(true);
            setIsPlaying(false);
            isPlayingRef.current = false;
          }
          break;
        }
      }

      if (hitTargetId !== null) {
        // Remove hit target
        const idx = activeTargets.findIndex(t => t.id === hitTargetId);
        if (idx !== -1) activeTargets.splice(idx, 1);
      } else if (nextY > 5) {
        nextArrows.push({ ...arrow, y: nextY });
      }
    }

    targetsRef.current = activeTargets;
    arrowsRef.current = nextArrows;
    setTargets([...activeTargets]);
    setArrows([...nextArrows]);

    loopRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, []);

  // Handle pointer/touch dragging bow horizontally
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPlayingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(10, Math.min(90, relativeX));
    setBowX(clamped);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-[#FF6B95] mb-2 mt-4 px-4" style={{ fontFamily: 'Georgia, serif' }}>
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-gray-500 mb-4 px-4 font-medium">
        {subtitle} (ပစ်မှတ် {targetScore} မှတ် ရယူပါ)
      </p>

      <div 
        ref={containerRef}
        id="cupid-shooter-stage"
        onPointerMove={handlePointerMove}
        className="w-full max-w-sm h-[420px] mx-auto bg-gradient-to-b from-sky-50 via-pink-50/60 to-rose-50/80 backdrop-blur-md rounded-3xl border border-white/80 relative overflow-hidden shadow-inner select-none flex flex-col justify-between"
      >
        {/* Top HUD */}
        <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-4 z-20 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-xs border border-pink-100 flex items-center gap-1.5">
            <span>🏹 မြှား:</span>
            <span className={arrowsLeft <= 5 ? 'text-red-500 font-extrabold animate-pulse' : 'text-rose-600'}>
              {arrowsLeft}
            </span>
          </div>

          <div className={`px-3.5 py-1.5 rounded-full font-bold text-xs shadow-xs border backdrop-blur-md transition-all flex items-center gap-1.5 ${
            score >= targetScore
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
              : 'bg-white/90 text-pink-600 border-pink-100'
          }`}>
            <Sparkles size={14} className={score >= targetScore ? 'text-emerald-500 animate-spin' : 'text-pink-400'} />
            <span>Score: {score}/{targetScore}</span>
          </div>
        </div>

        {/* Hit Popups */}
        {hitPopups.map(hit => (
          <motion.div
            key={hit.id}
            initial={{ opacity: 1, scale: 0.8, y: 0 }}
            animate={{ opacity: 0, scale: 1.3, y: -20 }}
            transition={{ duration: 0.6 }}
            className="absolute z-30 font-black text-xs sm:text-sm text-emerald-600 bg-white/95 px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm pointer-events-none"
            style={{ left: `${hit.x}%`, top: `${hit.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {hit.text}
          </motion.div>
        ))}

        {/* Floating Targets */}
        {targets.map(target => (
          <div
            key={target.id}
            className="absolute z-10 filter drop-shadow-md select-none transition-transform pointer-events-none flex items-center justify-center"
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="text-3xl animate-bounce" style={{ animationDuration: '2s' }}>
              {target.icon}
            </span>
          </div>
        ))}

        {/* Flying Arrows */}
        {arrows.map(arrow => (
          <div
            key={arrow.id}
            className="absolute z-10 filter drop-shadow-sm pointer-events-none text-2xl font-bold"
            style={{
              left: `${arrow.x}%`,
              top: `${arrow.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            💘
          </div>
        ))}

        {/* Cupid Bow at bottom (movable) */}
        <div 
          className="absolute bottom-16 z-20 transition-transform pointer-events-none flex flex-col items-center"
          style={{
            left: `${bowX}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-4xl filter drop-shadow-md">
            🏹
          </div>
        </div>

        {/* Bottom Control / Shoot Button */}
        <div className="absolute bottom-3 left-0 right-0 px-4 z-20 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={shootArrow}
            disabled={!isPlaying || arrowsLeft <= 0}
            className="w-full max-w-xs bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            <span>🏹 ပစ်ခတ်မည် (Shoot)</span>
          </button>
        </div>

        {/* Start Game Overlay */}
        <AnimatePresence>
          {!isPlaying && !isWin && !isGameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/85 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 mb-3 text-3xl shadow-inner">
                🏹
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Cupid's Love Arrow!</h3>
              <p className="text-xs text-gray-500 max-w-xs mb-5">
                ဖုန်း screen ပေါ်တွင် ဘယ်/ညာ ရွှေ့ကာ လွင့်မျောနေသော အသည်းပစ်မှတ်များကို မြှားဖြင့် ပစ်ခတ်ပြီး ရမှတ် {targetScore} မှတ် ရယူပါ
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-7 py-3 rounded-full font-bold text-sm hover:opacity-95 transition-all shadow-lg flex items-center gap-2"
              >
                <Play size={18} fill="currentColor" />
                <span>ဂိမ်းစကစားမည်</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Win / Prize Overlay */}
        <AnimatePresence>
          {isWin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center"
            >
              <div className="p-4 rounded-full mb-3 shadow-lg bg-emerald-100 text-emerald-500">
                <Trophy size={42} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                {winTitle}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-5">
                {winSubtitle} (ရမှတ်: {score}/{targetScore})
              </p>
              
              <div className="flex flex-col gap-2.5 w-full max-w-xs">
                <button
                  onClick={onClaimPrize}
                  className="bg-gradient-to-r from-[#FF85A1] to-[#FF6B95] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Gift size={18} /> Final Prize ရယူမည် 🎁
                </button>
                <button
                  onClick={startGame}
                  className="bg-white text-gray-700 border border-pink-200 px-4 py-2.5 rounded-full font-bold text-xs hover:bg-pink-50 transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCcw size={15} /> ပြန်ကစားမည်
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over (Arrows ran out) */}
        <AnimatePresence>
          {!isWin && isGameOver && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center"
            >
              <div className="p-4 rounded-full mb-3 shadow-lg bg-red-100 text-red-500 text-3xl">
                🏹
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                မြှားကုန်သွားပါပြီ 😢
              </h3>
              <p className="text-xs text-gray-600 mb-5">
                ရမှတ် {score}/{targetScore} မှတ်သာ ရရှိခဲ့ပါသည်။ ပြန်လည်ကြိုးစားကြည့်ပါ
              </p>
              
              <button
                onClick={startGame}
                className="bg-rose-500 text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-rose-600 transition-all shadow-md flex items-center gap-2"
              >
                <RefreshCcw size={16} /> ပြန်ကစားမည်
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
