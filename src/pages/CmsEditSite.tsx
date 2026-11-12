import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SiteData, defaultSiteData } from '../contexts/SiteContext';
import { CmsSiteModal } from '../components/CmsSiteModal';

export default function CmsEditSite() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, 'sites', id));
        if (snap.exists()) {
          setData({ ...defaultSiteData, id: snap.id, ...snap.data() } as SiteData);
        } else if (id === 'demo') {
          setData(defaultSiteData);
        } else {
          setData({ ...defaultSiteData, id, slug: id });
        }
      } catch (err) {
        console.error('Error loading site data:', err);
        setData({ ...defaultSiteData, id, slug: id });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = async (savedData: SiteData) => {
    if (!id) return;
    const saveId = savedData.id || id;
    await setDoc(doc(db, 'sites', saveId), savedData);
    navigate('/cms');
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="w-8 h-8 border-3 border-[#881337] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">အချက်အလက်များ ရယူနေပါသည်...</p>
      </div>
    );
  }

  return (
    <CmsSiteModal
      isOpen={true}
      initialData={data}
      isNew={false}
      onClose={() => navigate('/cms')}
      onSave={handleSave}
    />
  );
}
