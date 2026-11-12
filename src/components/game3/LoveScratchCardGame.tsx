import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, RefreshCcw, Gift, Sparkles, Wand2 } from 'lucide-react';

interface LoveScratchCardGameProps {
  title?: string;
  subtitle?: string;
  winTitle?: string;
  winSubtitle?: string;
  targetScore?: number;
  onClaimPrize: () => void;
}

interface CardItem {
  id: number;
  icon: string;
  label: string;
  message: string;
  revealed: boolean;
}

const DEFAULT_CARDS: CardItem[] = [
  { id: 1, icon: '💍', label: 'စစ်မှန်သောချစ်ခြင်း', message: 'တစ်သက်လုံး အတူလက်တွဲမယ့် အချစ်ဆု 💖', revealed: false },
  { id: 2, icon: '👑', label: 'ကိုကို့ရဲ့ဘုရင်မလေး', message: 'ကမ္ဘာပေါ်မှာ အချစ်ရဆုံး ကလေးလေး 🌸', revealed: false },
  { id: 3, icon: '💌', label: 'ထာဝရကတိသစ္စာ', message: 'မင်းအပြုံးလေးတွေ အမြဲစောင့်ရှောက်မယ် ✨', revealed: false }
];

export function LoveScratchCardGame({
  title = "Love Scratch Card! ကံစမ်းခြစ်ကတ်ဆုမဲ 🥠",
  subtitle = "ရွှေရောင်ကတ်ပြားများကို လက်ဖြင့် ခြစ်၍ အချစ်ဆုမဲများကို ရှာဖွေပါ",
  winTitle = "ကံစမ်းကတ်အားလုံး ခြစ်ပြီး အချစ်ဆု ရရှိပါပြီ! 🎉",
  winSubtitle = "There is a special final prize for you 💕",
  targetScore = 3,
  onClaimPrize
}: LoveScratchCardGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cards, setCards] = useState<CardItem[]>(DEFAULT_CARDS);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isWin, setIsWin] = useState(false);

  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const isDrawingRef = useRef<boolean>(false);

  const playSound = useCallback((type: 'scratch' | 'win') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'scratch') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } else {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const oscNode = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscNode.type = 'sine';
          oscNode.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.25);
          oscNode.connect(gainNode);
          gainNode.connect(ctx.destination);
          oscNode.start(ctx.currentTime + i * 0.1);
          oscNode.stop(ctx.currentTime + i * 0.1 + 0.26);
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const initCanvases = useCallback(() => {
    canvasRefs.current.forEach((canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Draw Gold/Rose gradient foil
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#FFD700');
      grad.addColorStop(0.3, '#FFA07A');
      grad.addColorStop(0.7, '#FF69B4');
      grad.addColorStop(1, '#FFD700');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Add cute sparkles & text on foil
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨ လက်ဖြင့်ခြစ်ပါ ✨', width / 2, height / 2 - 8);
      ctx.font = '11px sans-serif';
      ctx.fillText('Scratch to Reveal 💕', width / 2, height / 2 + 12);
    });
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setCards(DEFAULT_CARDS.map(c => ({ ...c, revealed: false })));
    setRevealedCount(0);
    setIsWin(false);

    setTimeout(initCanvases, 100);
  };

  const handleRevealAll = () => {
    canvasRefs.current.forEach(canvas => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    setCards(DEFAULT_CARDS.map(c => ({ ...c, revealed: true })));
    setRevealedCount(DEFAULT_CARDS.length);
    setTimeout(() => {
      setIsWin(true);
      playSound('win');
    }, 400);
  };

  const checkScratchPercentage = (canvas: HTMLCanvasElement, cardIndex: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparentPixels = 0;
      const totalPixels = imgData.data.length / 4;

      for (let i = 3; i < imgData.data.length; i += 16) {
        if (imgData.data[i] === 0) {
          transparentPixels += 4;
        }
      }

      const percent = (transparentPixels / totalPixels) * 100;
      if (percent > 40) {
        // Auto clear remaining
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setCards(prev => {
          if (prev[cardIndex]?.revealed) return prev;
          const updated = [...prev];
          updated[cardIndex] = { ...updated[cardIndex], revealed: true };
          
          const newCount = updated.filter(c => c.revealed).length;
          setRevealedCount(newCount);

          if (newCount >= Math.min(targetScore, DEFAULT_CARDS.length)) {
            setTimeout(() => {
              setIsWin(true);
              playSound('win');
            }, 500);
          }
          return updated;
        });
      }
    } catch {
      // ignore
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>, index: number) => {
    isDrawingRef.current = true;
    scratch(e, index);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>, index: number) => {
    if (!isDrawingRef.current) return;
    scratch(e, index);
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  const scratch = (e: React.PointerEvent<HTMLCanvasElement>, index: number) => {
    const canvas = canvasRefs.current[index];
    if (!canvas || cards[index]?.revealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    playSound('scratch');
    checkScratchPercentage(canvas, index);
  };

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
        id="love-scratch-card-stage"
        onPointerUp={handlePointerUp}
        className="w-full max-w-sm min-h-[420px] mx-auto bg-gradient-to-b from-amber-50/80 via-pink-50/80 to-rose-50/80 rounded-3xl border-2 border-pink-200 relative overflow-hidden p-4 sm:p-5 shadow-[0_12px_32px_rgba(255,105,180,0.2)] select-none flex flex-col justify-between"
      >
        {/* Top HUD */}
        <div className="flex justify-between items-center px-1 mb-3 gap-2 z-10">
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-sm border border-pink-200 flex items-center gap-1.5">
            <span>🥠 ခြစ်ပြီးဆုမဲ:</span>
            <span className="text-rose-600 font-black">
              {revealedCount}/{Math.min(targetScore, 3)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isPlaying && !isWin && (
              <button
                type="button"
                onClick={handleRevealAll}
                className="bg-gradient-to-r from-amber-400 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <Wand2 size={12} />
                <span>Reveal All</span>
              </button>
            )}

            <div className={`px-3 py-1.5 rounded-full font-bold text-xs shadow-sm border backdrop-blur-md transition-all flex items-center gap-1.5 ${
              revealedCount >= Math.min(targetScore, 3)
                ? 'bg-emerald-50 text-emerald-600 border-emerald-300 shadow-emerald-100' 
                : 'bg-white/95 text-[#FF2E74] border-pink-200'
            }`}>
              <Sparkles size={14} className="text-amber-500 animate-spin" />
              <span>Scratch & Win</span>
            </div>
          </div>
        </div>

        {/* 3 Scratch Cards Stack */}
        <div className="flex flex-col gap-3 my-auto w-full z-10">
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className="relative w-full h-24 bg-white/95 rounded-2xl border-2 border-pink-200 shadow-md overflow-hidden flex items-center p-3 gap-3 group"
            >
              {/* Prize Details Underneath */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-100 to-rose-100 border border-pink-200 flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
                {card.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-gray-800 text-xs sm:text-sm">{card.label}</h4>
                  <span className="text-[10px] bg-pink-100 text-[#FF2E74] font-bold px-1.5 py-0.5 rounded-md border border-pink-200">
                    ✨ ဆုမဲ
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 font-medium mt-1 leading-tight">{card.message}</p>
              </div>

              {/* Canvas Scratch Foil Layer on Top */}
              {!card.revealed && (
                <canvas
                  ref={el => { canvasRefs.current[idx] = el; }}
                  width={340}
                  height={96}
                  onPointerDown={(e) => handlePointerDown(e, idx)}
                  onPointerMove={(e) => handlePointerMove(e, idx)}
                  className="absolute inset-0 w-full h-full cursor-pointer touch-none z-10 rounded-2xl"
                />
              )}
            </div>
          ))}
        </div>

        {/* Bottom hint */}
        <p className="text-[11px] text-gray-500 font-medium text-center mt-2.5">
          💡 ရွှေရောင်အလွှာပေါ်တွင် လက်ချောင်းလေးဖြင့် ဘယ်ညာပွတ်ဆွဲ၍ ခြစ်ပေးပါ
        </p>

        {/* Start Game Overlay */}
        <AnimatePresence>
          {!isPlaying && !isWin && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-white mb-3 text-3xl shadow-lg shadow-pink-300/60">
                🥠
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-1.5">Love Scratch Card</h3>
              <p className="text-xs sm:text-sm text-gray-600 max-w-xs mb-5 font-medium leading-relaxed">
                ရွှေရောင်ဆုမဲကတ်ပြားများကို လက်ဖြင့် ခြစ်၍ အချစ်ဆုမဲ {Math.min(targetScore, 3)} ခု ရှာဖွေပြီး Final Prize ကို ရယူပါ 💕
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] text-white px-8 py-3 rounded-full font-black text-base hover:opacity-95 transition-all shadow-[0_10px_25px_rgba(255,42,109,0.4)] flex items-center gap-2.5 border border-white/50 cursor-pointer"
              >
                <Play size={18} fill="currentColor" />
                <span>ကံစမ်းခြစ်မည်</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Win / Final Prize Overlay */}
        <AnimatePresence>
          {isWin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center"
            >
              <div className="p-4 rounded-full mb-3 shadow-lg bg-emerald-100 text-emerald-500 shadow-emerald-200/60">
                <Trophy size={42} />
              </div>
              <h3
                className="text-xl sm:text-2xl font-black text-gray-800 mb-1.5"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {winTitle}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-5">
                {winSubtitle || 'ကံစမ်းကတ်အားလုံး ခြစ်ပြီး အချစ်ဆု ရရှိပါပြီ! 🎉'}
              </p>
              
              <div className="flex flex-col gap-2.5 w-full max-w-xs">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClaimPrize}
                  className="bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] text-white px-7 py-3 rounded-full font-black text-sm hover:opacity-90 transition-all shadow-[0_8px_20px_rgba(255,42,109,0.4)] flex items-center justify-center gap-2 cursor-pointer border border-white/40"
                >
                  <Gift size={18} /> Final Prize ရယူမည် 🎁
                </motion.button>
                <button
                  onClick={startGame}
                  className="bg-white text-gray-700 border border-pink-200 px-4 py-2 rounded-full font-bold text-xs hover:bg-pink-50 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCcw size={14} /> နောက်တစ်ခါ ခြစ်မည်
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
