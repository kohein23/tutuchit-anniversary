import { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Gift } from 'lucide-react';

import { SiteProvider, useSiteData } from './contexts/SiteContext';

import { HomePage } from './pages/HomePage';
import { SurprisePage } from './pages/SurprisePage';
import { GamesPage } from './pages/GamesPage';
import { QuizPage } from './pages/QuizPage';
import { Game2Page } from './pages/Game2Page';
import { Game3Page } from './pages/Game3Page';
import { PrizePage } from './pages/PrizePage';
import { MemoriesPage } from './pages/MemoriesPage';
import { LiquidBackground } from './components/LiquidBackground';
import { MusicPlayer } from './components/MusicPlayer';

import CmsLogin from './pages/CmsLogin';
import CmsDashboard from './pages/CmsDashboard';

function PublicApp() {
  const { siteId } = useParams();
  
  return (
    <SiteProvider siteId={siteId}>
      <PublicAppInner />
    </SiteProvider>
  );
}

function PublicAppInner() {
  const [started, setStarted] = useState(false);
  const { siteData, loading, error } = useSiteData();

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#FFE4E1] text-pink-500 font-bold gap-3">
        <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
        <p className="animate-pulse text-sm">ဝက်ဘ်ဆိုက်အား ဖွင့်နေပါသည်...</p>
      </div>
    );
  }
  
  if (error || !siteData) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#FFE4E1] text-pink-600 font-bold p-6 text-center">
        <div className="bg-white/90 p-6 sm:p-8 rounded-3xl shadow-xl border border-pink-200 max-w-sm w-full flex flex-col items-center">
          <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center text-pink-500 mb-4">
            <Gift size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">ဝက်ဘ်ဆိုက် ရှာမတွေ့ပါ</h2>
          <p className="text-xs text-gray-500 font-normal mb-5 leading-relaxed">
            လိပ်စာ မှားယွင်းနေခြင်း သို့မဟုတ် ဒေတာများ ဆာဗာမှ ရယူ၍ မရသေးပါ။
          </p>
          <div className="flex flex-col w-full gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-xs font-semibold hover:opacity-95 transition-opacity"
            >
              ပြန်လည် စမ်းသပ်မည်
            </button>
            <a
              href="/cms"
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
            >
              CMS စီမံခန့်ခွဲမှုသို့ ပြန်သွားမည်
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LiquidBackground>
      <MusicPlayer showUI={started} music={siteData.music} videoId={siteData.music.youtubeVideoId} />
      <AnimatePresence>
        {!started && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FFE4E1] cursor-pointer"
            onClick={() => {
              setStarted(true);
              window.dispatchEvent(new Event('play-music'));
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="bg-white p-6 rounded-full shadow-xl mb-6 text-pink-500"
            >
              <Gift size={48} />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-pink-600 text-center px-4" style={{ fontFamily: 'Georgia, serif' }}>
              {siteData.intro.title}
            </h1>
            <p className="mt-4 text-pink-500 font-medium animate-pulse">
              {siteData.intro.subtitle}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {started && (
        <Routes>
          <Route path="" element={<HomePage />} />
          <Route path="surprise" element={<SurprisePage />} />
          <Route path="surprise/games" element={<GamesPage />} />
          <Route path="surprise/games/1" element={<QuizPage />} />
          <Route path="surprise/games/2" element={<Game2Page />} />
          <Route path="surprise/games/3" element={<Game3Page />} />
          <Route path="surprise/prize" element={<PrizePage />} />
          <Route path="surprise/memories" element={<MemoriesPage />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      )}
    </LiquidBackground>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root URL -> defaults to /cmslogin for admin preview */}
        <Route path="/" element={<Navigate to="/cmslogin" replace />} />
        
        {/* Dedicated CMS admin routes */}
        <Route path="/cmslogin" element={<CmsLogin />} />
        <Route path="/cms/*" element={<CmsDashboard />} />
        
        {/* Legacy /v/:siteId/* route support */}
        <Route path="/v/:siteId/*" element={<PublicApp />} />
        
        {/* Direct couple share link: https://tutuchit-anniversary.web.app/:siteId */}
        <Route path="/:siteId/*" element={<PublicApp />} />
      </Routes>
    </BrowserRouter>
  );
}
