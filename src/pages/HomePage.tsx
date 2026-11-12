import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import { FloatingElements } from '../components/FloatingElements';
import { TimerCard } from '../components/TimerCard';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useSiteData } from '../contexts/SiteContext';
import { MediaAvatar } from '../components/MediaAvatar';

export function HomePage() {
  const navigate = useAppNavigate();
  const { siteData } = useSiteData();
  const isIncludeTime = siteData.includeTime !== false;
  const time = useTimer(siteData.anniversaryDate, isIncludeTime);

  return (
    <>
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key="main-card"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } }
            }}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
            className="w-full max-w-4xl flex flex-col items-center"
          >
            <motion.header 
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
              }}
              className='text-center z-10 mb-8 sm:mb-12 mt-4'
            >
              <p className='text-[#FF2E74] uppercase tracking-[0.4em] text-[11px] sm:text-xs font-black mb-2 drop-shadow-sm'>
                {siteData.home.subtitle}
              </p>
              <h1 className='text-4xl sm:text-6xl text-[#2D2D2D] font-serif italic drop-shadow-sm' style={{ fontFamily: 'Georgia, serif' }}>
                {siteData.home.title}
              </h1>
            </motion.header>

            {/* Photos Section */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } }
              }}
              className='relative flex items-center justify-center gap-6 sm:gap-12 mb-12 sm:mb-16 z-10'
            >
              {/* Boy's Photo & Pronoun */}
              <div className='relative'>
                <motion.div
                  whileHover={{ scale: 1.06, rotate: -8 }}
                  className="w-36 h-48 sm:w-56 sm:h-72 bg-gradient-to-br from-[#FFD1DC] to-[#FF9BB2] rounded-[60px] sm:rounded-[100px] border-[6px] sm:border-8 border-white shadow-[0_12px_36px_rgba(255,105,180,0.35)] overflow-hidden transform -rotate-6"
                >
                  <MediaAvatar
                    src={siteData.home.boyPhotoUrl}
                    fallbackSrc="/kko.jpg"
                    alt={siteData.home.boyName || 'Boy'}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 bg-gradient-to-r from-[#FF5C8A] to-[#FF3366] p-2 sm:p-3 rounded-full text-white shadow-lg flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 border-2 border-white">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{siteData.home.boyName}</span>
                </div>
              </div>

              {/* Beating Heart Icon */}
              <motion.div
                animate={{ scale: [1, 1.28, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="absolute z-20 bg-gradient-to-tr from-[#FF1493] via-[#FF4081] to-[#FF6B95] rounded-full p-3 sm:p-4 text-white shadow-[0_8px_25px_rgba(255,20,147,0.55)] border-2 border-white"
              >
                <Heart className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" />
              </motion.div>

              {/* Girl's Photo & Pronoun */}
              <div className='relative'>
                <motion.div
                  whileHover={{ scale: 1.06, rotate: 8 }}
                  className="w-36 h-48 sm:w-56 sm:h-72 bg-gradient-to-br from-[#FFC2D1] to-[#FF85A1] rounded-[60px] sm:rounded-[100px] border-[6px] sm:border-8 border-white shadow-[0_12px_36px_rgba(255,105,180,0.35)] overflow-hidden transform rotate-6"
                >
                  <MediaAvatar
                    src={siteData.home.girlPhotoUrl}
                    fallbackSrc="/bby.jpg"
                    alt={siteData.home.girlName || 'Girl'}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 bg-gradient-to-r from-[#FF3366] to-[#E91E63] p-2 sm:p-3 rounded-full text-white shadow-lg flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 border-2 border-white">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{siteData.home.girlName}</span>
                </div>
              </div>
            </motion.div>

            {/* Timer Container */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
              }}
              className='w-full z-10 mb-10'
            >
              <div className='bg-white/60 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border-2 border-white/80 shadow-[0_12px_40px_rgba(255,105,180,0.25)]'>
                <p className='text-center text-[#FF4081] font-bold text-xs sm:text-sm mb-6 tracking-widest uppercase flex items-center justify-center gap-2'>
                  <span>💖</span> {siteData.home.timeSpentLabel} <span>💖</span>
                </p>
                {isIncludeTime ? (
                  <div className='grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4'>
                    <TimerCard value={time.years} label="Years" />
                    <TimerCard value={time.months} label="Months" />
                    <TimerCard value={time.days} label="Days" />
                    <TimerCard value={time.hours} label="Hours" />
                    <TimerCard value={time.minutes} label="Mins" />
                    <TimerCard value={time.seconds} label="Secs" />
                  </div>
                ) : (
                  <div className='grid grid-cols-3 gap-3 sm:gap-6 max-w-xl mx-auto'>
                    <TimerCard value={time.years} label="Years" />
                    <TimerCard value={time.months} label="Months" />
                    <TimerCard value={time.days} label="Days" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Open Button */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
              }}
            >
              <motion.button
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/surprise')}
                className='bg-gradient-to-r from-[#FF2A6D] via-[#FF5388] to-[#FF758C] text-white px-12 py-3.5 sm:px-16 sm:py-4 rounded-full font-black text-base sm:text-lg hover:from-[#FF155B] hover:to-[#FF5C7A] transition-all flex items-center justify-center gap-2.5 shadow-[0_12px_30px_rgba(255,42,109,0.5)] border-2 border-white/50'
              >
                <span>{siteData.home.surpriseButtonText}</span>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-200 animate-pulse" />
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
