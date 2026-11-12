import { motion } from 'motion/react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { ArrowLeft } from 'lucide-react';
import { useSiteData } from '../contexts/SiteContext';
import { CatchHeartsGame } from '../components/game2/CatchHeartsGame';
import { LoveMemoryGame } from '../components/game2/LoveMemoryGame';
import { PopHeartsGame } from '../components/game2/PopHeartsGame';
import { CandyCrushGame } from '../components/game2/CandyCrushGame';
import { WhackHeartGame } from '../components/game2/WhackHeartGame';
import { LoveQuizGame } from '../components/common/LoveQuizGame';

export function Game2Page() {
  const navigate = useAppNavigate();
  const { siteData } = useSiteData();

  // The active game is strictly determined by the CMS configuration
  const activeGame = siteData.game2?.gameType || 'catch_hearts';

  const handleGameClear = () => {
    localStorage.setItem('game2_cleared', 'true');
  };

  const handleNextGame = () => {
    navigate('/surprise/games/3');
  };

  return (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.35 }}
        className="w-full max-w-2xl bg-white/50 backdrop-blur-2xl border border-white/70 shadow-[0_8px_32px_0_rgba(255,182,193,0.4)] rounded-[2.5rem] p-5 sm:p-8 flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Top Navigation */}
        <div className="w-full flex items-center justify-start mb-2">
          <button 
            type="button"
            onClick={() => navigate('/surprise/games')}
            className="text-pink-500 hover:text-pink-700 transition-colors bg-white/70 hover:bg-white px-3.5 py-2 rounded-full shadow-xs z-20 flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft size={16} />
            <span>ဂိမ်းမီနူး</span>
          </button>
        </div>

        {/* Selected Mini Game Container based on CMS selection */}
        <div className="w-full">
          {activeGame === 'catch_hearts' && (
            <CatchHeartsGame
              title={siteData.game2?.title || "Let's collect our missing hearts! 💕"}
              subtitle={siteData.game2?.subtitle}
              winMessage={siteData.game2?.winMessage || "You collected all the love! 🎉"}
              targetScore={siteData.game2?.targetScore || 15}
              onGameClear={handleGameClear}
              onNextGame={handleNextGame}
            />
          )}

          {activeGame === 'memory_match' && (
            <LoveMemoryGame
              title={siteData.game2?.title || "Love Memory Cards Match 💕"}
              subtitle={siteData.game2?.subtitle || "အတွဲတူ အချစ်ကတ်ပြား ၆ စုံကို ရှာဖွေလှန်ပေးပါ"}
              winMessage={siteData.game2?.winMessage || "အချစ်ကတ်ပြား အားလုံးကို အောင်မြင်စွာ တွဲစပ်နိုင်ခဲ့ပါပြီ! 🎉"}
              onGameClear={handleGameClear}
              onNextGame={handleNextGame}
            />
          )}

          {activeGame === 'pop_hearts' && (
            <PopHeartsGame
              title={siteData.game2?.title || "Pop Love Balloons! 🎈"}
              subtitle={siteData.game2?.subtitle || "အသည်းပုံပူဖောင်းများကို နှိပ်၍ ဖောက်ပါ (၁၅ မှတ်ပြည့်အောင် စုဆောင်းပါ)"}
              winMessage={siteData.game2?.winMessage || "ပူဖောင်းအားလုံးကို ဖောက်ပြီး ချစ်ခြင်းမေတ္တာအမှတ်ပြည့် ရရှိသွားပါပြီ! 🎉"}
              targetScore={siteData.game2?.targetScore || 15}
              onGameClear={handleGameClear}
              onNextGame={handleNextGame}
            />
          )}

          {activeGame === 'candy_crush' && (
            <CandyCrushGame
              title={siteData.game2?.title || "Sweet Candy Match! 🍬"}
              subtitle={siteData.game2?.subtitle || "သကြားလုံး/အသည်းပုံ (၃) ခု တန်းစီအောင် တွဲစပ်ပြီး အမှတ်ပြည့်အောင် ယူပါ"}
              winMessage={siteData.game2?.winMessage || "ချိုမြိန်သောအချစ် သကြားလုံးဂိမ်းကို အောင်မြင်စွာ ကစားနိုင်ခဲ့ပါပြီ! 🎉"}
              targetScore={siteData.game2?.targetScore || 120}
              onGameClear={handleGameClear}
              onNextGame={handleNextGame}
            />
          )}

          {activeGame === 'whack_heart' && (
            <WhackHeartGame
              title={siteData.game2?.title || "Whack-a-Heart! ရင်ခုန်သံဖမ်းဂိမ်း 🔨"}
              subtitle={siteData.game2?.subtitle || "အပေါက်များမှ ပေါ်လာသော အသည်းပုံနှင့် အရုပ်များကို အချိန်မီ နှိပ်ဖမ်းပါ"}
              winMessage={siteData.game2?.winMessage || "ရင်ခုန်သံအသည်းပုံများကို အောင်မြင်စွာ ဖမ်းယူနိုင်ခဲ့ပါပြီ! 🎉"}
              targetScore={siteData.game2?.targetScore || 15}
              onGameClear={handleGameClear}
              onNextGame={handleNextGame}
            />
          )}

          {activeGame === 'love_quiz' && (
            <LoveQuizGame
              title={siteData.game2?.title || "Love Quiz! အချစ်ဉာဏ်စမ်းမေးခွန်းများ 💖"}
              subtitle={siteData.game2?.subtitle || "မေးခွန်းများကို မှန်အောင်ဖြေဆိုပြီး Game 3 ကို ဖွင့်လှစ်ပါ"}
              winMessage={siteData.game2?.winMessage || "မေးခွန်းအားလုံးကို အောင်မြင်စွာ ဖြေဆိုနိုင်ခဲ့ပါပြီ! Game 3 ကို ဖွင့်လှစ်ပေးလိုက်ပါပြီ 🎉"}
              questions={siteData.game2?.questions || siteData.quiz?.questions}
              onGameClear={handleGameClear}
              onNext={handleNextGame}
              nextButtonText="Play Game 3"
              isFinalGame={false}
            />
          )}
        </div>
      </motion.div>
    </main>
  );
}
