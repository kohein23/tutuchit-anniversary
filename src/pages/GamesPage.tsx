import { motion } from 'motion/react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { ArrowLeft, Gamepad2, Lock, Play } from 'lucide-react';
import { FloatingElements } from '../components/FloatingElements';
import { useState, useEffect } from 'react';
import { useSiteData } from '../contexts/SiteContext';

export function GamesPage() {
  const navigate = useAppNavigate();
  const { siteData } = useSiteData();
  const [game1Cleared, setGame1Cleared] = useState(false);
  const [game2Cleared, setGame2Cleared] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('game1_cleared') === 'true') {
      setGame1Cleared(true);
    }
    if (localStorage.getItem('game2_cleared') === 'true') {
      setGame2Cleared(true);
    }
  }, []);

  return (
    <>
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-2xl bg-white/70 backdrop-blur-2xl border-2 border-white/80 shadow-[0_16px_48px_rgba(255,105,180,0.3)] rounded-[2.5rem] p-8 md:p-10 flex flex-col items-center text-center relative overflow-hidden"
        >
          <button 
            onClick={() => navigate('/surprise')}
            className="absolute top-6 left-6 text-pink-500 hover:text-pink-700 transition-colors bg-white/80 hover:bg-white p-2.5 rounded-full shadow-md z-20 border border-pink-100"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="bg-gradient-to-tr from-[#FF2E74] to-[#FF6584] text-white p-4 rounded-full mb-5 shadow-lg shadow-pink-300/60 mt-12 sm:mt-4 relative z-10">
            <Gamepad2 size={40} />
          </div>

          <h2 className="text-3xl font-black text-gray-800 mb-3 relative z-10" style={{ fontFamily: 'Georgia, serif' }}>
            {siteData.games.title}
          </h2>
          <p className="text-gray-600 font-medium mb-10 leading-relaxed relative z-10">
            {siteData.games.subtitle}
          </p>
          
          <div className="w-full flex flex-col gap-4 relative z-10">
            {/* Game 1 */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/surprise/games/1')}
              className="w-full bg-white/80 hover:bg-white/95 backdrop-blur-md p-5 rounded-2xl border-2 border-pink-200 flex items-center justify-between cursor-pointer shadow-[0_8px_20px_rgba(255,80,130,0.2)] hover:shadow-[0_12px_28px_rgba(255,42,109,0.35)] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-tr from-[#FF2E74] to-[#FF5388] text-white p-3 rounded-full shadow-md group-hover:scale-110 transition-transform">
                  <Play size={24} fill="currentColor" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#FF2E74] transition-colors">Game 1: Couple Quiz</h3>
                  <p className="text-sm text-gray-500">Test how well you know us!</p>
                </div>
              </div>
              <div className="text-pink-500 font-bold text-sm bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                Play ▶
              </div>
            </motion.div>

            {/* Game 2 */}
            <motion.div 
              whileHover={game1Cleared ? { scale: 1.02, y: -2 } : {}}
              whileTap={game1Cleared ? { scale: 0.98 } : {}}
              onClick={() => game1Cleared && navigate('/surprise/games/2')}
              className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all backdrop-blur-md ${
                game1Cleared 
                  ? "bg-white/80 hover:bg-white/95 border-purple-200 cursor-pointer shadow-[0_8px_20px_rgba(168,85,247,0.2)] hover:shadow-[0_12px_28px_rgba(147,51,234,0.35)] group" 
                  : "bg-white/40 border-gray-200 opacity-70 cursor-not-allowed shadow-none"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`${game1Cleared ? 'bg-gradient-to-tr from-[#9333EA] to-[#C084FC] group-hover:scale-110' : 'bg-gray-300'} text-white p-3 rounded-full shadow-md transition-transform`}>
                  {game1Cleared ? <Play size={24} fill="currentColor" /> : <Lock size={24} />}
                </div>
                <div className="text-left">
                  <h3 className={`font-bold text-lg transition-colors ${game1Cleared ? 'text-gray-800 group-hover:text-[#9333EA]' : 'text-gray-500'}`}>
                    Game 2: {
                      siteData.game2?.gameType === 'love_quiz' ? 'Love Quiz မေးခွန်းဉာဏ်စမ်း 💖' :
                      siteData.game2?.gameType === 'memory_match' ? 'Love Memory Match 🎴' :
                      siteData.game2?.gameType === 'pop_hearts' ? 'Pop Love Balloons 🎈' :
                      siteData.game2?.gameType === 'whack_heart' ? 'Whack-a-Heart 🔨' :
                      siteData.game2?.gameType === 'candy_crush' ? 'Sweet Candy Match 🍬' :
                      'Catch Missing Hearts 🧺'
                    }
                  </h3>
                  <p className="text-sm text-gray-500">
                    {game1Cleared 
                      ? (siteData.game2?.subtitle || "Ready to play! 🎉") 
                      : "Clear Game 1 to unlock"}
                  </p>
                </div>
              </div>
              {game1Cleared && (
                <div className="text-purple-600 font-bold text-sm bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  Play ▶
                </div>
              )}
            </motion.div>

            {/* Game 3 */}
            <motion.div 
              whileHover={game2Cleared ? { scale: 1.02, y: -2 } : {}}
              whileTap={game2Cleared ? { scale: 0.98 } : {}}
              onClick={() => game2Cleared && navigate('/surprise/games/3')}
              className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all backdrop-blur-md ${
                game2Cleared 
                  ? "bg-white/80 hover:bg-white/95 border-indigo-200 cursor-pointer shadow-[0_8px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_12px_28px_rgba(79,70,229,0.35)] group" 
                  : "bg-white/40 border-gray-200 opacity-70 cursor-not-allowed shadow-none"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`${game2Cleared ? 'bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] group-hover:scale-110' : 'bg-gray-300'} text-white p-3 rounded-full shadow-md transition-transform`}>
                  {game2Cleared ? <Play size={24} fill="currentColor" /> : <Lock size={24} />}
                </div>
                <div className="text-left">
                  <h3 className={`font-bold text-lg transition-colors ${game2Cleared ? 'text-gray-800 group-hover:text-[#4F46E5]' : 'text-gray-500'}`}>
                    {siteData.game3?.title || "Game 3: Mystery"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {game2Cleared 
                      ? (siteData.game3?.subtitle || "Ready to play! 🎉") 
                      : "Clear Game 2 to unlock"}
                  </p>
                </div>
              </div>
              {game2Cleared && (
                <div className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  Play ▶
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </main>
    </>
  );
}
