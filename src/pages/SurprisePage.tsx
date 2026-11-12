import { motion } from 'motion/react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { Gamepad2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { FloatingElements } from '../components/FloatingElements';
import { useState, useEffect } from 'react';
import { useSiteData } from '../contexts/SiteContext';

export function SurprisePage() {
  const navigate = useAppNavigate();
  const { siteData } = useSiteData();
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    const handleMusicState = (e: any) => setIsMusicPlaying(e.detail.isPlaying);
    window.addEventListener('music-state-change', handleMusicState);
    return () => window.removeEventListener('music-state-change', handleMusicState);
  }, []);

  return (
    <>
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-md md:max-w-xl bg-white/65 backdrop-blur-2xl border-2 border-white/80 shadow-[0_16px_48px_rgba(255,105,180,0.3)] rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-pink-300/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-fuchsia-300/40 rounded-full blur-2xl" />

          <button 
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 text-pink-500 hover:text-pink-700 transition-colors bg-white/80 hover:bg-white p-2.5 rounded-full shadow-md border border-pink-100"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative z-10 mt-14 sm:mt-6 mb-6 flex flex-col items-center">
            <p className="text-[#FF2E74] font-black mb-3 text-lg animate-pulse drop-shadow-sm" style={{ fontFamily: 'Georgia, serif' }}>
              {siteData.surprise.musicHint}
            </p>
            <button
              onClick={() => window.dispatchEvent(new Event('toggle-music'))}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-7 py-2 rounded-full font-bold text-sm transition-all shadow-[0_4px_16px_rgba(244,63,94,0.35)] flex items-center gap-2 border border-white/40"
            >
              {isMusicPlaying ? '🎵 သီချင်းပိတ်မယ်' : '🎶 သီချင်းဖွင့်မယ်'}
            </button>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2 relative z-10" style={{ fontFamily: 'Georgia, serif' }}>
            {siteData.surprise.title}
          </h2>
          <p className="text-gray-600 font-medium mb-10 leading-relaxed relative z-10">
            {siteData.surprise.subtitle}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full relative z-10">
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/surprise/games')}
              className="group flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-white/90 to-pink-50/70 backdrop-blur-xl p-8 rounded-3xl border-2 border-pink-200/80 shadow-[0_8px_24px_rgba(255,105,180,0.25)] hover:shadow-[0_16px_32px_rgba(255,42,109,0.35)] transition-all"
            >
              <div className="bg-gradient-to-tr from-[#FF2E74] to-[#FF6584] text-white p-4 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-pink-300/60">
                <Gamepad2 size={34} />
              </div>
              <span className="font-black text-xl text-[#FF2E74] tracking-wide">Games 🎮</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/surprise/memories')}
              className="group flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-white/90 to-purple-50/70 backdrop-blur-xl p-8 rounded-3xl border-2 border-purple-200/80 shadow-[0_8px_24px_rgba(192,132,252,0.25)] hover:shadow-[0_16px_32px_rgba(168,85,247,0.35)] transition-all"
            >
              <div className="bg-gradient-to-tr from-[#9333EA] to-[#C084FC] text-white p-4 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-purple-300/60">
                <ImageIcon size={34} />
              </div>
              <span className="font-black text-xl text-[#9333EA] tracking-wide">Memories 📸</span>
            </motion.button>
          </div>
        </motion.div>
      </main>
    </>
  );
}
