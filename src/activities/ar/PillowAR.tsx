import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrackingState } from '../../hooks/useHandTracking';
import { AudioEngine } from '../../engine/AudioEngine';
import { useGameStore } from '../../store/gameStore';

interface Props {
  tracking: TrackingState;
  onComplete: () => void;
  isCompleted: boolean;
}

export default function PillowAR({ tracking, onComplete, isCompleted }: Props) {
  const [pillowAngle, setPillowAngle] = useState(0);
  const [comfortLevel, setComfortLevel] = useState(40);
  const [celebrated, setCelebrated] = useState(false);
  const { incrementStat } = useGameStore();

  const face = tracking.face;
  const headX = face ? 1 - face.headTop.x : 0.5;
  const headY = face ? face.headTop.y + 0.12 : 0.45;
  const tiltAngle = face?.tiltAngle || 0;

  // Track head tilt & ergonomic adjustment
  useEffect(() => {
    if (celebrated) return;

    setPillowAngle(tiltAngle * 0.8);

    // Sweet spot: tilt between 5 and 15 degrees
    const isCozy = Math.abs(tiltAngle) >= 4 && Math.abs(tiltAngle) <= 18;
    if (isCozy) {
      setComfortLevel(c => {
        const next = Math.min(100, c + 1.2);
        if (next >= 100 && !celebrated) {
          setCelebrated(true);
          AudioEngine.playAchievement();
          incrementStat('bedsMade', 1);
        }
        return next;
      });
    }
  }, [tiltAngle, celebrated, incrementStat]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Fluffy Virtual Pillow rendered directly BEHIND user's real head */}
      <motion.div
        className="absolute pointer-events-none z-10 transition-all duration-75 flex items-center justify-center"
        style={{
          left: `${headX * 100}%`,
          top: `${headY * 100}%`,
          transform: `translate(-50%, -50%) rotate(${pillowAngle}deg)`,
        }}
      >
        <div
          className="w-80 h-52 rounded-[48px] shadow-2xl border-4 border-white/60 flex items-center justify-between px-6"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.45), inset 0 6px 15px rgba(255,255,255,0.9)',
          }}
        >
          <div className="w-1.5 h-16 bg-slate-200 rounded-full" />
          <div className="text-center">
            <span className="text-[11px] font-mono font-bold text-slate-400 tracking-widest uppercase">
              {comfortLevel >= 100 ? '✨ TEMPERATURE: COLD SIDE' : 'MEMORY FOAM'}
            </span>
          </div>
          <div className="w-1.5 h-16 bg-slate-200 rounded-full" />
        </div>
      </motion.div>

      {/* 2. Floating Telemetry Card */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              PILLOW OPTIMIZATION
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {Math.round(comfortLevel)}%
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
              animate={{ width: `${comfortLevel}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>

          <p className="text-amber-200/90 text-xs font-medium mt-3 text-center">
            Tilt your real head gently sideways to rest on the cold side of the pillow!
          </p>
        </div>
      </div>

      {/* 3. Completion Announcement */}
      <AnimatePresence>
        {celebrated && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-40 text-center px-8 py-5 rounded-3xl glass-card border border-emerald-400/50 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(6, 78, 59, 0.88)' }}
          >
            <h3 className="text-2xl font-black text-white"># PERFECT</h3>
            <p className="text-xs text-emerald-200 font-serif italic mt-1">
              “You have optimized a pillow that does not physically exist.”
            </p>
            <button
              onClick={handleFinish}
              className="mt-3.5 px-6 py-2 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-transform hover:scale-105 shadow-lg"
            >
              FINISH PILLOW (+10 USELESSNESS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
