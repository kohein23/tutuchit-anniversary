import { motion } from 'motion/react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { ArrowLeft } from 'lucide-react';
import { useSiteData } from '../contexts/SiteContext';
import { FlappyBirdGame } from '../components/game3/FlappyBirdGame';
import { CupidShooterGame } from '../components/game3/CupidShooterGame';
import { LoveScratchCardGame } from '../components/game3/LoveScratchCardGame';
import { LovePhotoPuzzleGame } from '../components/game3/LovePhotoPuzzleGame';
import { LoveQuizGame } from '../components/common/LoveQuizGame';

export function Game3Page() {
  const navigate = useAppNavigate();
  const { siteData } = useSiteData();

  // The active game is strictly determined by the CMS configuration
  const activeGame = siteData.game3?.gameType || 'flappy_bird';

  const handleClaimPrize = () => {
    localStorage.setItem('game3_cleared', 'true');
    navigate('/surprise/prize');
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
          {activeGame === 'flappy_bird' && (
            <FlappyBirdGame
              title={siteData.game3?.title || "Let's overcome all obstacles together 💕"}
              subtitle={siteData.game3?.subtitle || "နှိပ်၍ ပျံသန်းပြီး အတားအဆီးများကို ကျော်ဖြတ်ပါ"}
              winTitle={siteData.game3?.winTitle || "All obstacles cleared! 🎉"}
              winSubtitle={siteData.game3?.winSubtitle || "There is a special prize for my amazing baby 💕"}
              targetScore={siteData.game3?.targetScore || 5}
              onClaimPrize={handleClaimPrize}
            />
          )}

          {activeGame === 'cupid_shooter' && (
            <CupidShooterGame
              title={siteData.game3?.title || "Cupid's Love Arrow! ကျူးပစ်မြှားပစ်ဂိမ်း 🏹"}
              subtitle={siteData.game3?.subtitle || "ကျူးပစ်လေးရဲ့ အချစ်မြှားဖြင့် လွင့်မျောနေသော အသည်းပစ်မှတ်များကို ပစ်ခတ်ပါ"}
              winTitle={siteData.game3?.winTitle || "ကျူးပစ်မြှား အားလုံး ထိမှန်သွားပါပြီ! 🎉"}
              winSubtitle={siteData.game3?.winSubtitle || "There is a special final prize for you 💕"}
              targetScore={siteData.game3?.targetScore || 12}
              onClaimPrize={handleClaimPrize}
            />
          )}

          {activeGame === 'scratch_card' && (
            <LoveScratchCardGame
              title={siteData.game3?.title || "Love Scratch Card! ကံစမ်းခြစ်ကတ်ဆုမဲ 🥠"}
              subtitle={siteData.game3?.subtitle || "ရွှေရောင်ကတ်ပြားများကို လက်ဖြင့် ခြစ်၍ အချစ်ဆုမဲများကို ရှာဖွေပါ"}
              winTitle={siteData.game3?.winTitle || "ကံစမ်းကတ်အားလုံး ခြစ်ပြီး အချစ်ဆု ရရှိပါပြီ! 🎉"}
              winSubtitle={siteData.game3?.winSubtitle || "There is a special final prize for you 💕"}
              targetScore={siteData.game3?.targetScore || 3}
              onClaimPrize={handleClaimPrize}
            />
          )}

          {activeGame === 'photo_puzzle' && (
            <LovePhotoPuzzleGame
              title={siteData.game3?.title || "Love Photo Puzzle! အချစ်ပဟေဠိဆက်ဂိမ်း 🧩"}
              subtitle={siteData.game3?.subtitle || "ကွက်လပ်သို့ ရွှေ့ကာ ချစ်သူနှစ်ဦးရဲ့ အမှတ်တရပုံရိပ်လေးကို ပြီးပြည့်စုံအောင် ဆက်ပေးပါ"}
              winTitle={siteData.game3?.winTitle || "အချစ်ပဟေဠိပုံကို အောင်မြင်စွာ ဆက်နိုင်ခဲ့ပါပြီ! 🎉"}
              winSubtitle={siteData.game3?.winSubtitle || "There is a special final prize for you 💕"}
              targetScore={siteData.game3?.targetScore || 1}
              puzzleImageUrl={siteData.game3?.puzzleImageUrl}
              onClaimPrize={handleClaimPrize}
            />
          )}

          {activeGame === 'love_quiz' && (
            <LoveQuizGame
              title={siteData.game3?.title || "Final Love Quiz! အချစ်ဆုံး ဉာဏ်စမ်းမေးခွန်းများ 💖"}
              subtitle={siteData.game3?.subtitle || "မေးခွန်းများကို မှန်အောင်ဖြေဆိုပြီး Final Surprise ဆုလက်ဆောင်ကို ရယူပါ"}
              winMessage={siteData.game3?.winSubtitle || "မေးခွန်းအားလုံး မှန်ကန်စွာ ဖြေဆိုပြီးပါပြီ! Final Prize ကို ဖွင့်လှစ်ပေးလိုက်ပါပြီ 🎉"}
              questions={siteData.game3?.questions || siteData.quiz?.questions}
              onGameClear={handleClaimPrize}
              onNext={handleClaimPrize}
              nextButtonText="ဆုလက်ဆောင် ဖွင့်ဖတ်မည် 🎁"
              isFinalGame={true}
            />
          )}
        </div>
      </motion.div>
    </main>
  );
}
