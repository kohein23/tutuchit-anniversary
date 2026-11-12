import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SiteData, defaultSiteData } from '../contexts/SiteContext';
import { onAuthStateChanged } from 'firebase/auth';
import { CmsSiteModal } from '../components/CmsSiteModal';
import { deleteAudioFromFirestore } from '../utils/audioUpload';
import { 
  Heart, Plus, Search, ExternalLink, Copy, Check, 
  Trash2, Edit3, Calendar, Phone, CreditCard, LogOut 
} from 'lucide-react';
import CmsEditSite from './CmsEditSite';
import { MediaAvatar } from '../components/MediaAvatar';

function SiteList() {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteData | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);
  
  // Delete confirm state
  const [siteToDelete, setSiteToDelete] = useState<SiteData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSites = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'sites'));
      const list: SiteData[] = snap.docs.map(d => {
        const data = d.data();
        return {
          ...defaultSiteData,
          ...data,
          id: d.id,
          slug: data.slug || d.id
        } as SiteData;
      });
      setSites(list);
    } catch (err) {
      console.error('Failed to load sites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleOpenCreate = () => {
    setEditingSite({
      ...defaultSiteData,
      id: '',
      slug: '',
      clientName: '',
      customerPhone: '',
      paymentNote: '',
      createdAt: new Date().toISOString()
    });
    setIsNewProject(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (site: SiteData) => {
    setEditingSite(site);
    setIsNewProject(false);
    setIsModalOpen(true);
  };

  const handleSaveSite = async (savedData: SiteData) => {
    const siteId = savedData.id || savedData.slug || 'couple';
    await setDoc(doc(db, 'sites', siteId), savedData);
    await loadSites();
  };

  const handleDeleteConfirm = async () => {
    if (!siteToDelete) return;
    try {
      setIsDeleting(true);
      if (siteToDelete.music?.audioUrl) {
        deleteAudioFromFirestore(siteToDelete.music.audioUrl).catch(console.warn);
      }
      await deleteDoc(doc(db, 'sites', siteToDelete.id));
      setSites(prev => prev.filter(s => s.id !== siteToDelete.id));
      setSiteToDelete(null);
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const baseOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://tutuchit-anniversary.web.app';
  const baseHost = typeof window !== 'undefined' && window.location.host ? window.location.host : 'tutuchit-anniversary.web.app';

  const handleCopyLink = (slugOrId: string) => {
    const url = `${baseOrigin}/${slugOrId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(slugOrId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter sites by name, phone, or slug
  const filteredSites = sites.filter(site => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (site.clientName && site.clientName.toLowerCase().includes(query)) ||
      (site.customerPhone && site.customerPhone.includes(query)) ||
      (site.slug && site.slug.toLowerCase().includes(query)) ||
      (site.id && site.id.toLowerCase().includes(query)) ||
      (site.home?.boyName && site.home.boyName.toLowerCase().includes(query)) ||
      (site.home?.girlName && site.home.girlName.toLowerCase().includes(query))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Subheader Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>စုံတွဲများစာရင်း (Couple Projects)</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            (စုံတွဲပရောဂျက် အားလုံးကို စီမံခန့်ခွဲနိုင်သည့် စနစ် - fast.com / admin@fast.com)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#881337] hover:bg-[#700f2b] text-white font-semibold rounded-2xl shadow-md shadow-rose-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
          <Plus size={18} />
          <span>+ စုံတွဲအသစ် ဖန်တီးမည်</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 စုံတွဲအမည် (သို့) ဖုန်းနံပါတ် (သို့) Slug ဖြင့် ရှာဖွေပါ..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none text-sm transition-all shadow-sm"
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">
          <div className="w-8 h-8 border-3 border-[#881337] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">ပရောဂျက်များ ရယူနေပါသည်...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default Demo Card if not already in sites */}
          {!sites.some(s => s.id === 'demo' || s.id === 'default') && (
            <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/30 rounded-3xl p-6 border-2 border-dashed border-rose-300 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold bg-[#881337] text-white px-3 py-1 rounded-full">
                    Demo Site
                  </span>
                  <span className="text-xs text-rose-700 font-medium font-mono">{baseHost}/demo</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  မူလ စံပြ Demo ဝက်ဘ်ဆိုက်
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Kko & Bby (3 နှစ်နဲ့ ၆ လပြည့် စုံတွဲ ဝက်ဘ်ဆိုက်)
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-rose-200/60 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-rose-800">Public Link:</span>
                  <span className="font-mono text-gray-600 truncate">{baseOrigin}/demo</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setEditingSite({ ...defaultSiteData, id: 'demo', slug: 'demo' });
                    setIsNewProject(false);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 bg-white hover:bg-rose-50 text-[#881337] border border-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 size={14} /> ပြင်ဆင်မည်
                </button>
                <a
                  href="/demo"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    const win = window.open('/demo', '_blank');
                    if (!win) {
                      window.location.href = '/demo';
                    }
                    e.preventDefault();
                  }}
                  className="p-2 bg-white hover:bg-rose-50 text-gray-700 border border-gray-300 rounded-xl transition-colors"
                  title="အစမ်းကြည့်ရှုမည်"
                >
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          )}

          {filteredSites.map(site => {
            const slugOrId = site.slug || site.id;
            const clientName = site.clientName || `${site.home?.boyName || ''} & ${site.home?.girlName || ''}` || site.id;
            const publicUrl = `${baseOrigin}/${slugOrId}`;
            const localPreviewUrl = `/${slugOrId}`;
            const isCopied = copiedId === slugOrId;

            return (
              <div 
                key={site.id} 
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#881337] transition-colors leading-snug">
                        {clientName}
                      </h3>
                      <span className="inline-block text-xs font-mono font-medium text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full mt-1">
                        {baseHost}/{slugOrId}
                      </span>
                    </div>

                    {/* Boy and Girl Avatars */}
                    <div className="flex -space-x-2 flex-shrink-0">
                      <div className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-pink-100 shadow-sm">
                        <MediaAvatar 
                          src={site.home?.boyPhotoUrl || '/kko.jpg'} 
                          fallbackSrc="/kko.jpg"
                          alt="Boy" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-purple-100 shadow-sm">
                        <MediaAvatar 
                          src={site.home?.girlPhotoUrl || '/bby.jpg'} 
                          fallbackSrc="/bby.jpg"
                          alt="Girl" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metadata info */}
                  <div className="space-y-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    {site.createdAt && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar size={13} />
                        <span>{new Date(site.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                    {site.customerPhone && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone size={13} />
                        <span>{site.customerPhone}</span>
                      </div>
                    )}
                    {site.paymentNote && (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CreditCard size={13} />
                        <span>{site.paymentNote}</span>
                      </div>
                    )}
                  </div>

                  {/* Public link input box */}
                  <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-xl p-2 text-xs border border-gray-200">
                    <span className="font-mono text-gray-600 truncate mr-2 select-all">
                      {publicUrl}
                    </span>
                    <button
                      onClick={() => handleCopyLink(slugOrId)}
                      className="text-gray-500 hover:text-gray-900 p-1 flex-shrink-0"
                      title="Copy Link"
                    >
                      {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenEdit(site)}
                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-rose-50 hover:text-[#881337] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 size={14} />
                    <span>ပြင်ဆင်မည်</span>
                  </button>

                  <a
                    href={localPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      const win = window.open(localPreviewUrl, '_blank');
                      if (!win) {
                        window.location.href = localPreviewUrl;
                      }
                      e.preventDefault();
                    }}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    title="ဝက်ဘ်ဆိုက် ဖွင့်ကြည့်မည်"
                  >
                    <ExternalLink size={15} />
                  </a>

                  <button
                    onClick={() => setSiteToDelete(site)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="ဖျက်မည်"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Site Modal */}
      {isModalOpen && (
        <CmsSiteModal
          isOpen={isModalOpen}
          isNew={isNewProject}
          initialData={editingSite}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSite(null);
          }}
          onSave={handleSaveSite}
        />
      )}

      {/* Delete Confirmation Modal */}
      {siteToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">ပရောဂျက် ဖျက်ရန် သေချာပါသလား?</h3>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-rose-800">
                "{siteToDelete.clientName || siteToDelete.id}"
              </span> ကို ဖျက်လိုက်ပါက ပြန်လည်ရယူနိုင်မည် မဟုတ်ပါ။
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSiteToDelete(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                မဖျက်တော့ပါ
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                {isDeleting ? 'ဖျက်နေသည်...' : 'ဖျက်မည်'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CmsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user || user.email !== 'admin@fast.com') {
        navigate('/cmslogin');
      } else {
        setUserEmail(user.email);
        setLoading(false);
      }
    });
    return unsub;
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#881337] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFB] text-gray-800 font-sans pb-12">
      {/* Top Navigation Bar matching screenshot */}
      <nav className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#881337] to-pink-500 text-white flex items-center justify-center shadow-sm">
              <Heart size={18} fill="currentColor" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">
                Tutuchit CMS
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider bg-rose-100 text-[#881337] px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-600">
            <span className="hidden sm:inline text-gray-500 font-medium">
              {userEmail}
            </span>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <button 
              onClick={() => auth.signOut()} 
              className="flex items-center gap-1.5 text-rose-700 hover:text-rose-900 font-semibold transition-colors"
            >
              <LogOut size={15} />
              <span>ထွက်မည်</span>
            </button>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<SiteList />} />
        <Route path="/edit/:id" element={<CmsEditSite />} />
      </Routes>
    </div>
  );
}
