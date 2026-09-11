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

export default function BedMakingAR({ tracking, onComplete, isCompleted }: Props) {
  const [sheetStretch, setSheetStretch] = useState(30);
  const [aligned, setAligned] = useState(false);
  const { incrementStat } = useGameStore();

  const hands = tracking.hands;
  const primaryHand = tracking.primaryHand;

  const h1 = hands[0] || primaryHand;
  const h2 = hands[1] || primaryHand;

  const h1X = h1 ? 1 - h1.position.x : 0.35;
  const h2X = h2 ? 1 - h2.position.x : 0.65;
  const spread = Math.abs(h1X - h2X);

  useEffect(() => {
    if (aligned) return;

    if (spread > 0.38) {
      AudioEngine.playSweepWhoosh(0.3);
      setSheetStretch(prev => {
        const next = Math.min(100, prev + spread * 10);
        if (next >= 100 && !aligned) {
          setAligned(true);
          AudioEngine.playAchievement();
          incrementStat('bedsMade', 1);
        }
        return next;
      });
    }
  }, [spread, aligned, incrementStat]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Virtual Bedsheet overlaid onto user's real camera environment */}
      <div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center"
        style={{ width: `${Math.max(40, sheetStretch * 0.85)}%` }}
      >
        <motion.div
          animate={{
            height: aligned ? 240 : 180,
            rotate: aligned ? 0 : [0, 1.5, -1.5, 0],
          }}
          transition={{ duration: 0.3 }}
          className="w-full rounded-2xl shadow-2xl border-4 border-sky-300 flex items-center justify-center p-4 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.75) 0%, rgba(2, 132, 199, 0.85) 100%)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <span className="font-mono text-xs text-white uppercase font-bold tracking-widest">
            {aligned ? '✨ BEDSHEET PERFECTLY ALIGNED' : 'WRINKLED BEDSHEET'}
          </span>
        </motion.div>
      </div>

      {/* 2. Floating Telemetry Card */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              SHEET STRETCH
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {Math.round(sheetStretch)}%
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-sky-400"
              animate={{ width: `${sheetStretch}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>

          <p className="text-amber-200/90 text-xs font-medium mt-3 text-center">
            Spread both arms wide across your camera scene to align the sheet!
          </p>
        </div>
      </div>

      {/* 3. Completion Announcement */}
      <AnimatePresence>
        {aligned && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-40 text-center px-8 py-5 rounded-3xl glass-card border border-emerald-400/50 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(6, 78, 59, 0.88)' }}
          >
            <h3 className="text-2xl font-black text-white">BED PERFECTLY MADE</h3>
            <p className="text-xs text-emerald-200 font-serif italic mt-1">
              Aligned with absolute precision in your actual room.
            </p>
            <button
              onClick={handleFinish}
              className="mt-3.5 px-6 py-2 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-transform hover:scale-105 shadow-lg"
            >
              FINISH BED MAKING (+10 USELESSNESS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
