import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Trophy, RefreshCcw, ArrowRight, Heart, Sparkles, HelpCircle } from 'lucide-react';
import { QuizQuestion } from '../../contexts/SiteContext';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

interface LoveQuizGameProps {
  title?: string;
  subtitle?: string;
  winMessage?: string;
  questions?: QuizQuestion[];
  onGameClear?: () => void;
  onNext?: () => void;
  nextButtonText?: string;
  isFinalGame?: boolean;
}

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  { 
    question: 'ကိုကိုနဲ့ ဘေဘီ ပထမဆုံး စတင်တွေ့ဆုံခဲ့တဲ့ နေရာလေးက ဘယ်နေရာလဲ?', 
    options: ['ကော်ဖီဆိုင်လေး', 'ပန်းခြံထဲမှာ', 'ကျောင်း/တက္ကသိုလ်', 'Social Media / Online'], 
    answer: 3 
  },
  { 
    question: 'ဘေဘီ့ရဲ့ အကြိုက်ဆုံး အရောင်လေးက ဘာအရောင်လဲ?', 
    options: ['ပန်းရောင်နုနုလေး', 'အဖြူရောင်သန့်သန့်', 'အပြာရောင်အေးအေး', 'ခရမ်းရောင်လေး'], 
    answer: 0 
  },
  { 
    question: 'အတူတူသွားချင်တဲ့ အမှတ်တရ ခရီးစဉ်လေးက ဘယ်နေရာလဲ?', 
    options: ['ပင်လယ်ကမ်းခြေ', 'တောင်ပေါ်မြို့လေး', 'နိုင်ငံခြားခရီးစဉ်', 'ကိုကိုရှိတဲ့နေရာတိုင်း'], 
    answer: 3 
  }
];

export function LoveQuizGame({
  title = "Love Quiz! အချစ်ဉာဏ်စမ်း မေးခွန်းများ 💖",
  subtitle = "မေးခွန်းများကို မှန်အောင်ဖြေဆိုပြီး အဆင့်သစ်ကို ဖွင့်လှစ်ပါ",
  winMessage = "မေးခွန်းအားလုံးကို အောင်မြင်စွာ ဖြေဆိုနိုင်ခဲ့ပါပြီ! 🎉",
  questions = DEFAULT_QUESTIONS,
  onGameClear,
  onNext,
  nextButtonText = "Play Next",
  isFinalGame = false
}: LoveQuizGameProps) {
  const activeQuestions = (questions && questions.length > 0) ? questions : DEFAULT_QUESTIONS;
  
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Play pleasant sound effect
  const playSound = useCallback((correct: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (correct) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.21);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.19);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleOptionClick = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    const isCorrect = idx === activeQuestions[currentQ].answer;
    playSound(isCorrect);
    
    let newScore = score;
    if (isCorrect) {
      newScore += 1;
      setScore(newScore);
    }

    setTimeout(() => {
      if (currentQ < activeQuestions.length - 1) {
        setCurrentQ(c => c + 1);
        setSelectedOpt(null);
        setIsAnswered(false);
      } else {
        setShowResult(true);
        if (newScore === activeQuestions.length) {
          if (onGameClear) onGameClear();
        }
      }
    }, 1200);
  };

  const restartQuiz = () => {
    setCurrentQ(0);
    setScore(0);
    setShowResult(false);
    setSelectedOpt(null);
    setIsAnswered(false);
  };

  const totalQuestions = activeQuestions.length;
  const progressPercent = ((currentQ + 1) / totalQuestions) * 100;
  const isPerfectScore = score === totalQuestions;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Title & Subtitle */}
      <div className="mb-4 text-center">
        <h2 
          className="text-xl sm:text-2xl font-black text-gray-800 flex items-center justify-center gap-2 drop-shadow-xs"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <HelpCircle className="text-pink-500 w-5 h-5 sm:w-6 sm:h-6" />
          <span>{title}</span>
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium max-w-md mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {!showResult ? (
        <div className="w-full">
          {/* Header Stats & Progress */}
          <div className="mb-3 flex justify-between items-center px-1 w-full">
            <div className="bg-pink-100 text-[#FF2E74] font-bold text-xs px-3 py-1.5 rounded-full border border-pink-200 flex items-center gap-1.5">
              <span>💖</span>
              <span>Question {currentQ + 1} of {totalQuestions}</span>
            </div>
            <div className="bg-white/90 text-pink-600 font-bold text-xs px-3 py-1.5 rounded-full shadow-xs border border-pink-100 flex items-center gap-1">
              <Sparkles size={14} className="text-amber-400" />
              <span>Score: {score}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-pink-100/80 rounded-full overflow-hidden mb-5 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {/* Question Box */}
              <div className="bg-gradient-to-tr from-pink-50/80 to-rose-50/80 p-5 sm:p-6 rounded-3xl border border-pink-100 mb-5 shadow-xs text-center">
                <h3
                  className="text-lg sm:text-xl font-bold text-gray-800 leading-relaxed"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {activeQuestions[currentQ].question}
                </h3>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5 w-full">
                {activeQuestions[currentQ].options.map((opt, idx) => {
                  let btnClass = "bg-white/85 hover:bg-white border-2 border-pink-100/80 text-gray-800 shadow-xs hover:border-pink-300";
                  let letterClass = "bg-pink-100 text-pink-600 border border-pink-200";
                  let Icon = null;
                  
                  if (isAnswered) {
                    if (idx === activeQuestions[currentQ].answer) {
                      btnClass = "bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-md shadow-emerald-100";
                      letterClass = "bg-emerald-500 text-white border-emerald-500";
                      Icon = <Check className="text-emerald-600" size={18} />;
                    } else if (idx === selectedOpt) {
                      btnClass = "bg-rose-50 border-2 border-rose-400 text-rose-900 shadow-md shadow-rose-100";
                      letterClass = "bg-rose-500 text-white border-rose-500";
                      Icon = <X className="text-rose-600" size={18} />;
                    }
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileHover={!isAnswered ? { scale: 1.015, y: -1 } : {}}
                      whileTap={!isAnswered ? { scale: 0.985 } : {}}
                      onClick={() => handleOptionClick(idx)}
                      disabled={isAnswered}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${btnClass}`}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-colors ${letterClass}`}>
                          {OPTION_LETTERS[idx] || (idx + 1)}
                        </span>
                        <span className="font-bold text-sm sm:text-base">{opt}</span>
                      </div>
                      {Icon && <span className="mr-1">{Icon}</span>}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* Results View */
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full flex flex-col items-center pt-4"
        >
          <div className={`p-5 rounded-full mb-4 shadow-xl ${
            isPerfectScore 
              ? 'bg-gradient-to-tr from-emerald-400 to-teal-400 text-white shadow-emerald-200' 
              : 'bg-gradient-to-tr from-pink-400 to-rose-400 text-white shadow-pink-200'
          }`}>
            {isPerfectScore ? <Trophy size={44} /> : <Heart size={44} fill="currentColor" />}
          </div>

          <h3 className="text-2xl font-black text-gray-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            {isPerfectScore ? "Perfect Score! အမှတ်ပြည့်ပါ 💖" : "ကြိုးစားမှုကောင်းပါသည် 😊"}
          </h3>
          <p className="text-sm text-gray-600 font-medium mb-3">
            မေးခွန်း {totalQuestions} ခုတွင် {score} ခု မှန်ကန်စွာ ဖြေဆိုနိုင်ခဲ့ပါသည်
          </p>

          {isPerfectScore ? (
            <div className="flex flex-col gap-3.5 w-full max-w-sm mt-2">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-center">
                {winMessage}
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onNext}
                className="w-full bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] text-white p-3.5 rounded-full font-black text-base hover:opacity-95 transition-all shadow-[0_8px_20px_rgba(255,42,109,0.4)] flex items-center justify-center gap-2 cursor-pointer border border-white/40"
              >
                <span>{nextButtonText}</span>
                <ArrowRight size={18} />
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 w-full max-w-sm mt-2">
              <div className="bg-pink-50 border border-pink-200 text-[#FF2E74] px-4 py-2 rounded-2xl font-bold text-xs text-center">
                💡 အောင်မြင်ရန် မေးခွန်းအားလုံး မှန်အောင် ဖြေဆိုပေးပါ
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={restartQuiz}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white p-3.5 rounded-full font-black text-sm hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCcw size={16} />
                <span>ပြန်လည်ဖြေဆိုမည်</span>
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
