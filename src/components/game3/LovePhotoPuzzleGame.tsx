import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, RefreshCcw, Gift, Eye, EyeOff, Sparkles, Wand2 } from 'lucide-react';
import { useSiteData } from '../../contexts/SiteContext';

interface LovePhotoPuzzleGameProps {
  title?: string;
  subtitle?: string;
  winTitle?: string;
  winSubtitle?: string;
  targetScore?: number;
  puzzleImageUrl?: string;
  onClaimPrize: () => void;
}

// 3x3 Puzzle: 0 is the empty tile
const SOLVED_TILES = [1, 2, 3, 4, 5, 6, 7, 8, 0];

// Solvable shuffle with guaranteed solution and balanced difficulty
function getSolvableShuffle(swaps = 14): number[] {
  const tiles = [...SOLVED_TILES];
  let emptyIdx = 8;
  let lastMoved = -1;

  for (let i = 0; i < swaps; i++) {
    const row = Math.floor(emptyIdx / 3);
    const col = emptyIdx % 3;
    const neighbors: number[] = [];

    if (row > 0) neighbors.push(emptyIdx - 3); // Up
    if (row < 2) neighbors.push(emptyIdx + 3); // Down
    if (col > 0) neighbors.push(emptyIdx - 1); // Left
    if (col < 2) neighbors.push(emptyIdx + 1); // Right

    // Filter out immediate backwards step
    const validMoves = neighbors.filter(idx => idx !== lastMoved);
    const chosenIdx = validMoves.length > 0 
      ? validMoves[Math.floor(Math.random() * validMoves.length)]
      : neighbors[0];

    // Swap
    tiles[emptyIdx] = tiles[chosenIdx];
    tiles[chosenIdx] = 0;
    lastMoved = emptyIdx;
    emptyIdx = chosenIdx;
  }

  // Ensure it's not already solved
  if (tiles.every((val, idx) => val === SOLVED_TILES[idx])) {
    const temp = tiles[7];
    tiles[7] = tiles[8];
    tiles[8] = temp;
  }

  return tiles;
}

export function LovePhotoPuzzleGame({
  title = "Love Photo Puzzle! အချစ်ပဟေဠိဆက်ဂိမ်း 🧩",
  subtitle = "ကွက်လပ်သို့ ရွှေ့ကာ ချစ်သူနှစ်ဦးရဲ့ အမှတ်တရပုံရိပ်လေးကို ပြီးပြည့်စုံအောင် ဆက်ပေးပါ",
  winTitle = "အချစ်ပဟေဠိပုံကို အောင်မြင်စွာ ဆက်နိုင်ခဲ့ပါပြီ! 🎉",
  winSubtitle = "There is a special final prize for you 💕",
  puzzleImageUrl,
  onClaimPrize
}: LovePhotoPuzzleGameProps) {
  const { siteData } = useSiteData();
  const [isPlaying, setIsPlaying] = useState(false);
  const [tiles, setTiles] = useState<number[]>(SOLVED_TILES);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showOriginalPreview, setShowOriginalPreview] = useState(false);
  const [isWin, setIsWin] = useState(false);

  // Background image configured from CMS (or fallback to memories / default romantic artwork)
  const puzzleImage = useMemo(() => {
    if (puzzleImageUrl && puzzleImageUrl.trim()) return puzzleImageUrl;
    const memoryImg = siteData.memoriesList?.find(m => m.image && m.image.startsWith('http'))?.image;
    return memoryImg || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80';
  }, [puzzleImageUrl, siteData]);

  // Audio effect on slide
  const playSlideSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // ignore
    }
  }, []);

  const playWinSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.26);
      });
    } catch {
      // ignore
    }
  }, []);

  const startGame = () => {
    const shuffled = getSolvableShuffle(12);
    setTiles(shuffled);
    setIsWin(false);
    setIsPlaying(true);
    setShowOriginalPreview(false);
  };

  const handleTileClick = (index: number) => {
    if (!isPlaying || isWin) return;
    const emptyIndex = tiles.indexOf(0);

    const tileRow = Math.floor(index / 3);
    const tileCol = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;

    // Must be adjacent
    const isAdjacent = (Math.abs(tileRow - emptyRow) === 1 && tileCol === emptyCol) ||
                       (Math.abs(tileCol - emptyCol) === 1 && tileRow === emptyRow);

    if (!isAdjacent) return;

    // Slide tile into empty slot
    const newTiles = [...tiles];
    newTiles[emptyIndex] = tiles[index];
    newTiles[index] = 0;
    setTiles(newTiles);
    playSlideSound();

    // Check if solved
    const solved = newTiles.every((val, i) => val === SOLVED_TILES[i]);
    if (solved) {
      setTimeout(() => {
        setIsWin(true);
        playWinSound();
      }, 400);
    }
  };

  // Sweet helper: auto-solve feature so the user can easily clear it if stuck
  const handleAutoSolve = () => {
    setTiles([...SOLVED_TILES]);
    setTimeout(() => {
      setIsWin(true);
      playWinSound();
    }, 400);
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
        id="love-photo-puzzle-stage"
        className="w-full max-w-sm min-h-[420px] mx-auto bg-gradient-to-b from-rose-50/90 via-pink-50/80 to-purple-50/80 rounded-3xl border-2 border-pink-200 relative overflow-hidden p-4 sm:p-5 shadow-[0_12px_32px_rgba(255,105,180,0.2)] select-none flex flex-col justify-between"
      >
        {/* Top Control Bar (Moves counter removed per user request) */}
        <div className="flex justify-between items-center px-1 mb-2 gap-2 z-10">
          <button
            type="button"
            onClick={() => setShowOriginalPreview(!showOriginalPreview)}
            className="bg-white/95 hover:bg-white text-[#FF2E74] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm border border-pink-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>{showOriginalPreview ? 'Hide Photo' : 'Original Photo 🖼️'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNumbers(!showNumbers)}
              className="bg-white/95 hover:bg-white text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-pink-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Toggle Numbers"
            >
              {showNumbers ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{showNumbers ? 'Hide Numbers' : 'Numbers'}</span>
            </button>

            {isPlaying && !isWin && (
              <button
                type="button"
                onClick={handleAutoSolve}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                title="Auto solve helper"
              >
                <Wand2 size={12} />
                <span>Help 💕</span>
              </button>
            )}
          </div>
        </div>

        {/* 3x3 Puzzle Stage with romantic photo frame */}
        <div className="relative mx-auto w-full aspect-square max-w-[300px] sm:max-w-[320px] bg-gradient-to-tr from-pink-200 via-rose-100 to-pink-200 p-2.5 rounded-3xl border-2 border-white shadow-[0_8px_25px_rgba(255,105,180,0.3)]">
          <div className="grid grid-cols-3 grid-rows-3 gap-1.5 h-full w-full">
            {tiles.map((tileVal, index) => {
              if (tileVal === 0) {
                // Empty Space
                return (
                  <div
                    key="empty"
                    className="w-full h-full rounded-2xl bg-white/40 border-2 border-dashed border-pink-300 flex items-center justify-center text-pink-400 text-xs font-bold shadow-inner"
                  >
                    <span>ကွက်လပ်</span>
                  </div>
                );
              }

              // Calculate background slice position (3x3)
              const originalPos = tileVal - 1;
              const origRow = Math.floor(originalPos / 3);
              const origCol = originalPos % 3;

              return (
                <motion.button
                  key={tileVal}
                  type="button"
                  layout
                  onClick={() => handleTileClick(index)}
                  whileHover={isPlaying ? { scale: 1.03 } : {}}
                  whileTap={isPlaying ? { scale: 0.95 } : {}}
                  className="relative w-full h-full rounded-2xl overflow-hidden shadow-md border border-white active:ring-2 active:ring-[#FF2E74] focus:outline-none cursor-pointer group"
                  style={{
                    backgroundImage: `url(${puzzleImage})`,
                    backgroundSize: '300% 300%',
                    backgroundPosition: `${origCol * 50}% ${origRow * 50}%`
                  }}
                >
                  {/* Delicate sheen */}
                  <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />

                  {/* Tile Number Badge */}
                  {showNumbers && (
                    <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-lg shadow-sm backdrop-blur-xs">
                      {tileVal}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Original Photo Preview Modal */}
          <AnimatePresence>
            {showOriginalPreview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-3xl p-3 flex flex-col items-center justify-center z-20 shadow-xl"
              >
                <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-pink-300 shadow-md relative">
                  <img
                    src={puzzleImage}
                    alt="Original Photo"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOriginalPreview(false)}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white px-2.5 py-1 rounded-full text-xs font-bold"
                  >
                    ပိတ်မည် ✕
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-[11px] text-gray-500 font-medium text-center mt-2.5">
          💡 ကွက်လပ်ဘေးရှိ အကွက်များကို နှိပ်၍ ပုံရိပ်လေးကို နေရာချပေးပါ
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
              {/* Photo thumbnail */}
              <div className="relative mb-3">
                <div className="w-22 h-22 rounded-3xl overflow-hidden border-3 border-pink-300 shadow-xl shadow-pink-300/40 mx-auto">
                  <img 
                    src={puzzleImage} 
                    alt="Puzzle Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-1">Love Photo Puzzle</h3>
              <p className="text-xs sm:text-sm text-gray-600 max-w-xs mb-5 font-medium leading-relaxed">
                အကွက်များကို ရွှေ့ကာ ချစ်သူနှစ်ဦးရဲ့ အမှတ်တရပုံရိပ်လေးကို ပြီးပြည့်စုံအောင် ဆက်ပြီး Final Prize ကို ရယူပါ 💕
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] text-white px-8 py-3 rounded-full font-black text-base hover:opacity-95 transition-all shadow-[0_10px_25px_rgba(255,42,109,0.4)] flex items-center gap-2.5 border border-white/50 cursor-pointer"
              >
                <Play size={18} fill="currentColor" />
                <span>ပဟေဠိစတင်မည်</span>
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
                {winSubtitle || 'အမှတ်တရပုံရိပ်လေးကို အောင်မြင်စွာ ပြည့်စုံစေခဲ့ပါပြီ! 💕'}
              </p>
              
              <div className="flex flex-col gap-2.5 w-full max-w-xs">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClaimPrize}
                  className="bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] text-white px-7 py-3 rounded-full font-black text-sm hover:opacity-95 transition-all shadow-[0_8px_20px_rgba(255,42,109,0.4)] flex items-center justify-center gap-2 cursor-pointer border border-white/40"
                >
                  <Gift size={18} /> Final Prize ရယူမည် 🎁
                </motion.button>
                <button
                  onClick={startGame}
                  className="bg-white text-gray-700 border border-pink-200 px-4 py-2 rounded-full font-bold text-xs hover:bg-pink-50 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCcw size={14} /> ပြန်ဆက်မည်
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
