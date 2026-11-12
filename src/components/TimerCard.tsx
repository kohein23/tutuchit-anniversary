import { motion, AnimatePresence } from 'motion/react';

interface TimerCardProps {
  value: number;
  label: string;
}

export function TimerCard({ value, label }: TimerCardProps) {
  return (
    <div className="relative flex flex-col items-center justify-center bg-white/70 backdrop-blur-xl py-3 px-1 sm:p-5 rounded-[22px] shadow-[0_8px_24px_rgba(255,80,130,0.2)] border-2 border-white overflow-hidden group hover:shadow-[0_12px_28px_rgba(255,42,109,0.35)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/85">
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-100/40 via-white/80 to-rose-100/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-10 sm:h-14 overflow-hidden flex items-center justify-center w-full">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="absolute text-3xl sm:text-[2.75rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF1493] via-[#FF2E74] to-[#FF5388] tabular-nums tracking-tight drop-shadow-sm"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] sm:text-xs text-[#FF2E74] uppercase font-black tracking-widest mt-1 sm:mt-3 relative z-10">
        {label}
      </span>
    </div>
  );
}
