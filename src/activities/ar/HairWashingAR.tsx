import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrackingState } from '../../hooks/useHandTracking';
import { AudioEngine } from '../../engine/AudioEngine';
import { useGameStore } from '../../store/gameStore';

interface Props {
  tracking: TrackingState;
  onComplete: () => void;
  isCompleted: boolean;
}

export default function HairWashingAR({ tracking, onComplete, isCompleted }: Props) {
  const [hairCleanliness, setHairCleanliness] = useState(0);
  const [feedback, setFeedback] = useState('Massage your real scalp with circular hand movements');
  const [foams, setFoams] = useState<Array<{ id: number; relX: number; relY: number; size: number }>>([]);
  const [celebrated, setCelebrated] = useState(false);
  const idleTimer = useRef(0);
  const { incrementStat } = useGameStore();

  const face = tracking.face;
  const hand = tracking.primaryHand;

  const headX = face ? 1 - face.headTop.x : 0.5;
  const headY = face ? face.headTop.y : 0.35;

  const handX = hand ? 1 - hand.position.x : 0.5;
  const handY = hand ? hand.position.y : 0.5;

  useEffect(() => {
    if (celebrated) return;

    if (!hand) {
      setFeedback('Show your hand near your hair');
      return;
    }

    const distToHead = Math.hypot(handX - headX, handY - headY);
    const speed = hand.velocity.speed;
    const isShampooing = distToHead < 0.25 && (hand.isCircular || speed > 0.06);

    if (isShampooing) {
      idleTimer.current = 0;
      setFeedback('GOOD! Keep lathering your hair ✨');
      AudioEngine.playBrushScrub(speed);

      setHairCleanliness(prev => {
        const next = Math.min(100, prev + speed * 16);
        if (next >= 100 && !celebrated) {
          setCelebrated(true);
          AudioEngine.playAchievement();
          incrementStat('baths', 1);
        }
        return next;
      });

      // Spawn lather foam on real hair
      if (Math.random() < 0.45) {
        setFoams(f => [
          ...f.slice(-35),
          {
            id: Math.random(),
            relX: (Math.random() - 0.5) * 0.22,
            relY: -0.08 + (Math.random() - 0.5) * 0.08,
            size: 10 + Math.random() * 20,
          },
        ]);
      }
    } else {
      idleTimer.current += 1;
      if (idleTimer.current > 30) {
        setFeedback('“You stopped shampooing.” Move your hands in circles!');
      }
    }
  }, [hand, handX, handY, headX, headY, celebrated, incrementStat]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Lather foam particles directly anchored to user's real hair/head */}
      {foams.map(f => (
        <motion.div
          key={f.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute rounded-full bg-white/90 border border-sky-200 pointer-events-none shadow-lg"
          style={{
            left: `${(headX + f.relX) * 100}%`,
            top: `${(headY + f.relY) * 100}%`,
            width: f.size,
            height: f.size,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 12px rgba(255,255,255,0.8)',
          }}
        />
      ))}

      {/* 2. Floating Telemetry Card */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              HAIR CLEANLINESS
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {Math.round(hairCleanliness)}%
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
              animate={{ width: `${hairCleanliness}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>

          <p className="text-amber-200/90 text-xs font-medium mt-3 text-center">{feedback}</p>
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
            <h3 className="text-xl font-black text-white">
              YOUR REAL HAIR HAS BEEN DIGITALLY WASHED.
            </h3>
            <p className="text-xs text-emerald-200 font-serif italic mt-1">
              Zero water bills incurred. Absolute freshness achieved.
            </p>
            <button
              onClick={handleFinish}
              className="mt-3.5 px-6 py-2 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-transform hover:scale-105 shadow-lg"
            >
              FINISH HAIR WASH (+10 USELESSNESS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
