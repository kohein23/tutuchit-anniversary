import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, X, Sparkles } from 'lucide-react';

interface MemoryModalPreviewProps {
  memory: {
    id: number;
    title: string;
    text: string;
    image: string;
  };
  onClose: () => void;
}

function splitIntoGraphemes(text: string): string[] {
  if (!text) return [];
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (s: any) => s.segment);
  }
  return Array.from(text);
}

export function MemoryModalPreview({ memory, onClose }: MemoryModalPreviewProps) {
  const titleGraphemes = useMemo(() => splitIntoGraphemes(memory.title || ''), [memory.title]);
  const textGraphemes = useMemo(() => splitIntoGraphemes(memory.text || ''), [memory.text]);

  const [titleIndex, setTitleIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [phase, setPhase] = useState<'title' | 'text' | 'done'>('title');
  const [isCompleted, setIsCompleted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when memory changes
  useEffect(() => {
    setTitleIndex(0);
    setTextIndex(0);
    setPhase(titleGraphemes.length > 0 ? 'title' : 'text');
    setIsCompleted(false);
  }, [memory.id, titleGraphemes.length]);

  // Typewriter effect engine
  useEffect(() => {
    if (isCompleted) return;

    if (phase === 'title') {
      if (titleIndex < titleGraphemes.length) {
        const char = titleGraphemes[titleIndex];
        const delay = ['.', '!', '?', '။', '၊'].includes(char) ? 120 : 32;
        timerRef.current = setTimeout(() => {
          setTitleIndex(prev => prev + 1);
        }, delay);
      } else {
        // Title finished, pause briefly before starting text
        timerRef.current = setTimeout(() => {
          setPhase('text');
        }, 220);
      }
    } else if (phase === 'text') {
      if (textIndex < textGraphemes.length) {
        const char = textGraphemes[textIndex];
        const delay = ['.', '!', '?', '။', '၊', '\n'].includes(char) ? 130 : 28;
        timerRef.current = setTimeout(() => {
          setTextIndex(prev => prev + 1);
        }, delay);
      } else {
        setPhase('done');
        setIsCompleted(true);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, titleIndex, textIndex, isCompleted, titleGraphemes, textGraphemes]);

  const displayedTitle = useMemo(() => {
    return titleGraphemes.slice(0, titleIndex).join('');
  }, [titleGraphemes, titleIndex]);

  const displayedText = useMemo(() => {
    return textGraphemes.slice(0, textIndex).join('');
  }, [textGraphemes, textIndex]);

  return (
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      transition={{ type: 'spring', bounce: 0.4 }}
      className="bg-white/50 backdrop-blur-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-3xl shadow-[0_8px_32px_0_rgba(255,182,193,0.4)] border border-white/60 relative overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between p-3 sm:p-4 z-20 border-b border-purple-100/50 bg-white/40 backdrop-blur-md">
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-purple-600 transition-colors bg-white/80 backdrop-blur-md p-2 rounded-full shadow-xs cursor-pointer flex items-center justify-center border border-purple-100/50"
          title="ပိတ်မည်"
        >
          <ArrowLeft size={18} />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-purple-600 transition-colors bg-white/80 backdrop-blur-md p-2 rounded-full shadow-xs cursor-pointer flex items-center justify-center border border-purple-100/50"
          title="ပိတ်မည်"
        >
          <X size={18} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 sm:p-6 custom-scrollbar">
        {/* Memory Photo Display */}
        <div className="w-full bg-purple-100/30 rounded-2xl flex items-center justify-center mb-5 overflow-hidden shadow-inner">
          <img
            src={memory.image}
            alt={memory.title}
            className="w-full max-h-[46vh] object-contain rounded-2xl"
          />
        </div>

        {/* Animated Title */}
        <h3
          className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 min-h-[1.5em] flex items-center flex-wrap"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <span>{displayedTitle}</span>
          {phase === 'title' && !isCompleted && (
            <span className="inline-block w-[2px] h-[1.1em] bg-purple-600 ml-1 rounded-full animate-pulse" />
          )}
        </h3>

        {/* Animated Memory Text Quote Box */}
        <div className="relative p-4 sm:p-5 rounded-2xl border border-purple-100 bg-purple-50/60 shadow-xs">
          <div className="text-gray-700 text-sm sm:text-base font-medium leading-relaxed whitespace-pre-wrap">
            <span className="text-purple-400 font-serif text-lg mr-1 select-none">“</span>
            <span>{displayedText}</span>
            {phase === 'text' && !isCompleted && (
              <span className="inline-block w-[2px] h-[1.15em] bg-purple-600 ml-1 rounded-full animate-pulse align-middle" />
            )}
            <span className="text-purple-400 font-serif text-lg ml-1 select-none">”</span>
          </div>

          {/* Sparkle badge when finished */}
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-purple-200/50 flex items-center justify-end gap-1.5 text-xs text-purple-600 font-medium"
            >
              <Sparkles size={13} className="text-purple-500 animate-spin-slow" />
              <span>အမြဲအမှတ်တရ 💕</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
