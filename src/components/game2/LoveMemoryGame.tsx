import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, RefreshCcw, Sparkles } from 'lucide-react';

interface CardItem {
  id: number;
  emoji: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface LoveMemoryGameProps {
  title?: string;
  subtitle?: string;
  winMessage?: string;
  onGameClear: () => void;
  onNextGame: () => void;
}

const CARD_DATA = [
  { emoji: '💖', name: 'Love' },
  { emoji: '💌', name: 'Letter' },
  { emoji: '💍', name: 'Ring' },
  { emoji: '🧸', name: 'Teddy' },
  { emoji: '🌹', name: 'Rose' },
  { emoji: '🍫', name: 'Chocolate' },
];

function generateShuffledCards(): CardItem[] {
  const deck = [...CARD_DATA, ...CARD_DATA].map((item, index) => ({
    id: index,
    emoji: item.emoji,
    name: item.name,
    isFlipped: false,
    isMatched: false
  }));

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function LoveMemoryGame({
  title = "Love Memory Cards Match 💕",
  subtitle = "အတွဲတူ အချစ်ကတ်ပြား ၆ စုံကို ရှာဖွေလှန်ပေးပါ",
  winMessage = "အချစ်ကတ်ပြား အားလုံးကို အောင်မြင်စွာ တွဲစပ်နိုင်ခဲ့ပါပြီ! 🎉",
  onGameClear,
  onNextGame
}: LoveMemoryGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cards, setCards] = useState<CardItem[]>(generateShuffledCards);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const playAudio = useCallback((type: 'flip' | 'match' | 'win') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'match') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.29);
      }
    } catch {
      // ignore
    }
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isWin) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isWin]);

  const startGame = () => {
    setCards(generateShuffledCards());
    setFlippedIndices([]);
    setIsLocked(false);
    setMoves(0);
    setMatchedCount(0);
    setIsWin(false);
    setSeconds(0);
    setIsPlaying(true);
  };

  const handleCardClick = (index: number) => {
    if (!isPlaying || isLocked || isWin) return;
    const clickedCard = cards[index];

    if (clickedCard.isFlipped || clickedCard.isMatched) return;

    playAudio('flip');

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);

      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.emoji === secondCard.emoji) {
        // Matched!
        setTimeout(() => {
          playAudio('match');
          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);
          setIsLocked(false);

          setMatchedCount(count => {
            const nextCount = count + 1;
            if (nextCount >= 6) {
              setIsWin(true);
              onGameClear();
            }
            return nextCount;
          });
        }, 350);
      } else {
        // Not matched, flip back
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
          setIsLocked(false);
        }, 750);
      }
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
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
        id="love-memory-stage"
        className="w-full min-h-[380px] sm:min-h-[420px] bg-gradient-to-b from-rose-50/90 via-pink-50/80 to-purple-50/80 rounded-3xl border-2 border-pink-200 relative overflow-hidden p-4 sm:p-6 shadow-[0_12px_32px_rgba(255,105,180,0.2)] select-none flex flex-col justify-between"
      >
        {/* HUD */}
        <div className="flex items-center justify-between gap-2 mb-3 z-10">
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm text-[#FF2E74] shadow-md border border-pink-200 flex items-center gap-1.5">
            <span>⏱️</span>
            <span>Time: {formatTime(seconds)}</span>
          </div>

          <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm text-purple-600 shadow-md border border-purple-200 flex items-center gap-1.5">
            <span>✨</span>
            <span>Flips: {moves}</span>
          </div>

          <div className={`px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm shadow-md border backdrop-blur-md transition-all flex items-center gap-1.5 ${
            matchedCount === 6 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-300 shadow-emerald-100' 
              : 'bg-white/95 text-[#FF2E74] border-pink-200'
          }`}>
            <Sparkles size={14} className={matchedCount === 6 ? 'text-emerald-500 animate-spin' : 'text-pink-400'} />
            <span>Pairs: {matchedCount}/6</span>
          </div>
        </div>

        {/* 4x3 Card Grid */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 my-auto max-w-md mx-auto w-full z-10">
          {cards.map((card, idx) => {
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <motion.button
                key={card.id}
                type="button"
                whileHover={!isRevealed && isPlaying ? { scale: 1.05, y: -2 } : {}}
                whileTap={!isRevealed && isPlaying ? { scale: 0.95 } : {}}
                onClick={() => handleCardClick(idx)}
                disabled={isRevealed || isLocked || !isPlaying}
                className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 relative shadow-md border-2 cursor-pointer ${
                  card.isMatched
                    ? 'bg-gradient-to-br from-emerald-100 to-pink-100 border-emerald-300 shadow-emerald-100/50'
                    : card.isFlipped
                    ? 'bg-white border-[#FF2E74] shadow-pink-200/50'
                    : 'bg-gradient-to-br from-[#FF3366] via-[#FF5388] to-[#FF758C] border-white/90 hover:brightness-105'
                }`}
              >
                {isRevealed ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="text-2xl sm:text-3xl filter drop-shadow-sm select-none"
                  >
                    {card.emoji}
                  </motion.span>
                ) : (
                  <span className="text-white/90 text-xl sm:text-2xl font-bold font-serif select-none drop-shadow-xs">
                    ♥
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Start Game Overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white mb-3 text-3xl shadow-lg shadow-pink-300/60">
                🎴
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-1.5">အတွဲညီအသည်းကတ်လှန်ဂိမ်း</h3>
              <p className="text-xs sm:text-sm text-gray-600 max-w-xs mb-5 font-medium leading-relaxed">
                ကတ်ပြားလေးတွေကို လှန်ပြီး တူညီတဲ့အတွဲ (၆) တွဲလုံး တွေ့အောင် ရှာဖွေပေးပါ
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

        {/* Win Overlay */}
        <AnimatePresence>
          {isWin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center"
            >
              <div className="p-4 rounded-full mb-3 shadow-lg bg-emerald-100 text-emerald-500 shadow-emerald-200/60">
                <Trophy size={42} />
              </div>
              <h3
                className="text-xl sm:text-2xl font-black text-gray-800 mb-1.5"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {winMessage}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-5">
                အချိန် {formatTime(seconds)} အတွင်း အတွဲ (၆) တွဲလုံး အောင်မြင်စွာ တွဲစပ်နိုင်ခဲ့ပါသည်! 🎉
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={startGame}
                  className="bg-rose-500 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-rose-600 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCcw size={16} /> ပြန်ကစားမည်
                </button>
                <button
                  onClick={onNextGame}
                  className="bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] text-white px-6 py-2.5 rounded-full font-black text-sm hover:opacity-90 transition-all shadow-[0_8px_20px_rgba(255,42,109,0.4)] flex items-center gap-2 cursor-pointer border border-white/40"
                >
                  <span>နောက်ဂိမ်းသို့ ▶</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
