import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, RefreshCcw, Gift } from 'lucide-react';

interface FlappyBirdGameProps {
  title?: string;
  subtitle?: string;
  winTitle?: string;
  winSubtitle?: string;
  targetScore?: number;
  onClaimPrize: () => void;
}

type Obstacle = {
  id: number;
  x: number;
  gapTop: number;
  passed: boolean;
};

// Game Constants (percentages)
const GRAVITY = 0.12;
const JUMP = -2.8;
const OBSTACLE_SPEED = 0.4;
const BIRD_X = 20; 
const BIRD_SIZE_X = 12; // width percentage
const BIRD_SIZE_Y = 8;  // height percentage
const OBSTACLE_WIDTH = 16;
const GAP_SIZE = 50;

export function FlappyBirdGame({
  title = "Let's overcome all obstacles together 💕",
  subtitle = "နှိပ်၍ ပျံသန်းပြီး အတားအဆီးများကို ကျော်ဖြတ်ပါ",
  winTitle = "All obstacles cleared! 🎉",
  winSubtitle = "There is a special prize for my amazing baby 💕",
  targetScore = 5,
  onClaimPrize
}: FlappyBirdGameProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [showPrizePrompt, setShowPrizePrompt] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  
  const [birdY, setBirdY] = useState(50);
  const [birdRotation, setBirdRotation] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const requestRef = useRef<number>(0);
  const birdYRef = useRef(50);
  const birdVelocityRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);
  const isPlayingRef = useRef(false);
  const hasPromptedRef = useRef(false);

  const startGameInternal = () => {
    setIsPlaying(true);
    setGameOver(false);
    setShowPrizePrompt(false);
    setHasPrompted(false);
    setScore(0);
    setBirdY(50);
    setBirdRotation(0);
    setObstacles([]);
    
    birdYRef.current = 50;
    birdVelocityRef.current = 0;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    frameCountRef.current = 0;
    isPlayingRef.current = true;
    hasPromptedRef.current = false;
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
    setGameOver(false);
    setShowPrizePrompt(false);
    setHasPrompted(false);
    setScore(0);
    setBirdY(50);
    setBirdRotation(0);
    setObstacles([]);
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      startGameInternal();
    }
  }, [countdown]);

  const stopGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    isPlayingRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const jump = () => {
    if (isPlayingRef.current) {
      birdVelocityRef.current = JUMP;
    }
  };

  const gameLoop = () => {
    if (!isPlayingRef.current) return;

    if (scoreRef.current >= targetScore && !hasPromptedRef.current) {
      hasPromptedRef.current = true;
      setHasPrompted(true);
      setShowPrizePrompt(true);
      isPlayingRef.current = false;
      setIsPlaying(false);
      return; // Pause the loop
    }

    // Apply gravity
    birdVelocityRef.current += GRAVITY;
    birdYRef.current += birdVelocityRef.current;

    // Floor / Ceiling collision
    if (birdYRef.current > 100 - BIRD_SIZE_Y || birdYRef.current < 0) {
      stopGame();
      return;
    }

    // Spawn obstacles
    frameCountRef.current += 1;
    if (frameCountRef.current % 160 === 0) {
      const minGapTop = 15;
      const maxGapTop = 100 - GAP_SIZE - 15;
      const randomGapTop = Math.floor(Math.random() * (maxGapTop - minGapTop + 1)) + minGapTop;
      
      obstaclesRef.current.push({
        id: Date.now(),
        x: 100,
        gapTop: randomGapTop,
        passed: false
      });
    }

    // Move obstacles and check collisions
    let collision = false;
    
    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.x -= OBSTACLE_SPEED;

      // Collision check
      const birdLeft = BIRD_X;
      const birdRight = BIRD_X + BIRD_SIZE_X;
      const birdTop = birdYRef.current;
      const birdBottom = birdYRef.current + BIRD_SIZE_Y;

      const obsLeft = obs.x;
      const obsRight = obs.x + OBSTACLE_WIDTH;

      if (birdRight > obsLeft + 2 && birdLeft < obsRight - 2) {
        if (birdTop + 2 < obs.gapTop || birdBottom - 2 > obs.gapTop + GAP_SIZE) {
          collision = true;
        }
      }

      // Score check
      if (!obs.passed && obs.x + OBSTACLE_WIDTH < BIRD_X) {
        obs.passed = true;
        scoreRef.current += 1;
      }

      return obs.x > -OBSTACLE_WIDTH;
    });

    if (collision) {
      stopGame();
      return;
    }

    setBirdY(birdYRef.current);
    setBirdRotation(Math.min(Math.max(birdVelocityRef.current * 5, -25), 90));
    setObstacles([...obstaclesRef.current]);
    setScore(scoreRef.current);

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Handle spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (showPrizePrompt || countdown !== null) return;
        if (isPlaying) {
          jump();
        } else if (gameOver || !isPlaying) {
          if (!hasPrompted || gameOver) {
            startGame();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, showPrizePrompt, hasPrompted, countdown]);

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-[#FF6B95] mb-2 mt-4 px-4" style={{ fontFamily: 'Georgia, serif' }}>
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-gray-500 mb-4 px-4 font-medium">
        {subtitle} (အတားအဆီး {targetScore} ခု ကျော်ဖြတ်ပါ)
      </p>

      <div 
        className="w-full max-w-sm h-[400px] mx-auto bg-white/30 backdrop-blur-sm rounded-2xl border border-white/60 relative overflow-hidden shadow-inner select-none cursor-pointer"
        onPointerDown={(e) => {
          e.preventDefault();
          if (showPrizePrompt || countdown !== null) return;
          if (isPlaying) {
            jump();
          } else if (gameOver || !isPlaying) {
            if (!hasPrompted || gameOver) {
              startGame();
            }
          }
        }}
      >
        {/* Score HUD */}
        <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-4 z-10 pointer-events-none">
          <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-pink-600 shadow-xs border border-pink-100">
            Goal: {targetScore}
          </span>
          <span className="text-3xl font-extrabold text-white drop-shadow-md" style={{ WebkitTextStroke: '1px #FF85A1' }}>
            {score}
          </span>
        </div>

        {/* Countdown */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <span className="text-8xl font-extrabold text-white drop-shadow-xl" style={{ WebkitTextStroke: '2px #FF85A1' }}>
                {countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bird */}
        <div 
          className="absolute flex items-center justify-center drop-shadow-md z-10"
          style={{
            left: `${BIRD_X}%`,
            top: `${birdY}%`,
            width: `${BIRD_SIZE_X}%`,
            height: `${BIRD_SIZE_Y}%`,
            transform: `rotate(${birdRotation}deg)`,
            transition: 'transform 0.1s linear'
          }}
        >
          <span className="text-4xl -translate-y-1 scale-x-[-1]">🕊️</span>
        </div>

        {/* Obstacles */}
        {obstacles.map(obs => (
          <div key={obs.id}>
            {/* Top Pipe */}
            <div 
              className="absolute bg-gradient-to-r from-pink-300 to-pink-400 border-2 border-white rounded-b-lg shadow-sm"
              style={{
                left: `${obs.x}%`,
                top: 0,
                width: `${OBSTACLE_WIDTH}%`,
                height: `${obs.gapTop}%`
              }}
            />
            {/* Bottom Pipe */}
            <div 
              className="absolute bg-gradient-to-r from-pink-300 to-pink-400 border-2 border-white rounded-t-lg shadow-sm"
              style={{
                left: `${obs.x}%`,
                bottom: 0,
                width: `${OBSTACLE_WIDTH}%`,
                height: `${100 - obs.gapTop - GAP_SIZE}%`
              }}
            />
          </div>
        ))}

        {/* Start Overlay */}
        <AnimatePresence>
          {!isPlaying && !gameOver && !showPrizePrompt && countdown === null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/40 backdrop-blur-sm flex flex-col items-center justify-center z-20"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="bg-[#FF85A1] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#FF6B95] transition-all shadow-lg flex items-center gap-3"
              >
                <Play size={22} fill="currentColor" />
                <span>Start Flying</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prize Prompt Overlay */}
        <AnimatePresence>
          {showPrizePrompt && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white/85 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6"
            >
              <div className="p-4 rounded-full mb-3 shadow-lg bg-yellow-100 text-yellow-500">
                <Trophy size={42} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                {winTitle}
              </h3>
              <p className="text-gray-600 font-medium mb-5 text-center text-xs sm:text-sm">
                {winSubtitle}
              </p>
              
              <div className="flex flex-col gap-2.5 w-full px-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClaimPrize();
                  }}
                  className="bg-gradient-to-r from-[#FF85A1] to-[#FF6B95] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Gift size={18} /> Final Prize ရယူမည် 🎁
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPrizePrompt(false);
                    setIsPlaying(true);
                    isPlayingRef.current = true;
                    requestRef.current = requestAnimationFrame(gameLoop);
                  }}
                  className="bg-white text-[#FF85A1] border-2 border-[#FF85A1] px-6 py-2.5 rounded-full font-bold text-xs hover:bg-pink-50 transition-all shadow-xs"
                >
                  ဆက်လက်ကစားမည်
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white/85 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6"
            >
              <div className="p-4 rounded-full mb-3 shadow-lg bg-red-50 text-[#FF85A1]">
                <Trophy size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Game Over! 💥
              </h3>
              <p className="text-gray-600 font-medium mb-5 text-xs sm:text-sm">
                ရမှတ် {score} မှတ် ရရှိခဲ့ပါသည် (ပစ်မှတ် {targetScore} ခု)
              </p>
              
              <div className="flex flex-col gap-2.5 w-full px-2">
                {score >= targetScore && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClaimPrize();
                    }}
                    className="bg-gradient-to-r from-[#FF85A1] to-[#FF6B95] text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Gift size={18} /> Final Prize ရယူမည် 🎁
                  </button>
                )}
                <div className="flex gap-2 w-full justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startGame();
                    }}
                    className="flex-1 bg-white text-[#FF85A1] border-2 border-[#FF85A1] px-4 py-2.5 rounded-full font-bold text-xs hover:bg-pink-50 transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <RefreshCcw size={16} /> ပြန်ကစားမည်
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
