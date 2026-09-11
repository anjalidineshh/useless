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

interface FoamParticle {
  id: number;
  relX: number; // relative to mouth center (-0.5 to 0.5)
  relY: number; // relative to mouth center (-0.5 to 0.5)
  size: number;
  alpha: number;
}

export default function BrushTeethAR({ tracking, onComplete, isCompleted }: Props) {
  const [upperProgress, setUpperProgress] = useState(0);
  const [lowerProgress, setLowerProgress] = useState(0);
  const [frontProgress, setFrontProgress] = useState(0);
  const [foamList, setFoamList] = useState<FoamParticle[]>([]);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [celebrated, setCelebrated] = useState(false);
  const foamIdCounter = useRef(0);
  const { incrementStat } = useGameStore();

  const face = tracking.face;
  const hand = tracking.primaryHand;

  // Screen coordinates (mirrored)
  const mouth = face?.mouth;
  const mouthX = mouth ? 1 - mouth.center.x : 0.5;
  const mouthY = mouth ? mouth.center.y : 0.52;
  const mouthOpen = mouth?.isOpen ?? false;

  // Hand / brush coordinates
  const handX = hand ? 1 - hand.position.x : mouthX;
  const handY = hand ? hand.position.y : mouthY;

  // Interaction: check if brush is near user's real mouth
  const distToMouth = Math.hypot(handX - mouthX, handY - mouthY);
  const isBrushing = distToMouth < 0.16 && (hand?.velocity.speed || 0) > 0.04;

  useEffect(() => {
    if (!isBrushing || !mouth) return;

    const speed = hand?.velocity.speed || 0.1;
    AudioEngine.playBrushScrub(speed);

    // Spawn foam particles directly around the real mouth
    if (Math.random() < 0.5) {
      const id = foamIdCounter.current++;
      const relX = (Math.random() - 0.5) * 0.12;
      const relY = (Math.random() - 0.5) * 0.06;
      setFoamList(prev => [
        ...prev.slice(-35),
        {
          id,
          relX,
          relY,
          size: 6 + Math.random() * 10,
          alpha: 0.9,
        },
      ]);

      // Add sparkle occasionally
      if (Math.random() < 0.2) {
        setSparkles(s => [
          ...s.slice(-6),
          { id: Math.random(), x: mouthX + relX, y: mouthY + relY },
        ]);
      }
    }

    // Determine whether brushing upper, lower, or front teeth
    const verticalOffset = handY - mouthY;
    if (verticalOffset < -0.015) {
      setUpperProgress(p => Math.min(100, p + speed * 18));
    } else if (verticalOffset > 0.015) {
      setLowerProgress(p => Math.min(100, p + speed * 18));
    } else {
      setFrontProgress(p => Math.min(100, p + speed * 22));
    }
  }, [isBrushing, handX, handY, mouthX, mouthY, hand?.velocity.speed, mouth]);

  // Overall completion
  const avgProgress = Math.round((upperProgress + lowerProgress + frontProgress) / 3);

  useEffect(() => {
    if (avgProgress >= 85 && !celebrated) {
      setCelebrated(true);
      AudioEngine.playAchievement();
      incrementStat('teeth', 1);
    }
  }, [avgProgress, celebrated, incrementStat]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Prompt overlay when mouth is not yet open */}
      {!mouthOpen && !celebrated && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center pointer-events-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-6 py-3 rounded-2xl glass-card border border-amber-400/40 shadow-2xl backdrop-blur-md"
          >
            <p className="text-xs text-amber-300 font-mono tracking-widest uppercase">
              SHOW ME YOUR TEETH
            </p>
            <h3 className="text-xl font-black text-white mt-0.5">OPEN YOUR MOUTH</h3>
          </motion.div>
        </div>
      )}

      {/* 2. Glowing AR contour around user's ACTUAL real mouth */}
      {mouth && (
        <div
          className="absolute rounded-full pointer-events-none transition-all duration-75"
          style={{
            left: `${mouthX * 100}%`,
            top: `${mouthY * 100}%`,
            width: Math.max(60, mouth.width * window.innerWidth * 1.4),
            height: Math.max(30, (mouth.height || 0.04) * window.innerHeight * 2),
            transform: 'translate(-50%, -50%)',
            border: mouthOpen ? '2px solid rgba(56, 189, 248, 0.75)' : '1.5px dashed rgba(255, 255, 255, 0.4)',
            boxShadow: mouthOpen ? '0 0 20px rgba(56, 189, 248, 0.6), inset 0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
          }}
        />
      )}

      {/* 3. Real-time Toothpaste Foam Particles anchored directly over real mouth */}
      {foamList.map(f => (
        <motion.div
          key={f.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute rounded-full bg-white/90 border border-sky-100 shadow-md pointer-events-none"
          style={{
            left: `${(mouthX + f.relX) * 100}%`,
            top: `${(mouthY + f.relY) * 100}%`,
            width: f.size,
            height: f.size,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 8px rgba(255,255,255,0.8)',
          }}
        />
      ))}

      {/* Sparkles on clean teeth */}
      {sparkles.map(sp => (
        <motion.div
          key={sp.id}
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: [0, 1.4, 0], rotate: 90 }}
          transition={{ duration: 0.6 }}
          className="absolute text-yellow-300 font-bold text-lg pointer-events-none"
          style={{
            left: `${sp.x * 100}%`,
            top: `${sp.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          ✨
        </motion.div>
      ))}

      {/* 4. Virtual Toothbrush attached to user's real hand */}
      <div
        className="absolute pointer-events-none z-30 transition-all duration-75"
        style={{
          left: `${handX * 100}%`,
          top: `${handY * 100}%`,
          transform: 'translate(-50%, -50%) rotate(-25deg)',
        }}
      >
        {/* Toothbrush Body */}
        <div className="relative flex flex-col items-center">
          {/* Bristles Head with mint & sky tips */}
          <div
            className="w-5 h-10 rounded-t-md border border-white/40 shadow-lg flex flex-col justify-around py-1 px-0.5"
            style={{ background: '#f8fafc' }}
          >
            <div className="w-full h-1.5 bg-emerald-400 rounded-full" />
            <div className="w-full h-1.5 bg-sky-400 rounded-full" />
            <div className="w-full h-1.5 bg-emerald-400 rounded-full" />
          </div>
          {/* Neck */}
          <div className="w-2.5 h-6 bg-blue-400" />
          {/* Ergonomic Handle */}
          <div
            className="w-4 h-28 rounded-b-xl shadow-2xl border border-blue-700"
            style={{ background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)' }}
          />
        </div>
      </div>

      {/* 5. Floating Telemetry & Teeth Progress Cards (Edge Anchored) */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              TEETH CLEANLINESS
            </span>
            <span className="font-mono font-bold text-amber-400 text-xs">{avgProgress}%</span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-0.5 text-white/70">
                <span>Upper Teeth</span>
                <span className="font-mono">{Math.round(upperProgress)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-150"
                  style={{ width: `${upperProgress}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5 text-white/70">
                <span>Lower Teeth</span>
                <span className="font-mono">{Math.round(lowerProgress)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-150"
                  style={{ width: `${lowerProgress}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5 text-white/70">
                <span>Front Teeth</span>
                <span className="font-mono">{Math.round(frontProgress)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-150"
                  style={{ width: `${frontProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status instruction pill */}
        <div className="px-3.5 py-2 rounded-xl glass-card text-xs text-amber-200/90 border border-amber-500/20 text-center font-medium shadow-lg">
          {mouthOpen ? '✨ BRUSH! Move toothbrush over real teeth' : 'Open mouth to reveal teeth'}
        </div>
      </div>

      {/* 6. Completion Banner */}
      <AnimatePresence>
        {celebrated && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-40 text-center px-8 py-5 rounded-3xl glass-card border border-emerald-400/50 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(6, 78, 59, 0.85)' }}
          >
            <h3 className="text-2xl font-black text-white">TEETH SUCCESSFULLY BRUSHED</h3>
            <p className="text-xs text-emerald-200 font-serif italic mt-1">
              “Your actual teeth participated in a computer science project.”
            </p>
            <button
              onClick={handleFinish}
              className="mt-3.5 px-6 py-2 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-transform hover:scale-105 shadow-lg"
            >
              FINISH ACTIVITY (+10 USELESSNESS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
