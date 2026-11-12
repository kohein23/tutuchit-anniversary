import React, { useState, useRef } from 'react';
import { SiteData, defaultSiteData } from '../contexts/SiteContext';
import { 
  X, ChevronLeft, ChevronRight, Upload, Plus, Trash2, 
  RotateCcw, Check, Sparkles, Music, Play, Pause, Copy, ExternalLink, Image as ImageIcon,
  Volume2, Loader2, FileAudio, Gamepad2, Heart
} from 'lucide-react';
import { extractYouTubeVideoId, compressAndReadFileAsDataUrl, compressDataUrl } from '../utils/cmsHelpers';
import { uploadAudioFile, resolveAudioUrl, deleteAudioFromFirestore } from '../utils/audioUpload';
import { MediaAvatar } from './MediaAvatar';
import { QuizQuestionListEditor } from './cms/QuizQuestionListEditor';

interface CmsSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SiteData) => Promise<void>;
  initialData?: Partial<SiteData> | null;
  isNew?: boolean;
}

export function CmsSiteModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isNew = false
}: CmsSiteModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [previewAudioSrc, setPreviewAudioSrc] = useState<string>('');
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [formData, setFormData] = useState<SiteData>(() => {
    return {
      ...defaultSiteData,
      ...(initialData || {}),
      intro: { ...defaultSiteData.intro, ...(initialData?.intro || {}) },
      share: { ...defaultSiteData.share, ...(initialData?.share || {}) },
      home: { ...defaultSiteData.home, ...(initialData?.home || {}) },
      surprise: { ...defaultSiteData.surprise, ...(initialData?.surprise || {}) },
      music: { ...defaultSiteData.music, ...(initialData?.music || {}) },
      quiz: { 
        questions: initialData?.quiz?.questions?.length 
          ? JSON.parse(JSON.stringify(initialData.quiz.questions)) 
          : JSON.parse(JSON.stringify(defaultSiteData.quiz.questions)) 
      },
      game2: { 
        ...defaultSiteData.game2, 
        ...(initialData?.game2 || {}),
        gameType: initialData?.game2?.gameType || defaultSiteData.game2.gameType || 'catch_hearts'
      },
      game3: { 
        ...defaultSiteData.game3, 
        ...(initialData?.game3 || {}),
        gameType: initialData?.game3?.gameType || defaultSiteData.game3.gameType || 'flappy_bird'
      },
      prize: { ...defaultSiteData.prize, ...(initialData?.prize || {}) },
      games: { ...defaultSiteData.games, ...(initialData?.games || {}) },
      memories: { ...defaultSiteData.memories, ...(initialData?.memories || {}) },
      memoriesList: initialData?.memoriesList?.length 
        ? JSON.parse(JSON.stringify(initialData.memoriesList)) 
        : JSON.parse(JSON.stringify(defaultSiteData.memoriesList))
    };
  });

  const tabContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const tabs = [
    'အခြေခံ အချက်အလက်',
    '🔗 Link Share စာသား',
    '၁။ အဖွင့် (Home)',
    '၂။ Surprise',
    '၃။ Quiz',
    '၄။ Game 2',
    '၅။ Game 3',
    '၆။ Prize',
    '၇။ Memories'
  ];

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabContainerRef.current) {
      const amount = direction === 'left' ? -200 : 200;
      tabContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Auto slug generation on couple name change if creating new
  const handleCoupleNameChange = (name: string) => {
    setFormData(prev => {
      const updated = { ...prev, clientName: name };
      if (isNew && (!prev.slug || prev.slug === 'demo' || prev.slug.includes('-couple'))) {
        const cleanSlug = name
          .trim()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s_-]/gu, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        updated.slug = cleanSlug ? `${cleanSlug}-couple` : '';
        updated.id = updated.slug || prev.id;
      }
      return updated;
    });
  };

  const handleSlugChange = (slugVal: string) => {
    const clean = slugVal.toLowerCase().replace(/[^\p{L}\p{N}_-]/gu, '-');
    setFormData(prev => ({
      ...prev,
      slug: clean,
      id: clean || prev.id
    }));
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string) => void,
    fieldKey?: string,
    maxWidth = 450,
    maxHeight = 450,
    quality = 0.75
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (fieldKey) setUploadingField(fieldKey);
      const dataUrl = await compressAndReadFileAsDataUrl(file, maxWidth, maxHeight, quality);
      callback(dataUrl);
    } catch (err) {
      console.error('File reading failed', err);
      alert('ဓာတ်ပုံဖတ်ရှု၍ မရနိုင်ပါ: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      if (fieldKey) setUploadingField(null);
      e.target.value = '';
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|ogg|opus)$/i)) {
      alert('ကျေးဇူးပြု၍ MP3 သို့မဟုတ် Audio ဖိုင်သာ ရွေးချယ်ပေးပါ (.mp3, .wav, .m4a, .aac, .ogg)');
      return;
    }

    try {
      setAudioUploading(true);
      setAudioProgress(0);
      setAudioUploadError(null);

      const result = await uploadAudioFile(file, formData.slug || formData.id || 'couple', (progress) => {
        setAudioProgress(progress);
      });

      setFormData(prev => ({
        ...prev,
        music: {
          ...prev.music,
          type: 'mp3',
          audioUrl: result.url,
          audioName: result.name
        }
      }));
    } catch (err: any) {
      console.error('Upload audio failed:', err);
      setAudioUploadError(err.message || 'သီချင်းဖိုင် တင်ရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်');
    } finally {
      setAudioUploading(false);
      e.target.value = '';
    }
  };

  React.useEffect(() => {
    let active = true;
    if (!formData.music?.audioUrl) {
      setPreviewAudioSrc('');
      return;
    }
    resolveAudioUrl(formData.music.audioUrl).then(src => {
      if (active) setPreviewAudioSrc(src);
    }).catch(() => {
      if (active) setPreviewAudioSrc(formData.music.audioUrl || '');
    });
    return () => { active = false; };
  }, [formData.music?.audioUrl]);

  const togglePreviewAudio = () => {
    if (!previewAudioRef.current) return;
    if (audioPlaying) {
      previewAudioRef.current.pause();
      setAudioPlaying(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setAudioPlaying(true);
      }).catch((err) => {
        console.warn('Audio preview play failed:', err);
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const finalId = (formData.slug || formData.id || 'couple').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const dataToSave: SiteData = {
        ...formData,
        id: finalId,
        slug: finalId,
        music: {
          ...formData.music,
          type: formData.music.type || (formData.music.audioUrl ? 'mp3' : 'youtube'),
          youtubeVideoId: extractYouTubeVideoId(formData.music.youtubeVideoId),
          audioUrl: formData.music.audioUrl || '',
          audioName: formData.music.audioName || ''
        },
        game2: {
          ...formData.game2,
          gameType: formData.game2.gameType || 'catch_hearts',
          title: formData.game2.title || "Let's collect our missing hearts! 💕",
          subtitle: formData.game2.subtitle || '',
          winMessage: formData.game2.winMessage || 'You collected all the love! 🎉',
          targetScore: Number(formData.game2.targetScore) || 15,
          questions: formData.game2.questions || []
        },
        game3: {
          ...formData.game3,
          gameType: formData.game3.gameType || 'flappy_bird',
          title: formData.game3.title || "Let's overcome all obstacles together 💕",
          subtitle: formData.game3.subtitle || '',
          winTitle: formData.game3.winTitle || 'All obstacles cleared! 🎉',
          winSubtitle: formData.game3.winSubtitle || 'There is a special prize for my amazing baby 💕',
          targetScore: Number(formData.game3.targetScore) || 5,
          puzzleImageUrl: formData.game3.puzzleImageUrl || '',
          questions: formData.game3.questions || []
        }
      };

      // Ensure all images are compressed to keep Firestore doc well under 1MB limit
      const [boyPhoto, girlPhoto, puzzlePhoto] = await Promise.all([
        compressDataUrl(dataToSave.home?.boyPhotoUrl || '', 400, 0.75),
        compressDataUrl(dataToSave.home?.girlPhotoUrl || '', 400, 0.75),
        compressDataUrl(dataToSave.game3?.puzzleImageUrl || '', 500, 0.75)
      ]);

      let optimizedMemories = dataToSave.memoriesList;
      if (Array.isArray(dataToSave.memoriesList)) {
        optimizedMemories = await Promise.all(
          dataToSave.memoriesList.map(async (m) => ({
            ...m,
            image: await compressDataUrl(m.image || '', 600, 0.75)
          }))
        );
      }

      dataToSave.home.boyPhotoUrl = boyPhoto;
      dataToSave.home.girlPhotoUrl = girlPhoto;
      if (dataToSave.game3) dataToSave.game3.puzzleImageUrl = puzzlePhoto;
      dataToSave.memoriesList = optimizedMemories;

      await onSave(dataToSave);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Save failed:', err);
      const msg = err?.message || String(err);
      if (msg.includes('exceeds the maximum allowed size') || msg.includes('too large')) {
        alert('ဓာတ်ပုံဖိုင်များ အလွန်ကြီးမားနေသဖြင့် သိမ်းဆည်း၍ မရနိုင်ပါ။ ဓာတ်ပုံအရွယ်အစားကို အနည်းငယ် လျှော့ချပေးပါ။');
      } else {
        alert('သိမ်းဆည်းရာတွင် အမှားဖြစ်ပေါ်ပါသည်: ' + msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('မူလ Demo စာသားများကို ပြန်လည်ဖြည့်သွင်းလိုပါသလား?')) {
      setFormData(prev => ({
        ...defaultSiteData,
        id: prev.id,
        slug: prev.slug,
        clientName: prev.clientName,
        customerPhone: prev.customerPhone,
        paymentNote: prev.paymentNote
      }));
    }
  };

  // Format date for datetime-local & date inputs
  const formatToLocalDateTimeString = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatToLocalDateString = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${year}-${month}-${day}`;
  };

  const baseOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://tutuchit-anniversary.web.app';
  const baseHost = typeof window !== 'undefined' && window.location.host ? window.location.host : 'tutuchit-anniversary.web.app';

  const siteSlug = formData.slug || formData.id || 'couple';
  const publicLink = `${baseOrigin}/${siteSlug}`;
  const localPreviewLink = `${baseOrigin}/${siteSlug}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-pink-100 my-auto text-gray-800">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-pink-50/50 via-white to-rose-50/30">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-[#881337]">
                {isNew ? 'စုံတွဲအသစ် ဖန်တီးခြင်း' : 'စုံတွဲအချက်အလက် ပြင်ဆင်ခြင်း'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              ဖော်ပြပါ စာသားများနှင့် ဓာတ်ပုံများကို ပြောင်းလဲ၍ သိမ်းဆည်းနိုင်ပါသည်
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab Scroll Bar */}
        <div className="relative border-b border-gray-100 bg-gray-50/80 px-2 flex items-center">
          <button 
            onClick={() => scrollTabs('left')}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div 
            ref={tabContainerRef}
            className="flex items-center gap-2 overflow-x-auto py-2.5 px-1 scrollbar-none no-scrollbar flex-1 whitespace-nowrap"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {tabs.map((tab, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive 
                      ? 'bg-[#881337] text-white shadow-md shadow-rose-900/20 font-semibold' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => scrollTabs('right')}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Form Body Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 0: အခြေခံ အချက်အလက် */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-800">
                      စုံတွဲအမည် (Client / Couple Name) <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-xs text-[#881337] font-medium">Link အလိုအလျောက် သတ်မှတ်မည်</span>
                  </div>
                  <input
                    type="text"
                    value={formData.clientName || ''}
                    onChange={(e) => handleCoupleNameChange(e.target.value)}
                    placeholder="ဥပမာ - အောင်အောင် (သို့) မောင်မောင် & အေးအေး"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none text-sm transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    စုံတွဲအမည် ရိုက်ထည့်လိုက်သည်နှင့် Public Link တွင် [စုံတွဲအမည်]-couple ဟု အလိုအလျောက် ပြောင်းလဲပေးပါမည်။
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-800 block mb-1.5">
                    Public Link အတွက် Slug (URL) <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-rose-400 focus-within:border-rose-400">
                    <span className="bg-gray-100 text-gray-500 text-xs sm:text-sm px-3 py-2.5 border-r border-gray-300 font-mono select-none">
                      {baseHost}/
                    </span>
                    <input
                      type="text"
                      value={formData.slug || ''}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="couple-slug"
                      className="flex-1 px-3 py-2.5 text-sm font-mono outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-rose-700 mt-1.5">
                    <span className="truncate">
                      ဖောက်သည် Link: {publicLink}
                    </span>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(publicLink);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
                      >
                        <Copy size={12} /> {copiedLink ? 'ကူးပြီး' : 'Copy'}
                      </button>
                      <a
                        href={localPreviewLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          const win = window.open(localPreviewLink, '_blank');
                          if (!win) {
                            window.location.href = localPreviewLink;
                          }
                          e.preventDefault();
                        }}
                        className="flex items-center gap-1 text-rose-700 hover:text-rose-900 font-medium"
                      >
                        <ExternalLink size={12} /> စမ်းကြည့်မည်
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="text-sm font-semibold text-gray-800 block mb-1.5">
                    ဝယ်ယူသူ ဖုန်းနံပါတ် (Customer Phone)
                  </label>
                  <input
                    type="text"
                    value={formData.customerPhone || ''}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="09..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-800 block mb-1.5">
                    ငွေပေးချေမှု မှတ်ချက် (Payment / Price Note)
                  </label>
                  <input
                    type="text"
                    value={formData.paymentNote || ''}
                    onChange={(e) => setFormData({ ...formData, paymentNote: e.target.value })}
                    placeholder="ဥပမာ - 30,000 Ks (Paid)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none text-sm transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Link Share စာသား */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100">
                <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-pink-500" />
                  ပထမဆုံး နှိပ်ရမည့် Gift Box စာမျက်နှာ (Gift Intro Screen)
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  ဝက်ဘ်ဆိုက် စစဖွင့်ချင်း ပေါ်လာမည့် ချစ်စဖွယ် Gift Box စာသားများ
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Gift Box ခေါင်းစဉ် (Title)
                    </label>
                    <input
                      type="text"
                      value={formData.intro.title}
                      onChange={(e) => setFormData({
                        ...formData,
                        intro: { ...formData.intro, title: e.target.value }
                      })}
                      placeholder="ဘေဘီ့အတွက် Surprise လေး 🎁"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      နှိပ်ရန် စာတန်းငယ် (Subtitle)
                    </label>
                    <input
                      type="text"
                      value={formData.intro.subtitle}
                      onChange={(e) => setFormData({
                        ...formData,
                        intro: { ...formData.intro, subtitle: e.target.value }
                      })}
                      placeholder="(ဒီကိုနှိပ်ပါ)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100">
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Social Media / Messenger Share Preview
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Link ကို Facebook သို့မဟုတ် Messenger တွင် ပို့သည့်အခါ ပြသမည့် စာသားများ
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Share ခေါင်းစဉ် (Social Title)
                    </label>
                    <input
                      type="text"
                      value={formData.share?.title || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        share: { ...formData.share, title: e.target.value, description: formData.share?.description || '' }
                      })}
                      placeholder="Happy Anniversary! 💕"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Share ဖော်ပြချက် (Social Description)
                    </label>
                    <input
                      type="text"
                      value={formData.share?.description || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        share: { ...formData.share, description: e.target.value, title: formData.share?.title || '' }
                      })}
                      placeholder="Our love story and special moments together."
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ၁။ အဖွင့် (Home) */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    ပင်မ စာမျက်နှာ အပေါ်စာတန်း (Home Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.home.subtitle}
                    onChange={(e) => setFormData({
                      ...formData,
                      home: { ...formData.home, subtitle: e.target.value }
                    })}
                    placeholder="Together, creating endless memories since our special day."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    ပင်မ ခေါင်းစဉ်ကြီး (Home Main Title)
                  </label>
                  <input
                    type="text"
                    value={formData.home.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      home: { ...formData.home, title: e.target.value }
                    })}
                    placeholder="Our Beautiful Memories"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Couple Photos & Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50/70 rounded-2xl border border-gray-200">
                {/* Boy Box */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    👦 ကောင်လေး အချက်အလက် (Boy's Info)
                  </h4>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">ကောင်လေး အမည် (Boy's Name)</label>
                    <input
                      type="text"
                      value={formData.home.boyName}
                      onChange={(e) => setFormData({
                        ...formData,
                        home: { ...formData.home, boyName: e.target.value }
                      })}
                      placeholder="Kko"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-gray-700 font-semibold">ကောင်လေး ဓာတ်ပုံ / GIF / Sticker / WebM</label>
                        <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-md font-medium">GIF / Sticker / WebM ရပါသည်</span>
                      </div>
                      {formData.home.boyPhotoUrl && formData.home.boyPhotoUrl !== '/kko.jpg' && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            home: { ...prev.home, boyPhotoUrl: '/kko.jpg' }
                          }))}
                          className="text-[11px] text-rose-600 hover:underline"
                        >
                          မူလပုံ (/kko.jpg) ပြန်ထားမည်
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-pink-300 bg-pink-50/50 flex-shrink-0 shadow-sm relative">
                        <MediaAvatar 
                          key={formData.home.boyPhotoUrl}
                          src={formData.home.boyPhotoUrl || '/kko.jpg'} 
                          fallbackSrc="/kko.jpg"
                          alt="Boy" 
                          className="w-full h-full object-cover"
                        />
                        {uploadingField === 'boyPhoto' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                            <Loader2 size={16} className="animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={formData.home.boyPhotoUrl}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            home: { ...prev.home, boyPhotoUrl: e.target.value }
                          }))}
                          placeholder="Image, GIF, Sticker သို့မဟုတ် WebM URL (/kko.jpg, .gif, .webm, data:...)"
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none font-mono focus:ring-1 focus:ring-pink-300"
                        />
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs">
                            {uploadingField === 'boyPhoto' ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Upload size={13} />
                            )}
                            <span>ဖိုင်တင်မည် (Photo / GIF / WebM)</span>
                            <input
                              type="file"
                              accept="image/*,video/webm,.webm,.gif,.png,.webp,.svg"
                              className="hidden"
                              disabled={uploadingField === 'boyPhoto'}
                              onChange={(e) => handleFileUpload(e, (url) => {
                                setFormData(prev => ({
                                  ...prev,
                                  home: { ...prev.home, boyPhotoUrl: url }
                                }));
                              }, 'boyPhoto', 450, 450, 0.8)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Girl Box */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    👧 ကောင်မလေး အချက်အလက် (Girl's Info)
                  </h4>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">ကောင်မလေး အမည် (Girl's Name)</label>
                    <input
                      type="text"
                      value={formData.home.girlName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        home: { ...prev.home, girlName: e.target.value }
                      }))}
                      placeholder="Bby"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-gray-700 font-semibold">ကောင်မလေး ဓာတ်ပုံ / GIF / Sticker / WebM</label>
                        <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-md font-medium">GIF / Sticker / WebM ရပါသည်</span>
                      </div>
                      {formData.home.girlPhotoUrl && formData.home.girlPhotoUrl !== '/bby.jpg' && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            home: { ...prev.home, girlPhotoUrl: '/bby.jpg' }
                          }))}
                          className="text-[11px] text-rose-600 hover:underline"
                        >
                          မူလပုံ (/bby.jpg) ပြန်ထားမည်
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-pink-300 bg-pink-50/50 flex-shrink-0 shadow-sm relative">
                        <MediaAvatar 
                          key={formData.home.girlPhotoUrl}
                          src={formData.home.girlPhotoUrl || '/bby.jpg'} 
                          fallbackSrc="/bby.jpg"
                          alt="Girl" 
                          className="w-full h-full object-cover"
                        />
                        {uploadingField === 'girlPhoto' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                            <Loader2 size={16} className="animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={formData.home.girlPhotoUrl}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            home: { ...prev.home, girlPhotoUrl: e.target.value }
                          }))}
                          placeholder="Image, GIF, Sticker သို့မဟုတ် WebM URL (/bby.jpg, .gif, .webm, data:...)"
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none font-mono focus:ring-1 focus:ring-pink-300"
                        />
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs">
                            {uploadingField === 'girlPhoto' ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Upload size={13} />
                            )}
                            <span>ဖိုင်တင်မည် (Photo / GIF / WebM)</span>
                            <input
                              type="file"
                              accept="image/*,video/webm,.webm,.gif,.png,.webp,.svg"
                              className="hidden"
                              disabled={uploadingField === 'girlPhoto'}
                              onChange={(e) => handleFileUpload(e, (url) => {
                                setFormData(prev => ({
                                  ...prev,
                                  home: { ...prev.home, girlPhotoUrl: url }
                                }));
                              }, 'girlPhoto', 450, 450, 0.8)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anniversary Date & Live Timer Config */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-50/60 to-pink-50/30 rounded-2xl border border-rose-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-3 border-b border-rose-200/60">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <span>⏰</span> ချစ်သူစတင်ဖြစ်ခဲ့သည့် နေ့စွဲ (Anniversary Date)
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      အချိန် (နာရီ/မိနစ်) ပါ ထည့်သွင်းမည်လား သို့မဟုတ် နေ့စွဲသက်သက်သာ ထည့်မည်လား ရွေးချယ်နိုင်ပါသည်
                    </p>
                  </div>

                  {/* Mode Switch: Date Only vs Date & Time */}
                  <div className="inline-flex items-center bg-white p-1 rounded-xl border border-rose-200 shadow-xs self-start sm:self-auto flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, includeTime: false })}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        formData.includeTime === false
                          ? 'bg-[#881337] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>📅</span> နေ့စွဲသာ (Date only)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, includeTime: true })}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        formData.includeTime !== false
                          ? 'bg-[#881337] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>⏰</span> အချိန်ပါထည့်မည် (Date & Time)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      {formData.includeTime !== false ? 'နေ့စွဲနှင့် အချိန် ရွေးပါ (Date & Time)' : 'ချစ်သူဖြစ်ခဲ့သည့် နေ့စွဲ ရွေးပါ (Date only)'}
                    </label>
                    {formData.includeTime !== false ? (
                      <input
                        type="datetime-local"
                        value={formatToLocalDateTimeString(formData.anniversaryDate)}
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData({
                              ...formData,
                              anniversaryDate: new Date(e.target.value).toISOString()
                            });
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#881337]/30 focus:border-[#881337] outline-none text-sm font-medium transition-all"
                      />
                    ) : (
                      <input
                        type="date"
                        value={formatToLocalDateString(formData.anniversaryDate)}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [y, m, d] = e.target.value.split('-').map(Number);
                            const dt = new Date(y, m - 1, d, 0, 0, 0);
                            setFormData({
                              ...formData,
                              anniversaryDate: dt.toISOString()
                            });
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#881337]/30 focus:border-[#881337] outline-none text-sm font-medium transition-all"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1.5">
                      {formData.includeTime !== false ? (
                        <span className="text-rose-700 font-medium">
                          ✓ နှစ်၊ လ၊ ရက်၊ နာရီ၊ မိနစ်၊ စက္ကန့် ၆ ခုစလုံးကို တိုက်ရိုက် ရေတွက်ပြသပါမည်။
                        </span>
                      ) : (
                        <span className="text-rose-700 font-medium">
                          ✓ နာရီ/မိနစ်/စက္ကန့် မပါဘဲ နှစ်၊ လ၊ ရက် (၃ ကွက်) တည်းသာ သန့်သန့်လေး ရေတွက်ပြသပါမည်။
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      အချိန်ရေတွက်မှု ခေါင်းစဉ် (Time Spent Label)
                    </label>
                    <input
                      type="text"
                      value={formData.home.timeSpentLabel}
                      onChange={(e) => setFormData({
                        ...formData,
                        home: { ...formData.home, timeSpentLabel: e.target.value }
                      })}
                      placeholder="Time spent together"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#881337]/30 focus:border-[#881337] outline-none text-sm transition-all"
                    />

                    <div className="mt-2.5 p-2.5 bg-white/80 rounded-xl border border-rose-100 text-xs text-gray-600 flex flex-col gap-1">
                      <span className="font-semibold text-gray-700">ဝက်ဘ်ဆိုက်တွင် ပြသမည့်ပုံစံ:</span>
                      {formData.includeTime !== false ? (
                        <div className="flex flex-wrap gap-1">
                          {['Years', 'Months', 'Days', 'Hours', 'Mins', 'Secs'].map((unit) => (
                            <span key={unit} className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {unit}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1 items-center">
                          {['Years', 'Months', 'Days'].map((unit) => (
                            <span key={unit} className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              {unit}
                            </span>
                          ))}
                          <span className="text-[11px] text-gray-400 italic ml-1">(အချိန် ဖျောက်ထားသည်)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Surprise ခလုတ် စာသား (Surprise Button Text)
                </label>
                <input
                  type="text"
                  value={formData.home.surpriseButtonText}
                  onChange={(e) => setFormData({
                    ...formData,
                    home: { ...formData.home, surpriseButtonText: e.target.value }
                  })}
                  placeholder="Surprise"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm max-w-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 3: ၂။ အမှားဝန်ခံချက် (Surprise & Music) */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    သီချင်းဖွင့်ရန် သတိပေးစာ (Music Prompt / Hint)
                  </label>
                  <input
                    type="text"
                    value={formData.surprise.musicHint}
                    onChange={(e) => setFormData({
                      ...formData,
                      surprise: { ...formData.surprise, musicHint: e.target.value }
                    })}
                    placeholder="သီချင်းလေးအရင်ဖွင့်လိုက်နော် 🎶"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Surprise စာမျက်နှာ ခေါင်းစဉ်ကြီး (Main Title)
                  </label>
                  <input
                    type="text"
                    value={formData.surprise.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      surprise: { ...formData.surprise, title: e.target.value }
                    })}
                    placeholder="Happy 3 နှစ်နဲ့ ၆ လပြည့်ပါနော်ကလေးလေး 💖"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    စာမျက်နှာ စာတန်းငယ် (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.surprise.subtitle}
                    onChange={(e) => setFormData({
                      ...formData,
                      surprise: { ...formData.surprise, subtitle: e.target.value }
                    })}
                    placeholder="ကိုကို့ကလေးလေးဘာလုပ်ချင်လဲအောက်မှာရွေးစေ"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Background Music Configuration (Dual MP3 File Upload + YouTube Link) */}
              <div className="p-5 bg-gradient-to-br from-purple-50/70 via-pink-50/40 to-rose-50/30 rounded-2xl border border-purple-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-purple-200/70">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Music size={18} className="text-[#881337]" />
                      <span>နောက်ခံသီချင်း ရွေးချယ်မှု (Background Music)</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      MP3 သီချင်းဖိုင် တိုက်ရိုက်တင်မည်လား သို့မဟုတ် YouTube Link အသုံးပြုမည်လား ရွေးချယ်နိုင်ပါသည်
                    </p>
                  </div>

                  {/* Mode Selector: MP3 File vs YouTube Link */}
                  <div className="inline-flex items-center bg-white p-1 rounded-xl border border-purple-200 shadow-xs self-start sm:self-auto flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        music: { ...formData.music, type: 'mp3' }
                      })}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        formData.music.type === 'mp3' || (!formData.music.type && Boolean(formData.music.audioUrl))
                          ? 'bg-[#881337] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FileAudio size={13} />
                      <span>MP3 ဖိုင် တင်မည်</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        music: { ...formData.music, type: 'youtube' }
                      })}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        formData.music.type === 'youtube' || (!formData.music.type && !formData.music.audioUrl)
                          ? 'bg-[#881337] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>▶️</span>
                      <span>YouTube Link</span>
                    </button>
                  </div>
                </div>

                {/* --- MP3 FILE UPLOAD & AUDIO URL MODE --- */}
                {(formData.music.type === 'mp3' || (!formData.music.type && Boolean(formData.music.audioUrl))) ? (
                  <div className="space-y-4">
                    {/* Audio Upload Box */}
                    <div className="p-4 bg-white rounded-xl border-2 border-dashed border-rose-300/80 hover:border-[#881337] transition-all">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-[#881337] flex-shrink-0 shadow-inner">
                            <Volume2 size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">
                              {formData.music.audioName ? formData.music.audioName : 'MP3 သီချင်းဖိုင် ရွေးချယ်တင်မည်'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formData.music.audioUrl 
                                ? '✓ သီချင်းဖိုင် တင်ပြီးပါပြီ။ နားဆင်စမ်းသပ်နိုင်ပါသည်' 
                                : 'MP3, M4A, WAV, AAC, OGG ဖိုင်များကို တိုက်ရိုက် ထည့်သွင်းနိုင်ပါသည်'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <label className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all w-full sm:w-auto ${
                            audioUploading 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-[#881337] hover:bg-[#9f1239] text-white'
                          }`}>
                            {audioUploading ? (
                              <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>တင်နေပါသည်... {audioProgress}%</span>
                              </>
                            ) : (
                              <>
                                <Upload size={14} />
                                <span>{formData.music.audioUrl ? 'ဖိုင် အသစ်လဲမည်' : 'MP3 ဖိုင် ရွေးမည်'}</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.opus"
                              disabled={audioUploading}
                              className="hidden"
                              onChange={handleAudioUpload}
                            />
                          </label>

                          {formData.music.audioUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                if (previewAudioRef.current) {
                                  previewAudioRef.current.pause();
                                }
                                setAudioPlaying(false);
                                setFormData(prev => ({
                                  ...prev,
                                  music: { ...prev.music, audioUrl: '', audioName: '' }
                                }));
                              }}
                              className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                              title="သီချင်းဖျက်မည်"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar when uploading */}
                      {audioUploading && (
                        <div className="mt-3">
                          <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-[#881337] h-2 transition-all duration-300 rounded-full"
                              style={{ width: `${audioProgress}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 text-right font-mono">
                            {audioProgress}% uploaded
                          </p>
                        </div>
                      )}

                      {/* Upload Error Banner */}
                      {audioUploadError && (
                        <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg mt-3 border border-red-200">
                          ⚠️ {audioUploadError}
                        </p>
                      )}
                    </div>

                    {/* Audio Player Preview (if audioUrl exists) */}
                    {formData.music.audioUrl && (
                      <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={togglePreviewAudio}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-transform active:scale-95 ${
                              audioPlaying
                                ? 'bg-[#881337] text-white'
                                : 'bg-white text-[#881337] border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {audioPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                          </button>
                          <div>
                            <span className="text-xs font-bold text-gray-800 block">
                              {audioPlaying ? '🎶 သီချင်း ဖွင့်ပြနေပါသည်...' : 'သီချင်း အစမ်းနားဆင်ကြည့်မည်'}
                            </span>
                            <span className="text-[11px] text-gray-500 truncate max-w-xs block font-mono">
                              {formData.music.audioName || 'audio-track.mp3'}
                            </span>
                          </div>
                        </div>

                        {/* Hidden preview audio element */}
                        <audio
                          ref={previewAudioRef}
                          src={previewAudioSrc || formData.music.audioUrl}
                          onPlay={() => setAudioPlaying(true)}
                          onPause={() => setAudioPlaying(false)}
                          onEnded={() => setAudioPlaying(false)}
                        />

                        <div className="text-xs text-rose-700 font-semibold bg-white/90 px-3 py-1.5 rounded-lg border border-rose-200 shadow-xs">
                          {audioPlaying ? '▶️ Playing Preview' : '⏸️ Preview Ready'}
                        </div>
                      </div>
                    )}

                    {/* Direct Audio URL Input (Optional) */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        သို့မဟုတ် တိုက်ရိုက် Audio URL ထည့်ရန် (Direct Audio Link - Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.music.audioUrl || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          music: {
                            ...formData.music,
                            type: 'mp3',
                            audioUrl: e.target.value,
                            audioName: e.target.value ? (formData.music.audioName || 'Custom Audio URL') : ''
                          }
                        })}
                        placeholder="https://.../song.mp3 သို့မဟုတ် Google Drive Direct Link"
                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#881337]/30 focus:border-[#881337] outline-none text-xs font-mono transition-all"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        အင်တာနက်ပေါ်ရှိ MP3/M4A တိုက်ရိုက်လင့်ခ်ကိုလည်း အသုံးပြုနိုင်ပါသည်။ ဖိုင်တင်ထားပါက အလိုအလျောက် ဖြည့်ပေးထားမည်ဖြစ်ပါသည်။
                      </p>
                    </div>
                  </div>
                ) : (
                  /* --- YOUTUBE LINK MODE --- */
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-700 block">
                      YouTube Video Link သို့မဟုတ် Video ID (Background Music)
                    </label>
                    <input
                      type="text"
                      value={formData.music.youtubeVideoId}
                      onChange={(e) => setFormData({
                        ...formData,
                        music: { ...formData.music, type: 'youtube', youtubeVideoId: e.target.value }
                      })}
                      placeholder="ဥပမာ - https://youtu.be/U_2b0tVwXnQ သို့မဟုတ် U_2b0tVwXnQ"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#881337]/30 focus:border-[#881337] outline-none text-sm font-mono transition-all"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
                      <p>
                        YouTube Link ထည့်ပါက Video ID ကို အလိုအလျောက် ခွဲထုတ်ယူပေးပါမည်။
                        {formData.music.youtubeVideoId && (
                          <span className="block text-purple-700 font-mono font-bold mt-1">
                            Detected ID: {extractYouTubeVideoId(formData.music.youtubeVideoId)}
                          </span>
                        )}
                      </p>
                      {formData.music.youtubeVideoId && (
                        <a
                          href={`https://www.youtube.com/watch?v=${extractYouTubeVideoId(formData.music.youtubeVideoId)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-semibold underline flex-shrink-0"
                        >
                          <ExternalLink size={12} />
                          <span>YouTube တွင် ဖွင့်ကြည့်မည်</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ၃။ ထိုးချက် (Quiz & Games Hub) */}
          {activeTab === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Games စာမျက်နှာ ခေါင်းစဉ် (Games Hub Title)
                  </label>
                  <input
                    type="text"
                    value={formData.games.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      games: { ...formData.games, title: e.target.value }
                    })}
                    placeholder="Let's play love games 💕"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Games စာမျက်နှာ စာတန်းငယ် (Games Hub Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.games.subtitle}
                    onChange={(e) => setFormData({
                      ...formData,
                      games: { ...formData.games, subtitle: e.target.value }
                    })}
                    placeholder="Clear all games for a surprise"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Quiz Questions List */}
              <QuizQuestionListEditor
                title="Game 1 Quiz မေးခွန်းများ စီမံခန့်ခွဲခြင်း"
                questions={formData.quiz.questions || []}
                onChange={(updated) => setFormData({
                  ...formData,
                  quiz: { questions: updated }
                })}
                accentColor="rose"
              />
            </div>
          )}

          {/* TAB 5: ၄။ လက်သန်းချိတ် (Game 2 Options & Settings) */}
          {activeTab === 5 && (
            <div className="space-y-6">
              {/* Game Mode Selector Cards */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-pink-50/70 via-rose-50/50 to-purple-50/50 rounded-2xl border border-pink-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Gamepad2 size={18} className="text-pink-600" />
                      Game 2 ဂိမ်းအမျိုးအစား ရွေးချယ်ရန် (Game 2 Options)
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      မိမိကြိုက်နှစ်သက်ရာ ဂိမ်းပုံစံကို ရွေးချယ်နိုင်ပါသည်။ ကစားသူသည်လည်း Game 2 တွင် လွတ်လပ်စွာ ပြောင်းလဲကစားနိုင်ပါသည်။
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    {
                      id: 'catch_hearts',
                      icon: '🧺',
                      title: 'အသည်းပုံဖမ်းဂိမ်း',
                      engTitle: 'Catch Missing Hearts',
                      tag: 'Arcade / Reflex',
                      desc: 'အပေါ်မှ ကျလာသောအသည်းပုံများကို ခြင်းတောင်းဖြင့် လိုက်ဖမ်းရသောဂိမ်း',
                      defaultTitle: "Let's collect our missing hearts! 💕",
                      defaultSubtitle: "ခြင်းတောင်းလေးကို ဘယ်/ညာ ရွှေ့ပြီး အသည်းပုံ ၁၅ ခု ပြည့်အောင် ဖမ်းပေးပါ",
                      defaultWinMessage: "You collected all the love! 🎉",
                      defaultTargetScore: 15
                    },
                    {
                      id: 'memory_match',
                      icon: '🎴',
                      title: 'အတွဲညီအသည်းကတ်လှန်ဂိမ်း',
                      engTitle: 'Love Memory Match',
                      tag: 'Puzzle / Memory',
                      desc: 'အချစ်သင်္ကေတအတွဲ (၆) တွဲကို ကတ်ပြားများလှန်၍ မှတ်သားတွဲစပ်ရသောဂိမ်း',
                      defaultTitle: "Love Memory Cards Match 💕",
                      defaultSubtitle: "အတွဲတူ အချစ်ကတ်ပြား ၆ စုံကို ရှာဖွေလှန်ပေးပါ",
                      defaultWinMessage: "အချစ်ကတ်ပြား အားလုံးကို အောင်မြင်စွာ တွဲစပ်နိုင်ခဲ့ပါပြီ! 🎉",
                      defaultTargetScore: 6
                    },
                    {
                      id: 'pop_hearts',
                      icon: '🎈',
                      title: 'အသည်းပုံပူဖောင်းဖောက်ဂိမ်း',
                      engTitle: 'Pop Love Balloons',
                      tag: 'Tapping / Pop',
                      desc: 'အောက်မှ လွင့်တက်လာသော အသည်းပုံပူဖောင်းများကို နှိပ်ဖောက်ရသောဂိမ်း',
                      defaultTitle: "Pop Love Balloons! 🎈",
                      defaultSubtitle: "အသည်းပုံပူဖောင်းများကို နှိပ်၍ ဖောက်ပါ (၁၅ မှတ်ပြည့်အောင် စုဆောင်းပါ)",
                      defaultWinMessage: "ပူဖောင်းအားလုံးကို ဖောက်ပြီး ချစ်ခြင်းမေတ္တာအမှတ်ပြည့် ရရှိသွားပါပြီ! 🎉",
                      defaultTargetScore: 15
                    },
                    {
                      id: 'whack_heart',
                      icon: '🔨',
                      title: 'Whack-a-Heart ရင်ခုန်သံဖမ်းဂိမ်း',
                      engTitle: 'Whack-a-Heart / Catch Love Mole',
                      tag: 'Reflex / Whack',
                      desc: 'အပေါက်များမှ ပေါ်လာသော အသည်းပုံနှင့် အရုပ်များကို အချိန်မီ နှိပ်ဖမ်းရသောဂိမ်း',
                      defaultTitle: "Whack-a-Heart! ရင်ခုန်သံဖမ်းဂိမ်း 🔨",
                      defaultSubtitle: "အပေါက်များမှ ပေါ်လာသော အသည်းပုံနှင့် အရုပ်များကို အချိန်မီ နှိပ်ဖမ်းပါ",
                      defaultWinMessage: "ရင်ခုန်သံအသည်းပုံများကို အောင်မြင်စွာ ဖမ်းယူနိုင်ခဲ့ပါပြီ! 🎉",
                      defaultTargetScore: 15
                    },
                    {
                      id: 'candy_crush',
                      icon: '🍬',
                      title: 'ချိုမြိန်အချစ် သကြားလုံးဂိမ်း',
                      engTitle: 'Sweet Candy Match',
                      tag: 'Match-3 / Puzzle',
                      desc: 'အသည်းပုံနှင့် သကြားလုံး (၃) ခု တန်းစီအောင် နေရာလဲလှယ်၍ အမှတ်ယူရသော Candy Crush စတိုင်ဂိမ်း',
                      defaultTitle: "Sweet Candy Match! 🍬",
                      defaultSubtitle: "သကြားလုံး/အသည်းပုံ (၃) ခု တန်းစီအောင် တွဲစပ်ပြီး အမှတ်ပြည့်အောင် ယူပါ",
                      defaultWinMessage: "ချိုမြိန်သောအချစ် သကြားလုံးဂိမ်းကို အောင်မြင်စွာ ကစားနိုင်ခဲ့ပါပြီ! 🎉",
                      defaultTargetScore: 120
                    },
                    {
                      id: 'love_quiz',
                      icon: '❓',
                      title: 'အချစ်ဉာဏ်စမ်း မေးခွန်းဂိမ်း',
                      engTitle: 'Love Quiz Questions',
                      tag: 'Quiz / Trivia',
                      desc: 'ချစ်သူနှစ်ဦးကြား အမှတ်တရမေးခွန်းများကို Game 1 ကဲ့သို့ ရွေးချယ်ဖြေဆိုရသော အချစ်ဉာဏ်စမ်းဂိမ်း',
                      defaultTitle: "Love Quiz! အချစ်ဉာဏ်စမ်းမေးခွန်းများ 💖",
                      defaultSubtitle: "မေးခွန်းများကို မှန်အောင်ဖြေဆိုပြီး Game 3 ကို ဖွင့်လှစ်ပါ",
                      defaultWinMessage: "မေးခွန်းအားလုံးကို အောင်မြင်စွာ ဖြေဆိုနိုင်ခဲ့ပါပြီ! Game 3 ကို ဖွင့်လှစ်ပေးလိုက်ပါပြီ 🎉",
                      defaultTargetScore: 3
                    }
                  ].map(gameOption => {
                    const isSelected = (formData.game2.gameType || 'catch_hearts') === gameOption.id;

                    return (
                      <div
                        key={gameOption.id}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            game2: {
                              ...formData.game2,
                              gameType: gameOption.id as any,
                              // If current title is empty or generic, auto-fill suggested title
                              title: formData.game2.title || gameOption.defaultTitle,
                              subtitle: formData.game2.subtitle || gameOption.defaultSubtitle,
                              winMessage: formData.game2.winMessage || gameOption.defaultWinMessage,
                              targetScore: formData.game2.targetScore || gameOption.defaultTargetScore
                            }
                          });
                        }}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white border-pink-500 shadow-md ring-2 ring-pink-300/50'
                            : 'bg-white/70 border-pink-100 hover:border-pink-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-1 bg-pink-50 rounded-lg border border-pink-100">
                              {gameOption.icon}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-gray-900">{gameOption.title}</div>
                              <div className="text-[11px] font-medium text-pink-600">{gameOption.engTitle}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {gameOption.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                          {gameOption.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Auto-Fill Preset Button */}
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const currentType = formData.game2.gameType || 'catch_hearts';
                      const presets: Record<string, any> = {
                        catch_hearts: {
                          title: "Let's collect our missing hearts! 💕",
                          subtitle: "ခြင်းတောင်းလေးကို ဘယ်/ညာ ရွှေ့ပြီး အသည်းပုံ ၁၅ ခု ပြည့်အောင် ဖမ်းပေးပါ",
                          winMessage: "You collected all the love! 🎉",
                          targetScore: 15
                        },
                        memory_match: {
                          title: "Love Memory Cards Match 💕",
                          subtitle: "အတွဲတူ အချစ်ကတ်ပြား ၆ စုံကို ရှာဖွေလှန်ပေးပါ",
                          winMessage: "အချစ်ကတ်ပြား အားလုံးကို အောင်မြင်စွာ တွဲစပ်နိုင်ခဲ့ပါပြီ! 🎉",
                          targetScore: 6
                        },
                        pop_hearts: {
                          title: "Pop Love Balloons! 🎈",
                          subtitle: "အသည်းပုံပူဖောင်းများကို နှိပ်၍ ဖောက်ပါ (၁၅ မှတ်ပြည့်အောင် စုဆောင်းပါ)",
                          winMessage: "ပူဖောင်းအားလုံးကို ဖောက်ပြီး ချစ်ခြင်းမေတ္တာအမှတ်ပြည့် ရရှိသွားပါပြီ! 🎉",
                          targetScore: 15
                        },
                        whack_heart: {
                          title: "Whack-a-Heart! ရင်ခုန်သံဖမ်းဂိမ်း 🔨",
                          subtitle: "အပေါက်များမှ ပေါ်လာသော အသည်းပုံနှင့် အရုပ်များကို အချိန်မီ နှိပ်ဖမ်းပါ",
                          winMessage: "ရင်ခုန်သံအသည်းပုံများကို အောင်မြင်စွာ ဖမ်းယူနိုင်ခဲ့ပါပြီ! 🎉",
                          targetScore: 15
                        },
                        candy_crush: {
                          title: "Sweet Candy Match! 🍬",
                          subtitle: "သကြားလုံး/အသည်းပုံ (၃) ခု တန်းစီအောင် တွဲစပ်ပြီး အမှတ်ပြည့်အောင် ယူပါ",
                          winMessage: "ချိုမြိန်သောအချစ် သကြားလုံးဂိမ်းကို အောင်မြင်စွာ ကစားနိုင်ခဲ့ပါပြီ! 🎉",
                          targetScore: 120
                        },
                        love_quiz: {
                          title: "Love Quiz! အချစ်ဉာဏ်စမ်းမေးခွန်းများ 💖",
                          subtitle: "မေးခွန်းများကို မှန်အောင်ဖြေဆိုပြီး Game 3 ကို ဖွင့်လှစ်ပါ",
                          winMessage: "မေးခွန်းအားလုံးကို အောင်မြင်စွာ ဖြေဆိုနိုင်ခဲ့ပါပြီ! Game 3 ကို ဖွင့်လှစ်ပေးလိုက်ပါပြီ 🎉",
                          targetScore: 3
                        }
                      };
                      const selectedPreset = presets[currentType];
                      if (selectedPreset) {
                        setFormData({
                          ...formData,
                          game2: {
                            ...formData.game2,
                            ...selectedPreset
                          }
                        });
                      }
                    }}
                    className="text-xs text-pink-600 hover:text-pink-700 bg-white hover:bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles size={13} className="text-pink-500" />
                    <span>ရွေးချယ်ထားသောဂိမ်းအတွက် စာသားများကို အလိုအလျောက် သတ်မှတ်မည်</span>
                  </button>
                </div>
              </div>

              {/* Game 2 Details Configuration */}
              <div className="p-4 bg-white rounded-2xl border border-pink-200 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Heart size={16} className="text-pink-500 fill-pink-500" />
                  ဂိမ်းအချက်အလက်များနှင့် စာသားများ (Game Content & Messages)
                </h3>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Game 2 ခေါင်းစဉ် (Game 2 Title)
                  </label>
                  <input
                    type="text"
                    value={formData.game2.title || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      game2: { ...formData.game2, title: e.target.value }
                    })}
                    placeholder="Let's collect our missing hearts! 💕"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    ဂိမ်းလမ်းညွှန်စာသား (Game Instructions / Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.game2.subtitle || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      game2: { ...formData.game2, subtitle: e.target.value }
                    })}
                    placeholder="မေးခွန်းများကို မှန်အောင်ဖြေဆိုပြီး Game 3 ကို ဖွင့်လှစ်ပါ"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    အောင်မြင်သည့်အခါ ပြသမည့်စာသား (Win Message)
                  </label>
                  <input
                    type="text"
                    value={formData.game2.winMessage || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      game2: { ...formData.game2, winMessage: e.target.value }
                    })}
                    placeholder="You collected all the love! 🎉"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                {formData.game2.gameType !== 'love_quiz' ? (
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      အနိုင်ရရှိရန် လိုအပ်သော ရမှတ် / Goals (Target Score)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={(formData.game2.gameType === 'candy_crush') ? 500 : 50}
                      value={
                        formData.game2.targetScore || 
                        ((formData.game2.gameType === 'candy_crush') ? 120 : (formData.game2.gameType === 'memory_match' ? 6 : 15))
                      }
                      onChange={(e) => setFormData({
                        ...formData,
                        game2: { 
                          ...formData.game2, 
                          targetScore: parseInt(e.target.value, 10) || 
                            ((formData.game2.gameType === 'candy_crush') ? 120 : (formData.game2.gameType === 'memory_match' ? 6 : 15)) 
                        }
                      })}
                      className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formData.game2.gameType === 'whack_heart'
                        ? 'အသည်းနှင့် အရုပ်များ နှိပ်ခေါက်ဖမ်းယူရန် လိုအပ်သော ရမှတ် (ဥပမာ- ၁၅ မှတ်ရလျှင် အနိုင်ရမည်)'
                        : formData.game2.gameType === 'candy_crush' 
                        ? 'ဂိမ်းအနိုင်ရရန် လိုအပ်သော ရမှတ် (ဥပမာ- ၁၂၀ မှတ်)' 
                        : formData.game2.gameType === 'memory_match'
                        ? 'ရှာဖွေလှန်ရမည့် ကတ်ပြားအတွဲ အရေအတွက် (ပုံမှန် ၆ တွဲ)'
                        : formData.game2.gameType === 'pop_hearts'
                        ? 'ဖောက်ရန် လိုအပ်သော အသည်းပုံပူဖောင်း အရေအတွက် (ဥပမာ- ၁၅ ခု ဖောက်နိုင်လျှင် အနိုင်ရမည်)'
                        : 'ခြင်းတောင်းဖြင့် ဖမ်းယူရမည့် အသည်းပုံ အရေအတွက် (ဥပမာ- ၁၅ ခု ဖမ်းနိုင်လျှင် အနိုင်ရမည်)'}
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-pink-100">
                    <QuizQuestionListEditor
                      title="Game 2 Quiz မေးခွန်းများ စီမံခန့်ခွဲခြင်း"
                      questions={formData.game2.questions || []}
                      onChange={(updated) => setFormData({
                        ...formData,
                        game2: { ...formData.game2, questions: updated }
                      })}
                      accentColor="pink"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ၅။ အတားအဆီး / အချစ်စိန်ခေါ်မှု (Game 3) */}
          {activeTab === 6 && (
            <div className="space-y-6">
              {/* Game 3 Type Selector */}
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <span>🎮</span>
                      Game 3 ကစားနည်းပုံစံ ရွေးချယ်ရန် (Select Game 3 Type)
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Game 2 နှင့် မတူညီသော စိတ်ကြိုက် အချစ်ဂိမ်းစတိုင်ကို ရွေးချယ်နိုင်ပါသည်
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200">
                    {formData.game3.gameType === 'love_quiz'
                      ? '❓ Love Quiz'
                      : formData.game3.gameType === 'cupid_shooter'
                      ? '🏹 Cupid Shooter'
                      : formData.game3.gameType === 'scratch_card'
                      ? '🥠 Scratch Card'
                      : formData.game3.gameType === 'photo_puzzle'
                      ? '🧩 Photo Puzzle'
                      : '🕊️ Flappy Bird'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    {
                      id: 'flappy_bird',
                      icon: '🕊️',
                      title: 'အတားအဆီးကျော် အချစ်ငှက်ပျံဂိမ်း',
                      engTitle: 'Flappy Love Bird',
                      tag: 'Arcade / Fly',
                      desc: 'ချစ်ငှက်လေးကို နှိပ်၍ အတားအဆီးတိုင်များကို ကျော်ဖြတ်ပျံသန်းရသော ဂိမ်း',
                      defaultTitle: "Let's overcome all obstacles together 💕",
                      defaultSubtitle: "နှိပ်၍ ပျံသန်းပြီး အတားအဆီး ၅ ခုကို ကျော်ဖြတ်ပါ",
                      defaultWinTitle: "All obstacles cleared! 🎉",
                      defaultWinSubtitle: "There is a special prize for my amazing baby 💕",
                      defaultTargetScore: 5
                    },
                    {
                      id: 'cupid_shooter',
                      icon: '🏹',
                      title: 'ကျူးပစ် အချစ်မြှားပစ်ဂိမ်း',
                      engTitle: 'Cupid Arrow Shooter',
                      tag: 'Shooter / Archery',
                      desc: 'ကျူးပစ်လေး၏ အချစ်မြှားဖြင့် လွင့်မျောနေသော အသည်းပစ်မှတ်များကို ပစ်ခတ်ရသောဂိမ်း',
                      defaultTitle: "Cupid's Love Arrow! ကျူးပစ်မြှားပစ်ဂိမ်း 🏹",
                      defaultSubtitle: "ကျူးပစ်လေးရဲ့ အချစ်မြှားဖြင့် လွင့်မျောနေသော အသည်းပစ်မှတ်များကို ပစ်ခတ်ပါ",
                      defaultWinTitle: "ကျူးပစ်မြှား အားလုံး ထိမှန်သွားပါပြီ! 🎉",
                      defaultWinSubtitle: "There is a special final prize for you 💕",
                      defaultTargetScore: 12
                    },
                    {
                      id: 'scratch_card',
                      icon: '🥠',
                      title: 'ကံစမ်းခြစ်ကတ် အချစ်ဆုမဲဂိမ်း',
                      engTitle: 'Love Scratch Card',
                      tag: 'Scratch / Surprise',
                      desc: 'ရွှေရောင်ဆုမဲကတ်ပြား ၃ ကတ်ကို လက်ဖြင့် ခြစ်၍ အချစ်ဆုမဲများကို ရှာဖွေရသောဂိမ်း',
                      defaultTitle: "Love Scratch Card! ကံစမ်းခြစ်ကတ်ဆုမဲ 🥠",
                      defaultSubtitle: "ရွှေရောင်ကတ်ပြားများကို လက်ဖြင့် ခြစ်၍ အချစ်ဆုမဲများကို ရှာဖွေပါ",
                      defaultWinTitle: "ကံစမ်းကတ်အားလုံး ခြစ်ပြီး အချစ်ဆု ရရှိပါပြီ! 🎉",
                      defaultWinSubtitle: "There is a special final prize for you 💕",
                      defaultTargetScore: 3
                    },
                    {
                      id: 'photo_puzzle',
                      icon: '🧩',
                      title: 'ချစ်သူနှစ်ဦး အချစ်ပဟေဠိဆက်ဂိမ်း',
                      engTitle: 'Love Photo Sliding Puzzle',
                      tag: 'Puzzle / Logic',
                      desc: 'အမှတ်တရဓာတ်ပုံကို ကွက်လပ်သို့ ရွှေ့ကာ ပြီးပြည့်စုံအောင် ဆက်ရသော ၃x၃ ပဟေဠိဂိမ်း',
                      defaultTitle: "Love Photo Puzzle! အချစ်ပဟေဠိဆက်ဂိမ်း 🧩",
                      defaultSubtitle: "ကွက်လပ်သို့ ရွှေ့ကာ ချစ်သူနှစ်ဦးရဲ့ အမှတ်တရပုံရိပ်လေးကို ပြီးပြည့်စုံအောင် ဆက်ပေးပါ",
                      defaultWinTitle: "အချစ်ပဟေဠိပုံကို အောင်မြင်စွာ ဆက်နိုင်ခဲ့ပါပြီ! 🎉",
                      defaultWinSubtitle: "There is a special final prize for you 💕",
                      defaultTargetScore: 1
                    },
                    {
                      id: 'love_quiz',
                      icon: '❓',
                      title: 'အချစ်ဉာဏ်စမ်း မေးခွန်းဂိမ်း',
                      engTitle: 'Final Love Quiz',
                      tag: 'Quiz / Trivia',
                      desc: 'ချစ်သူနှစ်ဦးကြား အမှတ်တရမေးခွန်းများကို Game 1 ကဲ့သို့ ရွေးချယ်ဖြေဆိုရသော အချစ်ဉာဏ်စမ်းဂိမ်း',
                      defaultTitle: "Final Love Quiz! အချစ်ဆုံး ဉာဏ်စမ်းမေးခွန်းများ 💖",
                      defaultSubtitle: "မေးခွန်းများကို မှန်အောင်ဖြေဆိုပြီး Final Surprise ဆုလက်ဆောင်ကို ရယူပါ",
                      defaultWinTitle: "မေးခွန်းအားလုံး မှန်ကန်စွာ ဖြေဆိုပြီးပါပြီ! 🎉",
                      defaultWinSubtitle: "There is a special final prize for you 💕",
                      defaultTargetScore: 3
                    }
                  ].map(gameOption => {
                    const isSelected = (formData.game3.gameType || 'flappy_bird') === gameOption.id;

                    return (
                      <div
                        key={gameOption.id}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            game3: {
                              ...formData.game3,
                              gameType: gameOption.id as any,
                              title: formData.game3.title || gameOption.defaultTitle,
                              subtitle: formData.game3.subtitle || gameOption.defaultSubtitle,
                              winTitle: formData.game3.winTitle || gameOption.defaultWinTitle,
                              winSubtitle: formData.game3.winSubtitle || gameOption.defaultWinSubtitle,
                              targetScore: formData.game3.targetScore || gameOption.defaultTargetScore
                            }
                          });
                        }}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-300/50'
                            : 'bg-white/70 border-purple-100 hover:border-purple-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-1 bg-purple-50 rounded-lg border border-purple-100">
                              {gameOption.icon}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-gray-900">{gameOption.title}</div>
                              <div className="text-[11px] font-medium text-purple-600">{gameOption.engTitle}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {gameOption.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                          {gameOption.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Auto-Fill Preset Button */}
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const currentType = formData.game3.gameType || 'flappy_bird';
                      const presets: Record<string, any> = {
                        flappy_bird: {
                          title: "Let's overcome all obstacles together 💕",
                          subtitle: "နှိပ်၍ ပျံသန်းပြီး အတားအဆီး ၅ ခုကို ကျော်ဖြတ်ပါ",
                          winTitle: "All obstacles cleared! 🎉",
                          winSubtitle: "There is a special prize for my amazing baby 💕",
                          targetScore: 5
                        },
                        cupid_shooter: {
                          title: "Cupid's Love Arrow! ကျူးပစ်မြှားပစ်ဂိမ်း 🏹",
                          subtitle: "ကျူးပစ်လေးရဲ့ အချစ်မြှားဖြင့် လွင့်မျောနေသော အသည်းပစ်မှတ်များကို ပစ်ခတ်ပါ",
                          winTitle: "ကျူးပစ်မြှား အားလုံး ထိမှန်သွားပါပြီ! 🎉",
                          winSubtitle: "There is a special final prize for you 💕",
                          targetScore: 12
                        },
                        scratch_card: {
                          title: "Love Scratch Card! ကံစမ်းခြစ်ကတ်ဆုမဲ 🥠",
                          subtitle: "ရွှေရောင်ကတ်ပြားများကို လက်ဖြင့် ခြစ်၍ အချစ်ဆုမဲများကို ရှာဖွေပါ",
                          winTitle: "ကံစမ်းကတ်အားလုံး ခြစ်ပြီး အချစ်ဆု ရရှိပါပြီ! 🎉",
                          winSubtitle: "There is a special final prize for you 💕",
                          targetScore: 3
                        },
                        photo_puzzle: {
                          title: "Love Photo Puzzle! အချစ်ပဟေဠိဆက်ဂိမ်း 🧩",
                          subtitle: "ကွက်လပ်သို့ ရွှေ့ကာ ချစ်သူနှစ်ဦးရဲ့ အမှတ်တရပုံရိပ်လေးကို ပြီးပြည့်စုံအောင် ဆက်ပေးပါ",
                          winTitle: "အချစ်ပဟေဠိပုံကို အောင်မြင်စွာ ဆက်နိုင်ခဲ့ပါပြီ! 🎉",
                          winSubtitle: "There is a special final prize for you 💕",
                          targetScore: 1
                        },
                        love_quiz: {
                          title: "Final Love Quiz! အချစ်ဆုံး ဉာဏ်စမ်းမေးခွန်းများ 💖",
                          subtitle: "မေးခွန်းများကို မှန်အောင်ဖြေဆိုပြီး Final Surprise ဆုလက်ဆောင်ကို ရယူပါ",
                          winTitle: "မေးခွန်းအားလုံး မှန်ကန်စွာ ဖြေဆိုပြီးပါပြီ! 🎉",
                          winSubtitle: "There is a special final prize for you 💕",
                          targetScore: 3
                        }
                      };
                      const selectedPreset = presets[currentType];
                      if (selectedPreset) {
                        setFormData({
                          ...formData,
                          game3: {
                            ...formData.game3,
                            ...selectedPreset
                          }
                        });
                      }
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 bg-white hover:bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles size={13} className="text-purple-500" />
                    <span>ရွေးချယ်ထားသောဂိမ်းအတွက် စာသားများကို အလိုအလျောက် သတ်မှတ်မည်</span>
                  </button>
                </div>
              </div>

              {/* Game 3 Details Configuration */}
              <div className="p-4 bg-white rounded-2xl border border-purple-200 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>✨</span>
                  ဂိမ်းအချက်အလက်များနှင့် စာသားများ (Game Content & Messages)
                </h3>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Game 3 ခေါင်းစဉ် (Game 3 Title)
                  </label>
                  <input
                    type="text"
                    value={formData.game3.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      game3: { ...formData.game3, title: e.target.value }
                    })}
                    placeholder="Let's overcome all obstacles together 💕"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Game 3 လမ်းညွှန်စာတန်းငယ် (Game 3 Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.game3.subtitle || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      game3: { ...formData.game3, subtitle: e.target.value }
                    })}
                    placeholder="နှိပ်၍ ပျံသန်းပြီး အတားအဆီးများကို ကျော်ဖြတ်ပါ"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    အောင်မြင်သည့် ခေါင်းစဉ်ကြီး (Win Title)
                  </label>
                  <input
                    type="text"
                    value={formData.game3.winTitle}
                    onChange={(e) => setFormData({
                      ...formData,
                      game3: { ...formData.game3, winTitle: e.target.value }
                    })}
                    placeholder="All games cleared! 🎉"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    အောင်မြင်သည့် စာတန်းငယ် (Win Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.game3.winSubtitle}
                    onChange={(e) => setFormData({
                      ...formData,
                      game3: { ...formData.game3, winSubtitle: e.target.value }
                    })}
                    placeholder="There is a special prize for my amazing baby 💕"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-sm"
                  />
                </div>

                {/* Custom Photo Upload for Photo Puzzle */}
                {formData.game3.gameType === 'photo_puzzle' && (
                  <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <span>🧩</span>
                        <span>ပဟေဠိဆက်ရန် စိတ်ကြိုက်ဓာတ်ပုံ (Custom Puzzle Photo)</span>
                      </label>
                      <span className="text-[11px] text-purple-600 font-medium">JPG / PNG / WebP</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-300 bg-white shadow-xs flex-shrink-0 flex items-center justify-center">
                        {formData.game3.puzzleImageUrl ? (
                          <img
                            src={formData.game3.puzzleImageUrl}
                            alt="Puzzle Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-1 text-gray-400 text-[10px]">
                            ပုံမတင်ရသေးပါ
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <input
                          type="text"
                          value={formData.game3.puzzleImageUrl || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            game3: { ...formData.game3, puzzleImageUrl: e.target.value }
                          })}
                          placeholder="Image URL (သို့မဟုတ်) အောက်ပါခလုတ်ဖြင့် Upload တင်ပါ"
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none font-mono focus:ring-2 focus:ring-purple-300 bg-white"
                        />

                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                            <Upload size={13} />
                            <span>ဓာတ်ပုံတင်မည် (Upload Photo)</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, (url) => {
                                setFormData(prev => ({
                                  ...prev,
                                  game3: { ...prev.game3, puzzleImageUrl: url }
                                }));
                              }, 'puzzleImage', 500, 500, 0.75)}
                            />
                          </label>

                          {formData.game3.puzzleImageUrl && (
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                game3: { ...formData.game3, puzzleImageUrl: '' }
                              })}
                              className="text-xs text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white cursor-pointer"
                            >
                              မူလပုံ ပြန်ထားမည်
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">
                          အမှတ်တရပုံ ထည့်သွင်းထားခြင်း မရှိပါက Couple Memories ထဲမှ ဓာတ်ပုံ သို့မဟုတ် Romantic Artwork ကို အလိုအလျောက် သုံးပေးပါမည်။
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {formData.game3.gameType !== 'love_quiz' ? (
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      အနိုင်ရရှိရန် လိုအပ်သော ရမှတ် / Goals (Target Score)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={formData.game3.gameType === 'cupid_shooter' ? 50 : 30}
                      value={
                        formData.game3.targetScore || 
                        (formData.game3.gameType === 'cupid_shooter' ? 12 : 
                         (formData.game3.gameType === 'scratch_card' ? 3 : 
                          (formData.game3.gameType === 'photo_puzzle' ? 1 : 5)))
                      }
                      onChange={(e) => setFormData({
                        ...formData,
                        game3: { 
                          ...formData.game3, 
                          targetScore: parseInt(e.target.value, 10) || 5
                        }
                      })}
                      className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-sm"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formData.game3.gameType === 'cupid_shooter'
                        ? 'မြှားဖြင့် ထိမှန်အောင် ပစ်ခတ်ရမည့် ပစ်မှတ်ရမှတ် (ဥပမာ- ၁၂ မှတ်ရလျှင် Final Prize ပွင့်မည်)'
                        : formData.game3.gameType === 'scratch_card'
                        ? 'ခြစ်ရန် လိုအပ်သော ဆုမဲကတ် အရေအတွက် (၁ မှ ၃ ကတ်)'
                        : formData.game3.gameType === 'photo_puzzle'
                        ? 'ပဟေဠိ အောင်မြင်စွာ ပြီးစီးပါက Final Prize ကို ရရှိမည်'
                        : 'ကျော်ဖြတ်ရမည့် အတားအဆီးတိုင် အရေအတွက် (ဥပမာ- ၅ ခု ကျော်ဖြတ်နိုင်လျှင် Final Prize ပွင့်မည်)'}
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-purple-100">
                    <QuizQuestionListEditor
                      title="Game 3 Quiz မေးခွန်းများ စီမံခန့်ခွဲခြင်း"
                      questions={formData.game3.questions || []}
                      onChange={(updated) => setFormData({
                        ...formData,
                        game3: { ...formData.game3, questions: updated }
                      })}
                      accentColor="purple"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: ၆။ လက်ဆောင် (Prize / Love Letter) */}
          {activeTab === 7 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    စာအိတ် ခေါင်းစဉ် (Envelope Title)
                  </label>
                  <input
                    type="text"
                    value={formData.prize.envelopeTitle || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      prize: { ...formData.prize, envelopeTitle: e.target.value }
                    })}
                    placeholder="A Secret Letter For You"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    စာအိတ် စာတန်းငယ် (Envelope Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.prize.envelopeSubtitle || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      prize: { ...formData.prize, envelopeSubtitle: e.target.value }
                    })}
                    placeholder="Tap to open"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="p-4 bg-pink-50/40 rounded-2xl border border-pink-200 space-y-4">
                <h4 className="text-sm font-bold text-gray-900">
                  💌 မေတ္တာစာ အပြည့်အစုံ (Love Letter Customization)
                </h4>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    နှုတ်ခွန်းဆက် စာသား (Greeting)
                  </label>
                  <input
                    type="text"
                    value={formData.prize.letterGreeting || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      prize: { ...formData.prize, letterGreeting: e.target.value }
                    })}
                    placeholder="My Dearest Bby,"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    မေတ္တာစာ အပိုဒ် (၁) - Paragraph 1
                  </label>
                  <textarea
                    rows={2}
                    value={formData.prize.letterParagraph1 || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      prize: { ...formData.prize, letterParagraph1: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    မေတ္တာစာ အပိုဒ် (၂) - Paragraph 2
                  </label>
                  <textarea
                    rows={2}
                    value={formData.prize.letterParagraph2 || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      prize: { ...formData.prize, letterParagraph2: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    မေတ္တာစာ အပိုဒ် (၃) - Paragraph 3
                  </label>
                  <textarea
                    rows={2}
                    value={formData.prize.letterParagraph3 || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      prize: { ...formData.prize, letterParagraph3: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-rose-700 block mb-1">
                    အထူး ချစ်စကား (Special Highlight Message)
                  </label>
                  <input
                    type="text"
                    value={formData.prize.message}
                    onChange={(e) => setFormData({
                      ...formData,
                      prize: { ...formData.prize, message: e.target.value }
                    })}
                    placeholder="Love you so much baby ... 😘"
                    className="w-full px-4 py-2 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none text-sm font-bold text-rose-600 bg-rose-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      နိဂုံးနှုတ်ဆက် (Sign-off)
                    </label>
                    <input
                      type="text"
                      value={formData.prize.letterSignOff || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        prize: { ...formData.prize, letterSignOff: e.target.value }
                      })}
                      placeholder="Forever yours,"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      လက်မှတ် အမည် (Sender Signature Name)
                    </label>
                    <input
                      type="text"
                      value={formData.prize.senderName || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        prize: { ...formData.prize, senderName: e.target.value }
                      })}
                      placeholder="Kko"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ၇။ အမှတ်တရ (Memories Gallery) */}
          {activeTab === 8 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-200">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    အမှတ်တရ စာမျက်နှာ ခေါင်းစဉ် (Memories Title)
                  </label>
                  <input
                    type="text"
                    value={formData.memories?.title || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      memories: { ...formData.memories, title: e.target.value, subtitle: formData.memories?.subtitle || '' }
                    })}
                    placeholder="Our Memories💕"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    အမှတ်တရ စာတန်းငယ် (Memories Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.memories?.subtitle || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      memories: { ...formData.memories, subtitle: e.target.value, title: formData.memories?.title || '' }
                    })}
                    placeholder="A gallery of all the perfect moments we've spent together."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Memories List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900">
                    အမှတ်တရ ဓာတ်ပုံများနှင့် အကြောင်းအရာများ ({formData.memoriesList.length} Items)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = Date.now();
                      setFormData({
                        ...formData,
                        memoriesList: [
                          ...formData.memoriesList,
                          {
                            id: newId,
                            title: 'New Memory',
                            text: 'A special day to remember...',
                            image: '/photo 1.jpg'
                          }
                        ]
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#881337] text-white rounded-xl text-xs font-medium hover:bg-rose-900 transition-colors shadow-sm"
                  >
                    <Plus size={14} /> အမှတ်တရ အသစ် ထည့်မည်
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.memoriesList.map((item, index) => (
                    <div key={item.id || index} className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          #{index + 1} အမှတ်တရ
                        </span>
                        {formData.memoriesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.memoriesList.filter((_, idx) => idx !== index);
                              setFormData({ ...formData, memoriesList: updated });
                            }}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0 relative group">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div>
                            <label className="text-xs text-gray-600 block">ခေါင်းစဉ် (Title)</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const updated = [...formData.memoriesList];
                                updated[index].title = e.target.value;
                                setFormData({ ...formData, memoriesList: updated });
                              }}
                              className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded-lg outline-none font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-600 block">ဓာတ်ပုံ URL သို့မဟုတ် Upload</label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={item.image}
                                onChange={(e) => {
                                  const updated = [...formData.memoriesList];
                                  updated[index].image = e.target.value;
                                  setFormData({ ...formData, memoriesList: updated });
                                }}
                                className="flex-1 px-2 py-1 text-[11px] font-mono border border-gray-300 rounded-lg outline-none"
                                placeholder="/photo 1.jpg or URL"
                              />
                              <label className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg cursor-pointer flex-shrink-0 transition-colors">
                                <Upload size={14} />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, (url) => {
                                    setFormData(prev => {
                                      const updated = [...prev.memoriesList];
                                      updated[index] = { ...updated[index], image: url };
                                      return { ...prev, memoriesList: updated };
                                    });
                                  }, `memories_${index}`, 600, 600, 0.75)}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 block mb-0.5">အမှတ်တရ ရေးသားချက် (Story / Note)</label>
                        <textarea
                          rows={2}
                          value={item.text}
                          onChange={(e) => {
                            const updated = [...formData.memoriesList];
                            updated[index].text = e.target.value;
                            setFormData({ ...formData, memoriesList: updated });
                          }}
                          className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={15} />
            <span>မူလစာသားများ ပြန်ဖြည့်မည်</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              မလုပ်တော့ပါ
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#881337] hover:bg-[#700f2b] rounded-xl shadow-md shadow-rose-900/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>သိမ်းဆည်းနေပါသည်...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={16} />
                  <span>သိမ်းဆည်းပြီးပါပြီ!</span>
                </>
              ) : (
                <>
                  <span>Firestore သို့ သိမ်းဆည်းမည်</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
