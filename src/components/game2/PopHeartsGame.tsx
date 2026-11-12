import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, RefreshCcw, Heart as HeartIcon, Sparkles } from 'lucide-react';

interface FloatingBalloon {
  id: number;
  x: number;
  y: number;
  speed: number;
  emoji: string;
  size: number;
  radius: number;
  isSpecial: boolean;
  points: number;
  wobble: number;
}

interface PopParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface PopHeartsGameProps {
  title?: string;
  subtitle?: string;
  winMessage?: string;
  targetScore?: number;
  onGameClear: () => void;
  onNextGame: () => void;
}

const BALLOON_TYPES = [
  { emoji: '🎈', isSpecial: false, points: 1, size: 36, radius: 24 },
  { emoji: '💖', isSpecial: false, points: 1, size: 40, radius: 26 },
  { emoji: '💝', isSpecial: false, points: 1, size: 38, radius: 25 },
  { emoji: '💕', isSpecial: false, points: 1, size: 36, radius: 24 },
  { emoji: '👑', isSpecial: true, points: 2, size: 42, radius: 28 },
];

export function PopHeartsGame({
  title = "Pop Love Balloons! 🎈",
  subtitle = "အသည်းပုံပူဖောင်းများကို နှိပ်၍ ဖောက်ပါ (၁၅ မှတ်ပြည့်အောင် စုဆောင်းပါ)",
  winMessage = "ပူဖောင်းအားလုံးကို ဖောက်ပြီး ချစ်ခြင်းမေတ္တာအမှတ်ပြည့် ရရှိသွားပါပြီ! 🎉",
  targetScore = 15,
  onGameClear,
  onNextGame,
}: PopHeartsGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const balloonsRef = useRef<FloatingBalloon[]>([]);
  const particlesRef = useRef<PopParticle[]>([]);
  const requestRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const isPlayingRef = useRef(false);
  const canvasSizeRef = useRef({ width: 400, height: 420 });

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    if (width === 0 || height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    canvasSizeRef.current = { width, height };
  }, []);

  useEffect(() => {
    updateCanvasSize();
    const handleResize = () => updateCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  const gameLoop = useCallback((timestamp: number) => {
    if (!isPlayingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = canvasSizeRef.current;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    // Spawn balloon every 500ms
    if (timestamp - lastSpawnRef.current > 500) {
      const type = BALLOON_TYPES[Math.floor(Math.random() * BALLOON_TYPES.length)];
      balloonsRef.current.push({
        id: Math.random(),
        x: Math.random() * (width - 60) + 30,
        y: height + 40,
        speed: (height * 0.28) + Math.random() * (height * 0.14),
        emoji: type.emoji,
        size: type.size,
        radius: type.radius,
        isSpecial: type.isSpecial,
        points: type.points,
        wobble: Math.random() * Math.PI * 2,
      });
      lastSpawnRef.current = timestamp;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Update & draw balloons
    const remainingBalloons: FloatingBalloon[] = [];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const b of balloonsRef.current) {
      b.y -= b.speed * dt;
      b.wobble += 2.5 * dt;
      const wobbleX = Math.sin(b.wobble) * 6;
      const currentX = b.x + wobbleX;

      if (b.y > -50) {
        remainingBalloons.push(b);

        ctx.font = `${b.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.fillText(b.emoji, currentX, b.y);
      }
    }
    balloonsRef.current = remainingBalloons;

    // Update & draw particles
    const remainingParticles: PopParticle[] = [];
    for (const p of particlesRef.current) {
      p.life -= dt;
      if (p.life > 0) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt;
        const alpha = p.life / p.maxLife;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        remainingParticles.push(p);
      }
    }
    particlesRef.current = remainingParticles;

    ctx.restore();

    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const stopGame = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
    isPlayingRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, []);

  const startGame = useCallback(() => {
    updateCanvasSize();
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(30);
    balloonsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    isPlayingRef.current = true;
    lastTimeRef.current = performance.now();
    lastSpawnRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, updateCanvasSize]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopGame();
            if (scoreRef.current >= targetScore) {
              onGameClear();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, targetScore, stopGame, onGameClear]);

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlayingRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check hit on any balloon
    for (let i = balloonsRef.current.length - 1; i >= 0; i--) {
      const b = balloonsRef.current[i];
      const wobbleX = Math.sin(b.wobble) * 6;
      const currentX = b.x + wobbleX;
      const dist = Math.hypot(clickX - currentX, clickY - b.y);

      if (dist <= b.radius + 10) {
        // Popped!
        balloonsRef.current.splice(i, 1);
        scoreRef.current += b.points;
        setScore(scoreRef.current);

        // Spawn particles
        for (let p = 0; p < 8; p++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 40 + Math.random() * 90;
          particlesRef.current.push({
            x: currentX,
            y: b.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.45,
            maxLife: 0.45,
            color: b.isSpecial ? '#FFD700' : '#FF1493',
            size: 3 + Math.random() * 4,
          });
        }

        if (scoreRef.current >= targetScore) {
          onGameClear();
        }
        break;
      }
    }
  };

  const isWin = score >= targetScore;

  return (
    <div className="w-full">
      <h2
        className="text-xl sm:text-2xl font-black text-[#FF2E74] mb-1.5 mt-12 sm:mt-4 px-4 drop-shadow-sm"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-3 px-4 font-medium">
        {subtitle}
      </p>

      <div
        id="pop-hearts-stage"
        ref={containerRef}
        className="w-full h-[380px] sm:h-[420px] bg-gradient-to-b from-sky-50/70 via-pink-50/70 to-purple-50/70 rounded-3xl border-2 border-pink-200 relative overflow-hidden select-none touch-none shadow-[0_12px_32px_rgba(255,105,180,0.2)]"
      >
        {/* Top HUD */}
        <div className="absolute top-3 left-3 right-3 flex justify-between z-10 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm text-[#FF2E74] shadow-md border border-pink-200 flex items-center gap-1.5">
            <span>⏱️</span>
            <span>Time: {timeLeft}s</span>
          </div>
          <div
            className={`px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm shadow-md border backdrop-blur-md transition-all flex items-center gap-1.5 ${
              isWin
                ? 'bg-emerald-50 text-emerald-600 border-emerald-300 shadow-emerald-100'
                : 'bg-white/95 text-[#FF2E74] border-pink-200'
            }`}
          >
            <Sparkles size={14} className={isWin ? 'text-emerald-500 animate-spin' : 'text-pink-400'} />
            <span>Score: {score}/{targetScore}</span>
          </div>
        </div>

        {/* 60FPS Hardware-Accelerated Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          className="w-full h-full block cursor-pointer"
        />

        {/* Start Game Overlay */}
        <AnimatePresence>
          {!isPlaying && !gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/85 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white mb-3 text-3xl shadow-lg shadow-pink-300/60">
                🎈
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-1.5">ပူဖောင်းဖောက်ဂိမ်း</h3>
              <p className="text-xs sm:text-sm text-gray-600 max-w-xs mb-5 font-medium leading-relaxed">
                တက်လာတဲ့ အသည်းပုံပူဖောင်းလေးတွေကို နှိပ်ပြီး ဖောက်ပါ ({targetScore} မှတ်ပြည့်အောင် ယူရပါမည်)
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] text-white px-8 py-3 rounded-full font-black text-base hover:opacity-95 transition-all shadow-[0_10px_25px_rgba(255,42,109,0.4)] flex items-center gap-2.5 border border-white/50 cursor-pointer"
              >
                <Play size={20} fill="currentColor" />
                <span>ဂိမ်းစကစားမည်</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over / Win Overlay */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center"
            >
              <div
                className={`p-4 rounded-full mb-3 shadow-lg ${
                  isWin ? 'bg-emerald-100 text-emerald-500 shadow-emerald-200/60' : 'bg-rose-100 text-rose-500 shadow-rose-200/60'
                }`}
              >
                {isWin ? <Trophy size={42} /> : <HeartIcon size={42} fill="currentColor" />}
              </div>
              <h3
                className="text-xl sm:text-2xl font-black text-gray-800 mb-1.5"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {isWin ? winMessage : "အချိန်ကုန်သွားပါပြီ 😢"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-5">
                {isWin
                  ? `ပူဖောင်း ${score} မှတ် အောင်မြင်စွာ ဖောက်နိုင်ခဲ့ပါသည်! 🎉`
                  : `ပူဖောင်း ${score}/${targetScore} မှတ်သာ ရခဲ့ပါသည်။ ပြန်လည်ကြိုးစားကြည့်ပါ`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={startGame}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCcw size={16} /> ပြန်ကစားမည်
                </button>
                {isWin && (
                  <button
                    onClick={onNextGame}
                    className="bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] text-white px-7 py-2.5 rounded-full font-black text-sm hover:opacity-90 transition-all shadow-[0_8px_20px_rgba(255,42,109,0.4)] flex items-center gap-2 cursor-pointer border border-white/40"
                  >
                    <span>နောက်ဂိမ်းသို့ ▶</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
