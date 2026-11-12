import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, RefreshCcw, Sparkles, Heart } from 'lucide-react';

interface CandyCrushGameProps {
  title?: string;
  subtitle?: string;
  winMessage?: string;
  targetScore?: number;
  onGameClear: () => void;
  onNextGame: () => void;
}

const CANDY_TYPES = ['💖', '🍬', '🍓', '🍩', '🍫'];
const ROWS = 6;
const COLS = 6;
const DEFAULT_MOVES = 30;

type Position = { r: number; c: number };

// Helper to create random candy
function getRandomCandy(): string {
  return CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
}

// Find horizontal and vertical matches (3 or more)
function findMatches(grid: string[][]): Position[] {
  const matchedSet = new Set<string>();

  // Check horizontal matches
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      const candy = grid[r][c];
      if (!candy) continue;
      let matchLength = 1;
      while (c + matchLength < COLS && grid[r][c + matchLength] === candy) {
        matchLength++;
      }
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matchedSet.add(`${r},${c + i}`);
        }
      }
    }
  }

  // Check vertical matches
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 2; r++) {
      const candy = grid[r][c];
      if (!candy) continue;
      let matchLength = 1;
      while (r + matchLength < ROWS && grid[r + matchLength][c] === candy) {
        matchLength++;
      }
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matchedSet.add(`${r + i},${c}`);
        }
      }
    }
  }

  const result: Position[] = [];
  matchedSet.forEach(pos => {
    const [r, c] = pos.split(',').map(Number);
    result.push({ r, c });
  });
  return result;
}

// Create initial board with NO existing 3-in-a-row matches
function createInitialBoard(): string[][] {
  let board: string[][] = [];
  let hasMatches = true;

  while (hasMatches) {
    board = [];
    for (let r = 0; r < ROWS; r++) {
      const row: string[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push(getRandomCandy());
      }
      board.push(row);
    }
    hasMatches = findMatches(board).length > 0;
  }

  return board;
}

export function CandyCrushGame({
  title = "Sweet Candy Match! 🍬",
  subtitle = "သကြားလုံး/အသည်းပုံ (၃) ခု တန်းစီအောင် တွဲစပ်ပြီး အမှတ်ပြည့်အောင် ယူပါ",
  winMessage = "ချိုမြိန်သောအချစ် သကြားလုံးဂိမ်းကို အောင်မြင်စွာ ကစားနိုင်ခဲ့ပါပြီ! 🎉",
  targetScore = 120,
  onGameClear,
  onNextGame
}: CandyCrushGameProps) {
  const [board, setBoard] = useState<string[][]>(createInitialBoard);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selected, setSelected] = useState<Position | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(DEFAULT_MOVES);
  const [isWin, setIsWin] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [poppingTiles, setPoppingTiles] = useState<Position[]>([]);
  const [combo, setCombo] = useState(1);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  const touchStartRef = useRef<{ x: number; y: number; pos: Position } | null>(null);

  const startGame = () => {
    setBoard(createInitialBoard());
    setSelected(null);
    setIsProcessing(false);
    setScore(0);
    setMovesLeft(DEFAULT_MOVES);
    setIsWin(false);
    setIsGameOver(false);
    setPoppingTiles([]);
    setCombo(1);
    setFloatingTexts([]);
    setIsPlaying(true);
  };

  // Process cascading drops and matches
  const handleBoardCascade = useCallback((currentBoard: string[][], currentScore: number, currentCombo: number) => {
    const matches = findMatches(currentBoard);

    if (matches.length === 0) {
      // Done cascading
      setIsProcessing(false);
      setCombo(1);
      return;
    }

    // Mark popping
    setPoppingTiles(matches);

    // Calculate score
    const pointsGained = matches.length * 10 * currentCombo;
    const newScore = currentScore + pointsGained;
    setScore(newScore);

    // Spawn floating score text near first match
    const first = matches[0];
    const textId = Math.random();
    setFloatingTexts(prev => [
      ...prev,
      {
        id: textId,
        text: currentCombo > 1 ? `+${pointsGained} (${currentCombo}x Combo! 🔥)` : `+${pointsGained}`,
        x: (first.c / COLS) * 100 + 8,
        y: (first.r / ROWS) * 100 + 4
      }
    ]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== textId));
    }, 750);

    if (newScore >= targetScore) {
      setIsWin(true);
      onGameClear();
    }

    // Animate pop, then drop candies down
    setTimeout(() => {
      // Clear matched positions
      const newGrid = currentBoard.map(row => [...row]);
      for (const { r, c } of matches) {
        newGrid[r][c] = '';
      }

      // Drop candies down per column
      for (let c = 0; c < COLS; c++) {
        let emptyRow = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (newGrid[r][c] !== '') {
            if (emptyRow !== r) {
              newGrid[emptyRow][c] = newGrid[r][c];
              newGrid[r][c] = '';
            }
            emptyRow--;
          }
        }
        // Fill remaining empty spots with new random candies
        for (let r = emptyRow; r >= 0; r--) {
          newGrid[r][c] = getRandomCandy();
        }
      }

      setBoard(newGrid);
      setPoppingTiles([]);

      // Trigger next cascade check after short drop delay
      setTimeout(() => {
        handleBoardCascade(newGrid, newScore, currentCombo + 1);
      }, 260);
    }, 320);
  }, [onGameClear, targetScore]);

  // Execute swap between pos1 and pos2
  const executeSwap = (pos1: Position, pos2: Position) => {
    if (isProcessing || isWin || isGameOver) return;

    // Check adjacency (only horizontally or vertically adjacent)
    const rowDiff = Math.abs(pos1.r - pos2.r);
    const colDiff = Math.abs(pos1.c - pos2.c);
    const isAdjacent = (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);

    if (!isAdjacent) {
      setSelected(pos2);
      return;
    }

    setIsProcessing(true);
    setSelected(null);

    // Create swapped board
    const tempBoard = board.map(row => [...row]);
    const candy1 = tempBoard[pos1.r][pos1.c];
    const candy2 = tempBoard[pos2.r][pos2.c];
    tempBoard[pos1.r][pos1.c] = candy2;
    tempBoard[pos2.r][pos2.c] = candy1;

    // Check if swap produces valid matches
    const matches = findMatches(tempBoard);

    if (matches.length > 0) {
      // Valid swap!
      setBoard(tempBoard);
      const remainingMoves = movesLeft - 1;
      setMovesLeft(remainingMoves);

      // Start cascade loop
      handleBoardCascade(tempBoard, score, 1);

      // Check game over if no moves left and not yet target score
      if (remainingMoves <= 0 && score < targetScore) {
        setTimeout(() => {
          setIsGameOver(true);
        }, 800);
      }
    } else {
      // Invalid swap - brief visual feedback, then revert
      setBoard(tempBoard);
      setTimeout(() => {
        // Swap back
        const reverted = tempBoard.map(row => [...row]);
        reverted[pos1.r][pos1.c] = candy1;
        reverted[pos2.r][pos2.c] = candy2;
        setBoard(reverted);
        setIsProcessing(false);
      }, 240);
    }
  };

  const handleTileClick = (r: number, c: number) => {
    if (!isPlaying || isProcessing || isWin || isGameOver) return;

    if (!selected) {
      setSelected({ r, c });
    } else {
      if (selected.r === r && selected.c === c) {
        // Deselect
        setSelected(null);
      } else {
        executeSwap(selected, { r, c });
      }
    }
  };

  // Touch Swipe Handlers for mobile smoothness
  const handleTouchStart = (e: React.TouchEvent, r: number, c: number) => {
    if (!isPlaying || isProcessing) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      pos: { r, c }
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !isPlaying || isProcessing) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const { r, c } = touchStartRef.current.pos;
    touchStartRef.current = null;

    const minSwipe = 24;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > minSwipe && c < COLS - 1) {
        executeSwap({ r, c }, { r, c: c + 1 });
      } else if (dx < -minSwipe && c > 0) {
        executeSwap({ r, c }, { r, c: c - 1 });
      }
    } else {
      // Vertical swipe
      if (dy > minSwipe && r < ROWS - 1) {
        executeSwap({ r, c }, { r: r + 1, c });
      } else if (dy < -minSwipe && r > 0) {
        executeSwap({ r, c }, { r: r - 1, c });
      }
    }
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
        id="sweet-candy-crush-stage"
        className="w-full min-h-[410px] sm:min-h-[460px] bg-gradient-to-b from-rose-50/60 via-pink-50/40 to-amber-50/30 backdrop-blur-md rounded-3xl border border-white/80 relative overflow-hidden p-4 sm:p-6 shadow-inner select-none flex flex-col justify-between"
      >
        {/* Top HUD */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full font-bold text-xs sm:text-sm text-rose-600 shadow-xs border border-rose-100 flex items-center gap-1.5">
            <span>🎯 Moves:</span>
            <span className={movesLeft <= 5 ? 'text-red-500 font-extrabold animate-pulse' : 'text-gray-800'}>
              {movesLeft}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-pink-100/70 rounded-full text-[11px] font-semibold text-pink-700">
            <span>🍬 Swap 3 items to match</span>
          </div>

          <div className={`px-3.5 py-1.5 rounded-full font-bold text-xs sm:text-sm shadow-xs border backdrop-blur-md transition-all flex items-center gap-1.5 ${
            score >= targetScore
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
              : 'bg-white/90 text-pink-600 border-pink-100'
          }`}>
            <Sparkles size={14} className={score >= targetScore ? 'text-emerald-500 animate-spin' : 'text-pink-400'} />
            <span>Score: {score}/{targetScore}</span>
          </div>
        </div>

        {/* 6x6 Candy Grid */}
        <div className="relative mx-auto max-w-[340px] sm:max-w-[380px] w-full aspect-square bg-white/40 p-2.5 sm:p-3 rounded-2xl border border-pink-200/80 shadow-md">
          {/* Floating Score Popup Particles */}
          {floatingTexts.map(f => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -30, scale: 1.2 }}
              transition={{ duration: 0.7 }}
              className="absolute pointer-events-none z-30 font-black text-rose-600 drop-shadow-md text-xs sm:text-sm bg-white/95 px-2 py-0.5 rounded-full border border-pink-200 shadow-sm"
              style={{ left: `${f.x}%`, top: `${f.y}%` }}
            >
              {f.text}
            </motion.div>
          ))}

          <div className="grid grid-cols-6 grid-rows-6 gap-1.5 sm:gap-2 h-full w-full">
            {board.map((row, r) =>
              row.map((candy, c) => {
                const isSelected = selected?.r === r && selected?.c === c;
                const isPopping = poppingTiles.some(p => p.r === r && p.c === c);

                return (
                  <motion.button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleTileClick(r, c)}
                    onTouchStart={(e) => handleTouchStart(e, r, c)}
                    onTouchEnd={handleTouchEnd}
                    whileHover={isPlaying && !isProcessing ? { scale: 1.06 } : {}}
                    whileTap={isPlaying && !isProcessing ? { scale: 0.92 } : {}}
                    animate={
                      isPopping
                        ? { scale: [1, 1.35, 0], opacity: [1, 0.9, 0] }
                        : isSelected
                        ? { scale: [1, 1.12, 1.05], transition: { repeat: Infinity, duration: 0.8 } }
                        : { scale: 1, opacity: 1 }
                    }
                    className={`aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-all shadow-xs relative border select-none ${
                      isSelected
                        ? 'bg-gradient-to-br from-pink-200 to-rose-200 border-rose-400 ring-4 ring-rose-300/80 shadow-md z-10'
                        : isPopping
                        ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-300'
                        : 'bg-white/85 hover:bg-white border-pink-100 hover:border-pink-300 shadow-sm'
                    }`}
                  >
                    <span className="filter drop-shadow-sm select-none pointer-events-none">
                      {candy}
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Start Game Overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 mb-3 text-3xl shadow-inner">
                🍬
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">ချိုမြိန်အချစ် သကြားလုံးဂိမ်း (Candy Crush)</h3>
              <p className="text-xs text-gray-500 max-w-xs mb-5">
                အသည်းပုံနှင့် သကြားလုံး (၃) ခု တန်းစီအောင် နေရာလဲလှယ်၍ အမှတ် {targetScore} ပြည့်အောင် ယူပါ
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
                ရမှတ် {score} မှတ်ဖြင့် ပစ်မှတ် {targetScore} မှတ်ကို အောင်မြင်စွာ ပြည့်မီခဲ့ပါသည်! 🎉
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

        {/* Game Over (out of moves without reaching score) Overlay */}
        <AnimatePresence>
          {!isWin && isGameOver && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center"
            >
              <div className="p-4 rounded-full mb-3 shadow-lg bg-rose-100 text-rose-500">
                <Heart size={42} fill="currentColor" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Moves ကုန်သွားပါပြီ 😢
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-5">
                ရမှတ် {score}/{targetScore} မှတ်သာ ရရှိခဲ့ပါသည်။ ပြန်လည်ကြိုးစားကြည့်ပါ
              </p>
              
              <button
                onClick={startGame}
                className="bg-rose-500 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-rose-600 transition-all shadow-md flex items-center gap-2"
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
