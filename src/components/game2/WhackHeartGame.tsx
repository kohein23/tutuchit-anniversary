import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, RefreshCcw, Sparkles } from 'lucide-react';

interface WhackHeartGameProps {
  title?: string;
  subtitle?: string;
  winMessage?: string;
  targetScore?: number;
  onGameClear: () => void;
  onNextGame: () => void;
}

interface HoleItem {
  id: number;
  type: 'heart' | 'golden_heart' | 'teddy' | 'bomb';
  icon: string;
  points: number;
}

const TOTAL_HOLES = 9;

export function WhackHeartGame({
  title = "Whack-a-Heart! ရင်ခုန်သံဖမ်းဂိမ်း 🔨",
  subtitle = "အပေါက်များမှ ပေါ်လာသော အသည်းပုံနှင့် ချစ်စရာအရုပ်များကို အချိန်မီ နှိပ်ဖမ်းပါ",
  winMessage = "ရင်ခုန်သံအသည်းပုံများကို အောင်မြင်စွာ ဖမ်းယူနိုင်ခဲ့ပါပြီ! 🎉",
  targetScore = 15,
  onGameClear,
  onNextGame
}: WhackHeartGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [activeHoles, setActiveHoles] = useState<Record<number, HoleItem>>({});
  const [whackedHoles, setWhackedHoles] = useState<Record<number, { points: number; text: string }>>({});
  const [isWin, setIsWin] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    setActiveHoles({});
    setWhackedHoles({});
    setIsWin(false);
    setIsTimeUp(false);
  };

  // Game countdown timer
  useEffect(() => {
    if (!isPlaying || isWin || isTimeUp) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isWin, isTimeUp]);

  // Mole/Heart spawn loop
  useEffect(() => {
    if (!isPlaying || isWin || isTimeUp) return;

    const spawnMole = () => {
      // Pick 1 to 2 random empty holes
      const holeIndex = Math.floor(Math.random() * TOTAL_HOLES);

      // Randomize mole types
      const rand = Math.random();
      let newItem: HoleItem;

      if (rand < 0.5) {
        newItem = { id: Date.now(), type: 'heart', icon: '💖', points: 1 };
      } else if (rand < 0.75) {
        newItem = { id: Date.now(), type: 'teddy', icon: '🧸', points: 2 };
      } else if (rand < 0.9) {
        newItem = { id: Date.now(), type: 'golden_heart', icon: '✨💖✨', points: 3 };
      } else {
        newItem = { id: Date.now(), type: 'bomb', icon: '💔', points: -1 };
      }

      setActiveHoles(prev => ({
        ...prev,
        [holeIndex]: newItem
      }));

      // Disappear after duration if not whacked
      const stayDuration = Math.random() * 600 + 850; // 850ms - 1450ms
      setTimeout(() => {
        setActiveHoles(prev => {
          if (prev[holeIndex]?.id === newItem.id) {
            const next = { ...prev };
            delete next[holeIndex];
            return next;
          }
          return prev;
        });
      }, stayDuration);
    };

    spawnRef.current = setInterval(spawnMole, 650);

    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [isPlaying, isWin, isTimeUp]);

  // Check win condition
  useEffect(() => {
    if (score >= targetScore && !isWin && isPlaying) {
      setIsWin(true);
      setIsPlaying(false);
      onGameClear();
    }
  }, [score, targetScore, isWin, isPlaying, onGameClear]);

  const handleWhack = (index: number) => {
    if (!isPlaying || isWin || isTimeUp) return;
    const item = activeHoles[index];
    if (!item) return;

    // Calculate score
    const gained = item.points;
    setScore(prev => Math.max(0, prev + gained));

    // Show whack animation popup
    setWhackedHoles(prev => ({
      ...prev,
      [index]: {
        points: gained,
        text: gained > 0 ? `+${gained}` : `${gained}`
      }
    }));

    // Remove from active holes immediately
    setActiveHoles(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    // Clear popup after short delay
    setTimeout(() => {
      setWhackedHoles(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }, 550);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-[#FF6B95] mb-2 mt-14 sm:mt-6 px-4" style={{ fontFamily: 'Georgia, serif' }}>
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-gray-500 mb-4 px-4 font-medium">
        {subtitle}
      </p>

      <div 
        id="whack-a-heart-stage"
        className="w-full min-h-[420px] sm:min-h-[460px] bg-gradient-to-b from-rose-50/70 via-pink-50/40 to-amber-50/30 backdrop-blur-md rounded-3xl border border-white/80 relative overflow-hidden p-4 sm:p-6 shadow-inner select-none flex flex-col justify-between"
      >
        {/* Top HUD */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full font-bold text-xs sm:text-sm text-rose-600 shadow-xs border border-rose-100 flex items-center gap-1.5">
            <span>⏱️ အချိန်:</span>
            <span className={timeLeft <= 8 ? 'text-red-500 font-extrabold animate-pulse' : 'text-gray-800'}>
              {timeLeft}s
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-pink-100/70 rounded-full text-[11px] font-semibold text-pink-700">
            <span>🔨 ပေါ်လာတဲ့ အသည်းပုံလေးတွေကို အမြန်နှိပ်ပါ</span>
          </div>

          <div className={`px-3.5 py-1.5 rounded-full font-bold text-xs sm:text-sm shadow-xs border backdrop-blur-md transition-all flex items-center gap-1.5 ${
            score >= targetScore
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
              : 'bg-white/90 text-pink-600 border-pink-100'
          }`}>
            <Sparkles size={14} className={score >= targetScore ? 'text-emerald-500 animate-spin' : 'text-pink-400'} />
            <span>ရမှတ်: {score}/{targetScore}</span>
          </div>
        </div>

        {/* 3x3 Whack Holes Grid */}
        <div className="relative mx-auto max-w-[340px] sm:max-w-[380px] w-full aspect-square bg-pink-100/40 p-3 sm:p-4 rounded-3xl border border-pink-200/80 shadow-md">
          <div className="grid grid-cols-3 grid-rows-3 gap-3 sm:gap-4 h-full w-full">
            {Array.from({ length: TOTAL_HOLES }).map((_, index) => {
              const item = activeHoles[index];
              const pop = whackedHoles[index];

              return (
                <div
                  key={index}
                  className="relative flex items-end justify-center rounded-2xl bg-gradient-to-b from-pink-200/50 to-pink-300/60 border-2 border-pink-200 shadow-inner overflow-hidden"
                >
                  {/* The Hole base rim */}
                  <div className="absolute bottom-1 w-4/5 h-4 sm:h-5 bg-pink-950/20 rounded-full blur-[1px]" />

                  {/* Pop Text Effect */}
                  <AnimatePresence>
                    {pop && (
                      <motion.div
                        initial={{ opacity: 1, y: 0, scale: 0.8 }}
                        animate={{ opacity: 0, y: -25, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        className={`absolute top-2 z-30 font-black text-xs sm:text-sm px-2 py-0.5 rounded-full shadow-xs ${
                          pop.points > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        {pop.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Rising Heart / Mole Item */}
                  <AnimatePresence>
                    {item && (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => handleWhack(index)}
                        initial={{ y: 50, scale: 0.6, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={{ y: 40, scale: 0.5, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                        whileTap={{ scale: 0.85 }}
                        className="relative z-10 mb-2 sm:mb-3 cursor-pointer select-none focus:outline-none flex flex-col items-center justify-center"
                      >
                        <div className={`text-3xl sm:text-4xl filter drop-shadow-md transition-transform hover:scale-110 active:scale-90 ${
                          item.type === 'golden_heart' ? 'animate-bounce' : ''
                        }`}>
                          {item.icon}
                        </div>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Game Overlay */}
        <AnimatePresence>
          {!isPlaying && !isWin && !isTimeUp && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/85 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 mb-3 text-3xl shadow-inner">
                🔨
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Whack-a-Heart! ရင်ခုန်သံဖမ်းဂိမ်း</h3>
              <p className="text-xs text-gray-500 max-w-xs mb-5">
                အပေါက်များမှ ပေါ်လာသော အသည်းပုံ 💖 (၁ မှတ်)၊ အရုပ် 🧸 (၂ မှတ်) နှင့် ရွှေရောင်အသည်း ✨💖✨ (၃ မှတ်) များကို အချိန်မီနှိပ်ပြီး ပစ်မှတ်ရမှတ် {targetScore} ပြည့်အောင် ယူပါ
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-7 py-3 rounded-full font-bold text-base hover:opacity-95 transition-all shadow-lg flex items-center gap-2.5"
              >
                <Play size={20} fill="currentColor" />
                <span>ဂိမ်းစကစားမည်</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Win Overlay */}
        <AnimatePresence>
          {isWin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center"
            >
              <div className="p-4 rounded-full mb-3 shadow-lg bg-emerald-100 text-emerald-500">
                <Trophy size={42} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                {winMessage}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-5">
                ရမှတ် {score} မှတ် ရရှိပြီး ပစ်မှတ် {targetScore} မှတ်ကို အောင်မြင်စွာ ဖမ်းယူနိုင်ခဲ့ပါသည်! 🎉
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={startGame}
                  className="bg-rose-500 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-rose-600 transition-all shadow-md flex items-center gap-2"
                >
                  <RefreshCcw size={16} /> ပြန်ကစားမည်
                </button>
                <button
                  onClick={onNextGame}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center gap-2"
                >
                  <span>နောက်ဂိမ်းသို့ ▶</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time Up (Didn't reach target score in time) Overlay */}
        <AnimatePresence>
          {!isWin && isTimeUp && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center"
            >
              <div className="p-4 rounded-full mb-3 shadow-lg bg-rose-100 text-rose-500 text-3xl">
                ⏱️
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                အချိန်ကုန်သွားပါပြီ 😢
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-5">
                ရမှတ် {score}/{targetScore} မှတ်သာ ရရှိခဲ့ပါသည်။ ထပ်မံကြိုးစားကြည့်ပါ
              </p>
              
              <button
                onClick={startGame}
                className="bg-rose-500 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-rose-600 transition-all shadow-md flex items-center gap-2"
              >
                <RefreshCcw size={16} /> ပြန်လည်ကစားမည်
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
