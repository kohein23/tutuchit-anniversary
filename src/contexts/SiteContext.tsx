import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

export interface SiteData {
  id: string;
  clientName?: string;
  customerPhone?: string;
  paymentNote?: string;
  createdAt?: string;
  slug?: string;
  anniversaryDate: string; // ISO string
  includeTime?: boolean; // whether to include hours/mins/secs or date only (years/months/days)
  intro: {
    title: string;
    subtitle: string;
  };
  share?: {
    title: string;
    description: string;
  };
  home: {
    subtitle: string;
    title: string;
    boyName: string;
    boyPhotoUrl: string;
    girlName: string;
    girlPhotoUrl: string;
    timeSpentLabel: string;
    surpriseButtonText: string;
  };
  surprise: {
    musicHint: string;
    title: string;
    subtitle: string;
  };
  music: {
    type?: 'youtube' | 'mp3';
    youtubeVideoId: string; // e.g. "dQw4w9WgXcQ"
    audioUrl?: string; // MP3 URL or uploaded audio URL
    audioName?: string; // Audio track or file name
  };
  quiz: {
    questions: QuizQuestion[];
  };
  game2: {
    gameType?: 'catch_hearts' | 'memory_match' | 'pop_hearts' | 'whack_heart' | 'candy_crush' | 'love_quiz';
    title: string;
    subtitle?: string;
    winMessage: string;
    targetScore?: number;
    questions?: QuizQuestion[];
  };
  game3: {
    gameType?: 'flappy_bird' | 'cupid_shooter' | 'scratch_card' | 'photo_puzzle' | 'love_quiz';
    title: string;
    subtitle?: string;
    winTitle: string;
    winSubtitle: string;
    targetScore?: number;
    puzzleImageUrl?: string;
    questions?: QuizQuestion[];
  };
  prize: {
    envelopeTitle?: string;
    envelopeSubtitle?: string;
    letterGreeting?: string;
    letterParagraph1?: string;
    letterParagraph2?: string;
    letterParagraph3?: string;
    message: string;
    letterSignOff?: string;
    senderName?: string;
  };
  games: {
    title: string;
    subtitle: string;
  };
  memories?: {
    title: string;
    subtitle: string;
  };
  memoriesList: { id: number; title: string; text: string; image: string; }[];
}

export const defaultSiteData: SiteData = {
  id: 'default',
  clientName: 'မောင်မောင် & အေးအေး',
  customerPhone: '09123456789',
  paymentNote: '30,000 Ks (Paid)',
  createdAt: new Date().toISOString(),
  slug: 'demo',
  anniversaryDate: new Date(2023, 1, 14, 0, 0, 0).toISOString(),
  includeTime: true,
  intro: {
    title: 'ဘေဘီ့အတွက် Surprise လေး 🎁',
    subtitle: '(ဒီကိုနှိပ်ပါ)'
  },
  share: {
    title: 'Happy Anniversary! 💕',
    description: 'Our love story and special moments together.'
  },
  home: {
    subtitle: 'Together, creating endless memories since our special day.',
    title: 'Our Beautiful Memories',
    boyName: 'Kko',
    boyPhotoUrl: '/kko.jpg',
    girlName: 'Bby',
    girlPhotoUrl: '/bby.jpg',
    timeSpentLabel: 'Time spent together',
    surpriseButtonText: 'Surprise'
  },
  surprise: {
    musicHint: 'သီချင်းလေးအရင်ဖွင့်လိုက်နော် 🎶',
    title: 'Happy 3 နှစ်နဲ့ ၆ လပြည့်ပါနော်ကလေးလေး 💖',
    subtitle: 'ကိုကို့ကလေးလေးဘာလုပ်ချင်လဲအောက်မှာရွေးစေ'
  },
  music: {
    type: 'youtube',
    youtubeVideoId: 'U_2b0tVwXnQ', // Default lovely music
    audioUrl: '',
    audioName: ''
  },
  quiz: {
    questions: [
      { question: 'What is our Anniversary Date?', options: ['Jan 1', 'Feb 14', 'Oct 10', 'Dec 25'], answer: 1 }
    ]
  },
  game2: {
    gameType: 'catch_hearts',
    title: 'Let\'s collect our missing hearts! 💕',
    subtitle: 'Catch 15 hearts to unlock the next game!',
    winMessage: 'You collected all the love! 🎉',
    targetScore: 15,
    questions: [
      { question: 'ကိုကိုနဲ့ ဘေဘီ ပထမဆုံး စတင်တွေ့ဆုံခဲ့တဲ့ နေရာလေးက ဘယ်နေရာလဲ?', options: ['ကော်ဖီဆိုင်လေး', 'ပန်းခြံထဲမှာ', 'ကျောင်း/တက္ကသိုလ်', 'Social Media / Online'], answer: 3 },
      { question: 'ဘေဘီ့ရဲ့ အကြိုက်ဆုံး အရောင်လေးက ဘာအရောင်လဲ?', options: ['ပန်းရောင်နုနုလေး', 'အဖြူရောင်သန့်သန့်', 'အပြာရောင်အေးအေး', 'ခရမ်းရောင်လေး'], answer: 0 },
      { question: 'အတူတူသွားချင်တဲ့ အမှတ်တရ ခရီးစဉ်လေးက ဘယ်နေရာလဲ?', options: ['ပင်လယ်ကမ်းခြေ', 'တောင်ပေါ်မြို့လေး', 'နိုင်ငံခြားခရီးစဉ်', 'ကိုကိုရှိတဲ့နေရာတိုင်း'], answer: 3 }
    ]
  },
  game3: {
    gameType: 'flappy_bird',
    title: 'Let\'s overcome all obstacles together 💕',
    subtitle: 'အတားအဆီး ၅ ခုကို ကျော်ဖြတ်ပြီး Final Prize ကို ရယူပါ',
    winTitle: 'All games cleared! 🎉',
    winSubtitle: 'There is a special prize for my amazing baby 💕',
    targetScore: 5,
    puzzleImageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    questions: [
      { question: 'ကိုကို့ရဲ့ အချစ်ဆုံးကလေးလေးက ဘယ်သူလဲ?', options: ['ဘေဘီလေးတစ်ယောက်တည်း 💕', 'မသိဘူး', 'တခြားသူ', 'စဉ်းစားဦးမယ်'], answer: 0 },
      { question: 'နောင်နှစ်ပေါင်းများစွာအထိ ဘယ်သူနဲ့အတူ လက်တွဲသွားချင်လဲ?', options: ['ကိုကိုနဲ့အတူတူ အမြဲတမ်း 💕', 'တစ်ယောက်တည်း', 'သူငယ်ချင်းတွေနဲ့', 'အိမ်မှာပဲနေမယ်'], answer: 0 },
      { question: 'ဒီ Anniversary လက်ဆောင်လေးကို သဘောကျရဲ့လား?', options: ['အရမ်းသဘောကျတယ် အရမ်းချစ်တယ် 💖', 'နည်းနည်းလေးပဲ', 'မကြိုက်ပါဘူး', 'မဆိုးပါဘူး'], answer: 0 }
    ]
  },
  prize: {
    envelopeTitle: 'A Secret Letter For You',
    envelopeSubtitle: 'Tap to open',
    letterGreeting: 'My Dearest Bby,',
    letterParagraph1: 'I wanted to create something special just for you. This little game, this whole website, is just a small token of my love and appreciation for everything you are to me.',
    letterParagraph2: 'Every moment since our special day has been a beautiful journey. You bring so much joy, laughter, and warmth into my life. Your smile is my favorite thing in the world, and your happiness means everything to me.',
    letterParagraph3: 'Thank you for playing along, for being my partner, and for simply being you. I promise to keep surprising you, loving you, and cherishing every memory we make together.',
    message: 'Love you so much baby ... 😘',
    letterSignOff: 'Forever yours,',
    senderName: 'Kko'
  },
  games: {
    title: 'Let\'s play love games 💕',
    subtitle: 'Clear all games for a surprise'
  },
  memories: {
    title: 'Our Memories💕',
    subtitle: 'A gallery of all the perfect moments we\'ve spent together.'
  },
  memoriesList: [
    { id: 1, title: 'First Date', text: 'It was a magical day...', image: '/photo 1.jpg' },
    { id: 2, title: 'Our First Trip', text: 'We went to the beach...', image: '/photo 2.jpg' },
    { id: 3, title: 'Happy Times', text: 'Laughing together...', image: '/Photo 3.jpg' }
  ]
};

// Deep merge helper to ensure all nested properties exist safely
function mergeWithDefaults(loaded: any): SiteData {
  return {
    ...defaultSiteData,
    ...loaded,
    includeTime: loaded.includeTime !== undefined ? Boolean(loaded.includeTime) : true,
    intro: { ...defaultSiteData.intro, ...(loaded.intro || {}) },
    share: { ...defaultSiteData.share, ...(loaded.share || {}) },
    home: { ...defaultSiteData.home, ...(loaded.home || {}) },
    surprise: { ...defaultSiteData.surprise, ...(loaded.surprise || {}) },
    music: {
      ...defaultSiteData.music,
      ...(loaded.music || {}),
      type: loaded.music?.type || (loaded.music?.audioUrl ? 'mp3' : 'youtube'),
      youtubeVideoId: loaded.music?.youtubeVideoId || defaultSiteData.music.youtubeVideoId,
      audioUrl: loaded.music?.audioUrl || '',
      audioName: loaded.music?.audioName || ''
    },
    quiz: { 
      questions: loaded.quiz?.questions?.length ? loaded.quiz.questions : defaultSiteData.quiz.questions 
    },
    game2: { 
      ...defaultSiteData.game2, 
      ...(loaded.game2 || {}),
      gameType: loaded.game2?.gameType || 'catch_hearts',
      questions: loaded.game2?.questions?.length ? loaded.game2.questions : defaultSiteData.game2.questions
    },
    game3: { 
      ...defaultSiteData.game3, 
      ...(loaded.game3 || {}),
      gameType: loaded.game3?.gameType || 'flappy_bird',
      questions: loaded.game3?.questions?.length ? loaded.game3.questions : defaultSiteData.game3.questions
    },
    prize: { ...defaultSiteData.prize, ...(loaded.prize || {}) },
    games: { ...defaultSiteData.games, ...(loaded.games || {}) },
    memories: { ...defaultSiteData.memories, ...(loaded.memories || {}) },
    memoriesList: loaded.memoriesList?.length ? loaded.memoriesList : defaultSiteData.memoriesList
  };
}

interface SiteContextType {
  siteData: SiteData;
  loading: boolean;
  error: string | null;
}

const SiteContext = createContext<SiteContextType>({
  siteData: defaultSiteData,
  loading: true,
  error: null
});

export const useSiteData = () => useContext(SiteContext);

export function SiteProvider({ children, siteId }: { children: ReactNode, siteId?: string }) {
  const [siteData, setSiteData] = useState<SiteData>(defaultSiteData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!siteId) {
        setSiteData(defaultSiteData);
        setLoading(false);
        return;
      }
      try {
        const rawId = siteId.trim();
        let decodedId = rawId;
        try {
          decodedId = decodeURIComponent(rawId);
        } catch {
          // ignore
        }

        // 1. Try direct doc ID
        let docSnap = await getDoc(doc(db, 'sites', rawId));
        if (!docSnap.exists() && decodedId !== rawId) {
          docSnap = await getDoc(doc(db, 'sites', decodedId));
        }
        if (!docSnap.exists()) {
          docSnap = await getDoc(doc(db, 'sites', rawId.toLowerCase()));
        }

        if (docSnap.exists()) {
          const merged = mergeWithDefaults({ id: docSnap.id, ...docSnap.data() });
          setSiteData(merged);
          try {
            localStorage.setItem('cached_site_' + docSnap.id, JSON.stringify(merged));
            if (merged.slug) localStorage.setItem('cached_site_' + merged.slug, JSON.stringify(merged));
          } catch {}
          setLoading(false);
          return;
        }

        // 2. Try querying by slug
        const searchTerms = Array.from(new Set([rawId, decodedId, rawId.toLowerCase(), decodedId.toLowerCase()].filter(Boolean)));
        try {
          const slugQuery = query(
            collection(db, 'sites'),
            where('slug', 'in', searchTerms),
            limit(1)
          );
          const slugSnap = await getDocs(slugQuery);
          if (!slugSnap.empty) {
            const first = slugSnap.docs[0];
            const merged = mergeWithDefaults({ id: first.id, ...first.data() });
            setSiteData(merged);
            try {
              localStorage.setItem('cached_site_' + first.id, JSON.stringify(merged));
              if (merged.slug) localStorage.setItem('cached_site_' + merged.slug, JSON.stringify(merged));
            } catch {}
            setLoading(false);
            return;
          }
        } catch (slugErr) {
          console.warn('Slug query error:', slugErr);
        }

        // 3. Try querying by clientName
        try {
          const nameQuery = query(
            collection(db, 'sites'),
            where('clientName', '==', decodedId),
            limit(1)
          );
          const nameSnap = await getDocs(nameQuery);
          if (!nameSnap.empty) {
            const first = nameSnap.docs[0];
            const merged = mergeWithDefaults({ id: first.id, ...first.data() });
            setSiteData(merged);
            setLoading(false);
            return;
          }
        } catch (nameErr) {
          console.warn('Name query error:', nameErr);
        }

        // 4. Fallback: Scan all sites collection for fuzzy match
        try {
          const allSnap = await getDocs(collection(db, 'sites'));
          const cleanSearch = rawId.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matchedDoc = allSnap.docs.find(d => {
            const data = d.data();
            const dId = d.id.toLowerCase().replace(/[^a-z0-9]/g, '');
            const dSlug = (data.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const dClient = (data.clientName || '').toLowerCase().trim();
            return dId === cleanSearch || dSlug === cleanSearch || dClient === decodedId.toLowerCase().trim() ||
                   dId.includes(cleanSearch) || cleanSearch.includes(dId) ||
                   (dSlug && (dSlug.includes(cleanSearch) || cleanSearch.includes(dSlug)));
          });

          if (matchedDoc) {
            const merged = mergeWithDefaults({ id: matchedDoc.id, ...matchedDoc.data() });
            setSiteData(merged);
            try {
              localStorage.setItem('cached_site_' + matchedDoc.id, JSON.stringify(merged));
              if (merged.slug) localStorage.setItem('cached_site_' + merged.slug, JSON.stringify(merged));
            } catch {}
            setLoading(false);
            return;
          }
        } catch (scanErr) {
          console.warn('Collection scan fallback error:', scanErr);
        }

        // 5. Try local cache
        try {
          const cached = localStorage.getItem('cached_site_' + rawId) || 
                         localStorage.getItem('cached_site_' + decodedId);
          if (cached) {
            const parsed = JSON.parse(cached);
            setSiteData(mergeWithDefaults(parsed));
            setLoading(false);
            return;
          }
        } catch {}

        if (rawId === 'demo' || rawId === 'default') {
          setSiteData(defaultSiteData);
        } else {
          setError('Site not found');
        }
      } catch (err: any) {
        console.error('Error fetching site data:', err);
        // Try local cache on error
        try {
          const cached = localStorage.getItem('cached_site_' + siteId);
          if (cached) {
            const parsed = JSON.parse(cached);
            setSiteData(mergeWithDefaults(parsed));
            setLoading(false);
            return;
          }
        } catch {}

        if (siteId === 'demo' || siteId === 'default') {
          setSiteData(defaultSiteData);
        } else {
          setError(err.message || 'Error fetching site data');
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [siteId]);

  return (
    <SiteContext.Provider value={{ siteData, loading, error }}>
      {children}
    </SiteContext.Provider>
  );
}
