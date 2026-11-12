import { motion, AnimatePresence } from 'motion/react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { ArrowLeft, Heart, Mail, Sparkles } from 'lucide-react';
import { FloatingElements } from '../components/FloatingElements';
import { useState } from 'react';
import { useSiteData } from '../contexts/SiteContext';
import { LoveLetterTypewriter } from '../components/LoveLetterTypewriter';

export function PrizePage() {
  const navigate = useAppNavigate();
  const { siteData } = useSiteData();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-2xl flex flex-col items-center text-center relative"
        >
          <button 
            onClick={() => navigate('/surprise')}
            className="absolute -top-12 sm:-top-6 left-0 sm:-left-6 text-pink-500 hover:text-pink-700 transition-colors bg-white/80 hover:bg-white p-2.5 rounded-full shadow-md z-20 border border-pink-100"
          >
            <ArrowLeft size={20} />
          </button>
          
          <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.div
                key="envelope"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="w-full max-w-md bg-white/75 backdrop-blur-2xl border-2 border-pink-200 shadow-[0_16px_48px_rgba(255,105,180,0.3)] rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/90 transition-all group"
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="bg-gradient-to-tr from-[#FF2E74] to-[#FF6584] p-6 rounded-full mb-6 shadow-lg shadow-pink-300/50 text-white group-hover:scale-110 transition-transform">
                  <Mail size={50} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-2 group-hover:text-[#FF2E74] transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                  {siteData.prize.envelopeTitle || 'A Secret Letter For You'}
                </h2>
                <p className="text-[#FF2E74] font-black uppercase tracking-widest text-sm flex items-center gap-2">
                  <Sparkles size={16} className="animate-spin text-amber-400" /> {siteData.prize.envelopeSubtitle || 'Tap to open'} <Sparkles size={16} className="animate-spin text-amber-400" />
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="letter"
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                className="w-full bg-white/80 backdrop-blur-2xl border-2 border-pink-200 shadow-[0_16px_48px_rgba(255,105,180,0.3)] rounded-[2.5rem] p-6 sm:p-12 text-left relative overflow-hidden"
              >
                <div className="absolute top-8 right-8 text-pink-400/30 pointer-events-none">
                  <Heart size={80} fill="currentColor" />
                </div>

                <LoveLetterTypewriter
                  greeting={siteData.prize.letterGreeting || `My Dearest ${siteData.home.girlName || 'Bby'},`}
                  paragraph1={siteData.prize.letterParagraph1}
                  paragraph2={siteData.prize.letterParagraph2}
                  paragraph3={siteData.prize.letterParagraph3}
                  message={siteData.prize.message}
                  signOff={siteData.prize.letterSignOff || 'Forever yours,'}
                  senderName={siteData.prize.senderName || siteData.home.boyName || 'Kko'}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </>
  );
}
