import { useState, useCallback } from 'react';
import { useSiteData } from '../contexts/SiteContext';
import { motion, AnimatePresence } from 'motion/react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { ArrowLeft, Check, X, Trophy, RefreshCcw, ArrowRight, Heart, Sparkles } from 'lucide-react';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function QuizPage() {
  const navigate = useAppNavigate();
  const { siteData } = useSiteData();
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Play pleasant sound on answer
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

    const isCorrect = idx === siteData.quiz.questions[currentQ].answer;
    playSound(isCorrect);
    
    let newScore = score;
    if (isCorrect) {
      newScore += 1;
      setScore(newScore);
    }

    setTimeout(() => {
      if (currentQ < siteData.quiz.questions.length - 1) {
        setCurrentQ(c => c + 1);
        setSelectedOpt(null);
        setIsAnswered(false);
      } else {
        setShowResult(true);
        if (newScore === siteData.quiz.questions.length) {
          localStorage.setItem('game1_cleared', 'true');
        }
      }
    }, 1300);
  };

  const restartQuiz = () => {
    setCurrentQ(0);
    setScore(0);
    setShowResult(false);
    setSelectedOpt(null);
    setIsAnswered(false);
  };

  const totalQuestions = siteData.quiz.questions.length;
  const progressPercent = ((currentQ + 1) / totalQuestions) * 100;
  const isPerfectScore = score === totalQuestions;

  return (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.35 }}
        className="w-full max-w-2xl bg-white/70 backdrop-blur-2xl border-2 border-white/80 shadow-[0_16px_48px_rgba(255,105,180,0.3)] rounded-[2.5rem] p-6 sm:p-10 flex flex-col items-center text-center relative overflow-hidden"
      >
        <button 
          onClick={() => navigate('/surprise/games')}
          className="absolute top-6 left-6 text-pink-500 hover:text-pink-700 transition-colors bg-white/80 hover:bg-white p-2.5 rounded-full shadow-md z-20 border border-pink-100 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        
        {!showResult ? (
          <div className="w-full pt-10 sm:pt-2">
            {/* Cute Header with animated progress bar */}
            <div className="mb-4 flex justify-between items-center px-2 w-full">
              <div className="bg-pink-100 text-[#FF2E74] font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-full border border-pink-200 flex items-center gap-1.5">
                <span>💖</span>
                <span>Question {currentQ + 1} of {totalQuestions}</span>
              </div>
              <div className="bg-white/90 text-pink-600 font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-xs border border-pink-100 flex items-center gap-1">
                <Sparkles size={14} className="text-amber-400" />
                <span>Score: {score}</span>
              </div>
            </div>

            {/* Visual Progress Bar with sliding heart */}
            <div className="w-full h-2.5 bg-pink-100/80 rounded-full overflow-hidden mb-6 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="bg-gradient-to-tr from-pink-50/70 to-rose-50/70 p-5 sm:p-7 rounded-3xl border border-pink-100 mb-6 shadow-sm">
                  <h2
                    className="text-xl sm:text-2xl font-black text-gray-800 leading-relaxed drop-shadow-xs"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {siteData.quiz.questions[currentQ].question}
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 gap-3 w-full">
                  {siteData.quiz.questions[currentQ].options.map((opt, idx) => {
                    let btnClass = "bg-white/80 hover:bg-white border-2 border-pink-100 text-gray-800 shadow-sm hover:border-pink-300 hover:shadow-[0_4px_16px_rgba(255,105,180,0.18)]";
                    let letterClass = "bg-pink-100 text-pink-600 border border-pink-200";
                    let Icon = null;
                    
                    if (isAnswered) {
                      if (idx === siteData.quiz.questions[currentQ].answer) {
                        btnClass = "bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-md shadow-emerald-100";
                        letterClass = "bg-emerald-500 text-white border-emerald-500";
                        Icon = <Check className="text-emerald-600" size={20} />;
                      } else if (idx === selectedOpt) {
                        btnClass = "bg-rose-50 border-2 border-rose-400 text-rose-900 shadow-md shadow-rose-100";
                        letterClass = "bg-rose-500 text-white border-rose-500";
                        Icon = <X className="text-rose-600" size={20} />;
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileHover={!isAnswered ? { scale: 1.015, y: -1 } : {}}
                        whileTap={!isAnswered ? { scale: 0.985 } : {}}
                        onClick={() => handleOptionClick(idx)}
                        disabled={isAnswered}
                        className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${btnClass}`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-colors ${letterClass}`}>
                            {OPTION_LETTERS[idx] || (idx + 1)}
                          </span>
                          <span className="font-bold text-base sm:text-lg">{opt}</span>
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
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center pt-8 sm:pt-4"
          >
            <div className={`p-5 rounded-full mb-4 shadow-xl ${
              isPerfectScore 
                ? 'bg-gradient-to-tr from-emerald-400 to-teal-400 text-white shadow-emerald-200' 
                : 'bg-gradient-to-tr from-pink-400 to-rose-400 text-white shadow-pink-200'
            }`}>
              {isPerfectScore ? <Trophy size={48} /> : <Heart size={48} fill="currentColor" />}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              {isPerfectScore ? "Perfect Score! အမှတ်ပြည့်ပါ 💖" : "ကောင်းမွန်သော ကြိုးစားမှုပါ 😊"}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 font-medium mb-6">
              မေးခွန်း {totalQuestions} ခုတွင် {score} ခု မှန်ကန်စွာ ဖြေဆိုနိုင်ခဲ့ပါသည်
            </p>
            
            {isPerfectScore ? (
              <div className="flex flex-col gap-3.5 w-full max-w-sm">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-2xl font-bold text-sm">
                  ✨ Game 2 ကို ဖွင့်လှစ်ပေးလိုက်ပါပြီ!
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/surprise/games/2')}
                  className="w-full bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] text-white p-3.5 rounded-full font-black text-base hover:opacity-95 transition-all shadow-[0_8px_20px_rgba(255,42,109,0.4)] flex items-center justify-center gap-2 cursor-pointer border border-white/40"
                >
                  <span>Play Game 2</span>
                  <ArrowRight size={18} />
                </motion.button>
                <button
                  onClick={() => navigate('/surprise/games')}
                  className="w-full bg-white text-gray-700 border border-pink-200 p-3 rounded-full font-bold text-sm hover:bg-pink-50 transition-all shadow-xs cursor-pointer"
                >
                  ဂိမ်းမီနူးသို့ ပြန်သွားမည်
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 w-full max-w-sm">
                <div className="bg-pink-50 border border-pink-200 text-[#FF2E74] px-4 py-2 rounded-2xl font-bold text-xs">
                  💡 Game 2 ကို ဖွင့်ရန် မေးခွန်းအားလုံး မှန်အောင် ဖြေရပါမည်
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={restartQuiz}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white p-3.5 rounded-full font-black text-base hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCcw size={18} />
                  <span>ပြန်လည်ဖြေဆိုမည်</span>
                </motion.button>
                <button
                  onClick={() => navigate('/surprise/games')}
                  className="w-full bg-white text-gray-700 border border-pink-200 p-3 rounded-full font-bold text-sm hover:bg-pink-50 transition-all shadow-xs cursor-pointer"
                >
                  ဂိမ်းမီနူးသို့ ပြန်သွားမည်
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
