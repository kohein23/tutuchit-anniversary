import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, FastForward, RotateCcw } from 'lucide-react';

interface LoveLetterTypewriterProps {
  greeting: string;
  paragraph1?: string;
  paragraph2?: string;
  paragraph3?: string;
  message?: string;
  signOff: string;
  senderName: string;
}

interface LetterSection {
  id: string;
  text: string;
  type: 'greeting' | 'paragraph' | 'highlight' | 'signoff';
}

function splitIntoGraphemes(text: string): string[] {
  if (!text) return [];
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (s: any) => s.segment);
  }
  return Array.from(text);
}

export function LoveLetterTypewriter({
  greeting,
  paragraph1,
  paragraph2,
  paragraph3,
  message,
  signOff,
  senderName
}: LoveLetterTypewriterProps) {
  // Build active sections list
  const sections = useMemo<LetterSection[]>(() => {
    const list: LetterSection[] = [];
    if (greeting) list.push({ id: 'greeting', text: greeting, type: 'greeting' });
    if (paragraph1) list.push({ id: 'p1', text: paragraph1, type: 'paragraph' });
    if (paragraph2) list.push({ id: 'p2', text: paragraph2, type: 'paragraph' });
    if (paragraph3) list.push({ id: 'p3', text: paragraph3, type: 'paragraph' });
    if (message) list.push({ id: 'msg', text: message, type: 'highlight' });
    if (signOff || senderName) {
      list.push({ 
        id: 'signoff', 
        text: `${signOff || 'Forever yours,'}\n${senderName || 'Kko'}`, 
        type: 'signoff' 
      });
    }
    return list;
  }, [greeting, paragraph1, paragraph2, paragraph3, message, signOff, senderName]);

  // Pre-split each section into graphemes
  const sectionGraphemes = useMemo(() => {
    return sections.map(s => splitIntoGraphemes(s.text));
  }, [sections]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentGraphemeIndex, setCurrentGraphemeIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restart typing
  const handleRestart = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrentSectionIndex(0);
    setCurrentGraphemeIndex(0);
    setIsCompleted(false);
  };

  // Skip typing and show all
  const handleSkip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsCompleted(true);
    setCurrentSectionIndex(sections.length);
  };

  useEffect(() => {
    if (isCompleted || sections.length === 0) return;

    if (currentSectionIndex >= sections.length) {
      setIsCompleted(true);
      return;
    }

    const currentGraphemes = sectionGraphemes[currentSectionIndex] || [];

    if (currentGraphemeIndex < currentGraphemes.length) {
      // Typing next character
      const nextChar = currentGraphemes[currentGraphemeIndex];
      // Slight variation: punctuation or newline gets a slightly longer pause
      let delay = 28;
      if (['.', '!', '?', '။', '၊', '\n'].includes(nextChar)) {
        delay = 140;
      }

      timeoutRef.current = setTimeout(() => {
        setCurrentGraphemeIndex(prev => prev + 1);
      }, delay);
    } else {
      // Current section finished, pause before moving to next section
      timeoutRef.current = setTimeout(() => {
        setCurrentSectionIndex(prev => prev + 1);
        setCurrentGraphemeIndex(0);
      }, 320);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentSectionIndex, currentGraphemeIndex, isCompleted, sectionGraphemes, sections.length]);

  return (
    <div className="relative">
      {/* Action controls (Skip / Replay) */}
      <div className="flex items-center justify-end gap-2 mb-3">
        {!isCompleted ? (
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-pink-600 hover:text-pink-800 bg-white/70 hover:bg-white px-3 py-1.5 rounded-full border border-pink-200/80 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
          >
            <FastForward size={13} />
            <span>တစ်ခါတည်းဖတ်မည် (Skip)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRestart}
            className="text-xs text-pink-600 hover:text-pink-800 bg-white/70 hover:bg-white px-3 py-1.5 rounded-full border border-pink-200/80 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
          >
            <RotateCcw size={13} />
            <span>စာလွှာပြန်ဖတ်မည် (Replay)</span>
          </button>
        )}
      </div>

      {/* Love Letter Content */}
      <div 
        className="space-y-4 text-gray-700 text-lg leading-relaxed font-medium relative z-10 whitespace-pre-line select-text"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {sections.map((section, idx) => {
          // Sections that have not started typing yet
          if (!isCompleted && idx > currentSectionIndex) {
            return null;
          }

          // Section currently being typed
          const isCurrentlyTyping = !isCompleted && idx === currentSectionIndex;
          
          const displayText = isCompleted || idx < currentSectionIndex
            ? section.text
            : (sectionGraphemes[idx] || []).slice(0, currentGraphemeIndex).join('');

          if (section.type === 'greeting') {
            return (
              <h1 
                key={section.id} 
                className="text-2xl sm:text-4xl text-[#FF6B95] font-bold mb-6 flex flex-wrap items-baseline"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <span>{displayText}</span>
                {isCurrentlyTyping && (
                  <span className="inline-block w-1 h-7 sm:h-9 bg-pink-500 ml-1.5 animate-pulse rounded-full align-middle" />
                )}
              </h1>
            );
          }

          if (section.type === 'highlight') {
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl sm:text-2xl text-pink-600 font-bold py-2 flex flex-wrap items-baseline gap-1"
              >
                <span>{displayText}</span>
                {isCurrentlyTyping && (
                  <span className="inline-block w-1 h-6 bg-pink-500 ml-1 animate-pulse rounded-full align-middle" />
                )}
              </motion.div>
            );
          }

          if (section.type === 'signoff') {
            const parts = displayText.split('\n');
            const signOffLine = parts[0] || '';
            const senderLine = parts[1] || '';

            return (
              <div key={section.id} className="pt-4">
                <p className="flex items-baseline">
                  <span>{signOffLine}</span>
                  {isCurrentlyTyping && parts.length <= 1 && (
                    <span className="inline-block w-0.5 h-5 bg-pink-500 ml-1 animate-pulse rounded-full align-middle" />
                  )}
                </p>
                {parts.length > 1 && (
                  <span className="text-[#FF6B95] font-bold text-xl sm:text-2xl mt-2 block flex items-baseline">
                    <span>{senderLine}</span>
                    {isCurrentlyTyping && (
                      <span className="inline-block w-1 h-6 bg-pink-500 ml-1.5 animate-pulse rounded-full align-middle" />
                    )}
                  </span>
                )}
              </div>
            );
          }

          // Normal Paragraphs
          return (
            <p key={section.id} className="text-base sm:text-lg leading-relaxed text-gray-700">
              <span>{displayText}</span>
              {isCurrentlyTyping && (
                <span className="inline-block w-0.5 h-5 bg-pink-500 ml-1 animate-pulse rounded-full align-middle" />
              )}
            </p>
          );
        })}
      </div>

      {/* Completion celebration badge */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-8 pt-4 border-t border-pink-200/60 flex items-center justify-between text-xs text-pink-500 font-semibold"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} /> Made with endless love for you
          </span>
          <span className="flex items-center gap-1 text-rose-500">
            <Heart size={14} fill="currentColor" /> Forever & Always
          </span>
        </motion.div>
      )}
    </div>
  );
}
