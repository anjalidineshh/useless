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

export default function ClothWashingAR({ tracking, onComplete, isCompleted }: Props) {
  const [cleanliness, setCleanliness] = useState(0);
  const [suds, setSuds] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [celebrated, setCelebrated] = useState(false);
  const { incrementStat } = useGameStore();

  const hands = tracking.hands;
  const primaryHand = tracking.primaryHand;

  // Hand 1 and Hand 2 positions
  const h1 = hands[0] || primaryHand;
  const h2 = hands[1] || primaryHand;

  const h1X = h1 ? 1 - h1.position.x : 0.4;
  const h1Y = h1 ? h1.position.y : 0.65;
  const h2X = h2 ? 1 - h2.position.x : 0.6;
  const h2Y = h2 ? h2.position.y : 0.65;

  const midX = (h1X + h2X) / 2;
  const midY = (h1Y + h2Y) / 2;
  const distBetweenHands = Math.hypot(h1X - h2X, h1Y - h2Y);

  useEffect(() => {
    if (celebrated) return;

    const speed = (h1?.velocity.speed || 0) + (h2?.velocity.speed || 0);
    const isRubbing = speed > 0.08 || (distBetweenHands < 0.25 && speed > 0.04);

    if (isRubbing) {
      AudioEngine.playBrushScrub(speed);

      setCleanliness(prev => {
        const next = Math.min(100, prev + speed * 15);
        if (next >= 100 && !celebrated) {
          setCelebrated(true);
          AudioEngine.playAchievement();
          incrementStat('clothes', 1);
        }
        return next;
      });

      if (Math.random() < 0.4) {
        setSuds(prev => [
          ...prev.slice(-25),
          { id: Math.random(), x: midX + (Math.random() - 0.5) * 0.12, y: midY + (Math.random() - 0.5) * 0.08 },
        ]);
      }
    }
  }, [h1, h2, distBetweenHands, midX, midY, celebrated, incrementStat]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Virtual Garment stretched between user's real hands */}
      <motion.div
        className="absolute pointer-events-none z-20 transition-all duration-75 flex items-center justify-center"
        style={{
          left: `${midX * 100}%`,
          top: `${midY * 100}%`,
          width: Math.max(120, distBetweenHands * window.innerWidth * 1.2),
          height: 100,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="w-full h-full rounded-2xl border-2 border-white/40 shadow-2xl flex items-center justify-center transition-colors duration-300"
          style={{
            background:
              cleanliness > 80
                ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)'
                : 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
          }}
        >
          <span className="text-3xl">👕</span>
        </div>
      </motion.div>

      {/* Suds */}
      {suds.map(s => (
        <motion.div
          key={s.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute rounded-full bg-white/90 border border-sky-200 pointer-events-none shadow"
          style={{
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            width: 14,
            height: 14,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* 2. Floating Telemetry Card */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              CLOTH CLEANLINESS
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {Math.round(cleanliness)}%
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-sky-400"
              animate={{ width: `${cleanliness}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>

          <p className="text-amber-200/90 text-xs font-medium mt-3 text-center">
            Rub your real hands together to wash the cloth!
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
            <h3 className="text-2xl font-black text-white">CLOTH: CLEAN</h3>
            <p className="text-xs text-emerald-200 font-serif italic mt-1">
              Detergent applied. Real hands scrubbed.
            </p>
            <button
              onClick={handleFinish}
              className="mt-3.5 px-6 py-2 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-transform hover:scale-105 shadow-lg"
            >
              FINISH CLOTH WASHING (+10 USELESSNESS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
