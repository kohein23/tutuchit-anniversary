import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, RefreshCcw, Heart as HeartIcon, Sparkles } from 'lucide-react';

interface CatchHeartsGameProps {
  title?: string;
  subtitle?: string;
  winMessage?: string;
  targetScore?: number;
  onGameClear: () => void;
  onNextGame: () => void;
}

type FallingHeart = {
  id: number;
  x: number;
  y: number;
  speed: number;
  emoji: string;
  size: number;
  wobble: number;
  wobbleSpeed: number;
};

type CatchParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

type FloatingText = {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
};

const HEART_EMOJIS = ['❤️', '💖', '💕', '💗', '💓', '💝'];
const PARTICLE_COLORS = ['#FF1493', '#FF69B4', '#FF4081', '#FFD700', '#FF85A1', '#FFF'];

export function CatchHeartsGame({
  title = "Let's collect our missing hearts! 💕",
  subtitle = "ခြင်းတောင်းလေးကို ရွှေ့ပြီး အသည်းပုံလေးတွေကို ဖမ်းပါ",
  winMessage = "You collected all the love! 🎉",
  targetScore = 15,
  onGameClear,
  onNextGame,
}: CatchHeartsGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game Engine Refs (zero React re-renders during 60fps game loop)
  const isPlayingRef = useRef(false);
  const scoreRef = useRef(0);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  
  // Dimensions & Catcher physics
  const canvasSizeRef = useRef({ width: 400, height: 420 });
  const basketXRef = useRef<number>(200);
  const targetBasketXRef = useRef<number>(200);
  const isDraggingRef = useRef(false);

  // Active game objects
  const heartsRef = useRef<FallingHeart[]>([]);
  const particlesRef = useRef<CatchParticle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);

  // Sound effect via web audio api (subtle cute pop beep)
  const playCatchSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // AudioContext might be restricted until user gesture; ignore safely
    }
  }, []);

  // Update canvas resolution with Device Pixel Ratio for Retina screens
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
    if (!isPlayingRef.current) {
      basketXRef.current = width / 2;
      targetBasketXRef.current = width / 2;
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    const handleResize = () => updateCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  // Main 60FPS Game Loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!isPlayingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvasSizeRef.current.width;
    const height = canvasSizeRef.current.height;

    // Delta time calculation (smooth on 60Hz, 90Hz, 120Hz screens)
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    // Spawn hearts every 500-600ms
    if (timestamp - lastSpawnRef.current > 550) {
      const size = 32;
      heartsRef.current.push({
        id: Math.random(),
        x: Math.random() * (width - size * 2) + size,
        y: -size,
        speed: (height * 0.42) + Math.random() * (height * 0.18), // smooth responsive fall speed
        emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
        size,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 2 + Math.random() * 2,
      });
      lastSpawnRef.current = timestamp;
    }

    // Smooth basket motion (lerp for buttery follow)
    const targetX = targetBasketXRef.current;
    basketXRef.current += (targetX - basketXRef.current) * 0.35;

    const basketWidth = Math.max(84, Math.min(100, width * 0.25));
    const basketHeight = 54;
    const basketY = height - basketHeight - 14;
    const basketX = Math.max(basketWidth / 2 + 6, Math.min(width - basketWidth / 2 - 6, basketXRef.current));

    // Clear Canvas
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 1. Update & Render Falling Hearts
    const remainingHearts: FallingHeart[] = [];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const heart of heartsRef.current) {
      heart.y += heart.speed * dt;
      heart.wobble += heart.wobbleSpeed * dt;
      const wobbleOffsetX = Math.sin(heart.wobble) * 8;
      const currentX = heart.x + wobbleOffsetX;

      // Check Catch Collision with Basket
      const hitBoxTop = basketY - 12;
      const hitBoxBottom = basketY + basketHeight * 0.7;
      const hitBoxLeft = basketX - basketWidth / 2 - 12;
      const hitBoxRight = basketX + basketWidth / 2 + 12;

      if (
        heart.y >= hitBoxTop &&
        heart.y <= hitBoxBottom &&
        currentX >= hitBoxLeft &&
        currentX <= hitBoxRight
      ) {
        // Heart Caught!
        scoreRef.current += 1;
        setScore(scoreRef.current);
        playCatchSound();

        // Spawn Sparkle Particles
        for (let i = 0; i < 7; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 40 + Math.random() * 80;
          particlesRef.current.push({
            x: currentX,
            y: heart.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 30,
            life: 0.5,
            maxLife: 0.5,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
            size: 3 + Math.random() * 4,
          });
        }

        // Floating "+1" score popup
        textsRef.current.push({
          x: currentX,
          y: heart.y - 10,
          text: '+1 💕',
          life: 0.6,
          maxLife: 0.6,
        });

        if (scoreRef.current >= targetScore) {
          onGameClear();
        }
        continue;
      }

      // If heart fell off screen, drop it
      if (heart.y < height + heart.size) {
        remainingHearts.push(heart);

        // Draw Heart
        ctx.font = `${heart.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.save();
        ctx.translate(currentX, heart.y);
        ctx.rotate(Math.sin(heart.wobble) * 0.15);
        ctx.fillText(heart.emoji, 0, 0);
        ctx.restore();
      }
    }
    heartsRef.current = remainingHearts;

    // 2. Render Basket (High-Contrast, Vivid & Cute Handcrafted Illustration)
    ctx.save();
    const halfTop = basketWidth * 0.48;
    const halfBottom = basketWidth * 0.35;
    const topY = basketY + 8;
    const bottomY = basketY + basketHeight;

    // A. Soft Warm Ground Shadow
    ctx.beginPath();
    ctx.ellipse(basketX, bottomY + 4, halfTop * 0.9, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 42, 109, 0.22)';
    ctx.fill();

    // B. Basket Arch Handle
    ctx.beginPath();
    ctx.arc(basketX, topY + 4, halfTop * 0.75, Math.PI, 0, false);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#D97706';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(basketX, topY + 4, halfTop * 0.75, Math.PI, 0, false);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FDE68A';
    ctx.stroke();

    // C. Basket Body (Vivid Warm Honey-Amber Texture with depth)
    const basketGrad = ctx.createLinearGradient(0, topY, 0, bottomY);
    basketGrad.addColorStop(0, '#F59E0B'); // Amber 500
    basketGrad.addColorStop(0.5, '#D97706'); // Amber 600
    basketGrad.addColorStop(1, '#92400E'); // Amber 800

    ctx.beginPath();
    ctx.moveTo(basketX - halfTop, topY);
    ctx.lineTo(basketX + halfTop, topY);
    ctx.quadraticCurveTo(basketX + halfBottom + 6, bottomY, basketX, bottomY);
    ctx.quadraticCurveTo(basketX - halfBottom - 6, bottomY, basketX - halfTop, topY);
    ctx.closePath();

    // Basket body shadow & fill
    ctx.fillStyle = basketGrad;
    ctx.shadowColor = 'rgba(217, 119, 6, 0.4)';
    ctx.shadowBlur = 10;
    ctx.fill();

    // Reset shadow & draw bold outline for perfect contrast
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#78350F';
    ctx.stroke();

    // D. Woven Texture Cross-Hatches
    ctx.save();
    ctx.clip(); // clip pattern to basket body
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#FEF3C7';
    ctx.globalAlpha = 0.55;
    for (let lx = -basketWidth; lx <= basketWidth; lx += 14) {
      ctx.beginPath();
      ctx.moveTo(basketX + lx - 18, topY);
      ctx.lineTo(basketX + lx + 18, bottomY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(basketX + lx + 18, topY);
      ctx.lineTo(basketX + lx - 18, bottomY);
      ctx.stroke();
    }
    ctx.restore();

    // E. Sweet White & Rose Ribbon Rim
    const rimGrad = ctx.createLinearGradient(0, topY - 5, 0, topY + 8);
    rimGrad.addColorStop(0, '#FFFFFF');
    rimGrad.addColorStop(1, '#FFE4E6');

    ctx.beginPath();
    const rx = basketX - halfTop - 4;
    const ry = topY - 4;
    const rw = (halfTop + 4) * 2;
    const rh = 12;
    if (typeof (ctx as unknown as { roundRect?: Function }).roundRect === 'function') {
      (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(rx, ry, rw, rh, 6);
    } else {
      ctx.rect(rx, ry, rw, rh);
    }
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FF2A6D';
    ctx.stroke();

    // F. Cute Center Ribbon Bow
    ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎀', basketX, topY + 2);

    ctx.restore();

    // 3. Update & Render Sparkle Particles
    const remainingParticles: CatchParticle[] = [];
    for (const p of particlesRef.current) {
      p.life -= dt;
      if (p.life > 0) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 150 * dt; // gravity
        const alpha = Math.max(0, p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        remainingParticles.push(p);
      }
    }
    particlesRef.current = remainingParticles;

    // 4. Update & Render Floating Score Popups
    const remainingTexts: FloatingText[] = [];
    for (const t of textsRef.current) {
      t.life -= dt;
      if (t.life > 0) {
        t.y -= 45 * dt; // float upward
        const alpha = Math.max(0, t.life / t.maxLife);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = '#FF1493';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();

        remainingTexts.push(t);
      }
    }
    textsRef.current = remainingTexts;

    ctx.restore();

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [onGameClear, playCatchSound, targetScore]);

  const stopGame = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
    isPlayingRef.current = false;
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }, []);

  const startGame = useCallback(() => {
    updateCanvasSize();
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(30);
    heartsRef.current = [];
    particlesRef.current = [];
    textsRef.current = [];
    scoreRef.current = 0;
    isPlayingRef.current = true;

    const width = canvasSizeRef.current.width || 360;
    basketXRef.current = width / 2;
    targetBasketXRef.current = width / 2;

    lastTimeRef.current = performance.now();
    lastSpawnRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, updateCanvasSize]);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
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

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Pointer & Touch Handlers (Direct, buttery smooth tracking with preventDefault)
  const handlePointerPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    targetBasketXRef.current = x;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPlayingRef.current) return;
    isDraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerPosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPlayingRef.current) return;
    handlePointerPosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPlayingRef.current) return;
    e.preventDefault(); // prevent page scroll while moving the basket!
    if (e.touches.length > 0) {
      handlePointerPosition(e.touches[0].clientX);
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
        {subtitle || `Catch ${targetScore} hearts within 30 seconds!`}
      </p>

      <div
        id="catch-hearts-stage"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchMove={handleTouchMove}
        className="w-full h-[380px] sm:h-[420px] bg-gradient-to-b from-pink-50/80 via-white/70 to-rose-50/80 rounded-3xl border-2 border-pink-200 relative overflow-hidden select-none touch-none shadow-[0_12px_32px_rgba(255,105,180,0.2)] cursor-grab active:cursor-grabbing"
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
            <span>
              Score: {score}/{targetScore}
            </span>
          </div>
        </div>

        {/* 60FPS Hardware-Accelerated Canvas Layer */}
        <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />

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
                🧺
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-1.5">အသည်းပုံဖမ်းဂိမ်း</h3>
              <p className="text-xs sm:text-sm text-gray-600 max-w-xs mb-5 font-medium leading-relaxed">
                ခြင်းတောင်းလေးကို ဘယ်/ညာ ရွှေ့ပြီး ကျလာတဲ့ အသည်းပုံလေးတွေကို ဖမ်းပါ ({targetScore} ခု ပြည့်အောင် ဖမ်းရပါမည်)
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
                {isWin ? winMessage : 'အချိန်ကုန်သွားပါပြီ 😢'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-5">
                {isWin
                  ? `အသည်းပုံ ${score} ခု အောင်မြင်စွာ ဖမ်းယူနိုင်ခဲ့ပါသည်! 🎉`
                  : `အသည်းပုံ ${score}/${targetScore} ခုသာ ဖမ်းနိုင်ခဲ့ပါသည်။ ပြန်လည်ကြိုးစားကြည့်ပါ`}
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
