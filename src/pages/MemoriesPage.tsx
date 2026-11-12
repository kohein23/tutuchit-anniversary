import { motion, AnimatePresence } from 'motion/react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { useSiteData } from '../contexts/SiteContext';
import { MemoryModalPreview } from '../components/MemoryModalPreview';



export function MemoriesPage() {
  const navigate = useAppNavigate();
  const { siteData } = useSiteData();
  const [selectedMemory, setSelectedMemory] = useState<typeof siteData.memoriesList[0] | null>(null);

  return (
    <>
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-4xl bg-white/70 backdrop-blur-2xl border-2 border-white/80 shadow-[0_16px_48px_rgba(192,132,252,0.25)] rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center text-center relative overflow-hidden"
        >
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 text-purple-600 hover:text-purple-800 transition-colors bg-white/80 hover:bg-white p-2.5 rounded-full shadow-md z-20 border border-purple-100"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="bg-gradient-to-tr from-[#9333EA] to-[#C084FC] text-white p-4 rounded-full mb-5 shadow-lg shadow-purple-300/50 mt-12 sm:mt-4 relative z-10">
            <ImageIcon size={40} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-3 relative z-10" style={{ fontFamily: 'Georgia, serif' }}>
            {siteData.memories?.title || 'Our Memories 💕'}
          </h2>
          <p className="text-gray-600 font-medium mb-10 leading-relaxed relative z-10">
            {siteData.memories?.subtitle || "A gallery of all the perfect moments we've spent together."}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full relative z-10">
            {siteData.memoriesList.map((memory) => (
              <motion.div 
                key={memory.id}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMemory(memory)}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border-2 border-purple-100 shadow-[0_8px_20px_rgba(255,105,180,0.18)] hover:shadow-[0_12px_28px_rgba(168,85,247,0.35)] cursor-pointer flex flex-col items-center transition-all group"
              >
                <div className="w-full aspect-square bg-purple-50 rounded-xl flex items-center justify-center overflow-hidden mb-3 border border-purple-100">
                   <img src={memory.image} alt={memory.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h3 className="font-bold text-purple-700 text-sm group-hover:text-purple-900 transition-colors">{memory.title}</h3>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md"
            onClick={() => setSelectedMemory(null)}
          >
            <MemoryModalPreview
              key={selectedMemory.id}
              memory={selectedMemory}
              onClose={() => setSelectedMemory(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
