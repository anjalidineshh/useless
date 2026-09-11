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

export default function ShowerTemperatureAR({ tracking, onComplete, isCompleted }: Props) {
  const [temperature, setTemperature] = useState(32); // Celsius
  const [holdTime, setHoldTime] = useState(0);
  const [celebrated, setCelebrated] = useState(false);
  const { incrementStat, unlockAchievement } = useGameStore();

  const face = tracking.face;
  const hand = tracking.primaryHand;

  const headX = face ? 1 - face.headTop.x : 0.5;
  const headY = face ? face.headTop.y : 0.35;

  const handX = hand ? 1 - hand.position.x : 0.5;

  // Hand position controls temperature: left = cold, right = hot
  useEffect(() => {
    if (celebrated) return;

    if (hand) {
      // Map hand horizontal coordinate (0.1 to 0.9) to 10°C - 65°C
      const mapped = 10 + Math.max(0, Math.min(1, (handX - 0.15) / 0.7)) * 55;
      setTemperature(mapped);
    }
  }, [hand, handX, celebrated]);

  // Sweet spot: 38.5°C ± 1°C
  const isPerfect = temperature >= 37.6 && temperature <= 39.4;

  useEffect(() => {
    if (celebrated) return;

    let timer: number;
    if (isPerfect) {
      timer = window.setInterval(() => {
        setHoldTime(h => {
          const next = h + 0.1;
          if (next >= 2.5) {
            setCelebrated(true);
            AudioEngine.playAchievement();
            unlockAchievement('shower_enlightenment');
            incrementStat('baths', 1);
            return 2.5;
          }
          return next;
        });
      }, 100);
    } else {
      setHoldTime(0);
    }

    return () => clearInterval(timer);
  }, [isPerfect, celebrated, incrementStat, unlockAchievement]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  const waterColor =
    temperature > 50
      ? 'rgba(239, 68, 68, 0.85)' // red hot
      : temperature < 22
      ? 'rgba(56, 189, 248, 0.85)' // icy cyan
      : 'rgba(34, 197, 94, 0.85)'; // perfect green

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Thermal Camera Tint / Frost / Steam */}
      {temperature < 20 && (
        <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none backdrop-blur-[1px]" />
      )}
      {temperature > 50 && (
        <div className="absolute inset-0 bg-red-500/10 pointer-events-none backdrop-blur-[1px]" />
      )}

      {/* 2. Water Stream flowing directly onto user's real head */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-75 flex flex-col items-center"
        style={{
          left: `${headX * 100}%`,
          top: `${Math.max(0.04, headY - 0.18) * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Chrome Head */}
        <div
          className="w-24 h-10 rounded-b-[30px] border border-slate-300 shadow-2xl flex items-end justify-center pb-1"
          style={{ background: 'linear-gradient(180deg, #e2e8f0 0%, #94a3b8 100%)' }}
        />
        {/* Cascade streams */}
        <div className="flex justify-around w-20 pointer-events-none">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full opacity-80"
              style={{ background: waterColor, boxShadow: `0 0 8px ${waterColor}` }}
              animate={{ height: [70, 130, 95] }}
              transition={{ duration: 0.3 + (i % 3) * 0.08, repeat: Infinity }}
            />
          ))}
        </div>
      </div>

      {/* 3. Floating Glass Thermal Controller beside user */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-72">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              SHOWER TEMPERATURE
            </span>
            <span
              className="font-mono font-black text-xl"
              style={{ color: isPerfect ? '#22c55e' : temperature > 45 ? '#ef4444' : '#38bdf8' }}
            >
              {temperature.toFixed(1)}°C
            </span>
          </div>

          {/* Temperature Slider */}
          <div className="relative h-3 rounded-full overflow-hidden bg-white/10 my-2">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-amber-300 to-red-500 rounded-full"
            />
            {/* Target 38.5 Marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-green-400 shadow-md"
              style={{ left: `${((38.5 - 10) / 55) * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-white/40">
            <span>← COLDER</span>
            <span className="text-green-400 font-bold">TARGET: 38.5°C</span>
            <span>HOTTER →</span>
          </div>

          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
            <motion.div
              className="h-full bg-green-400 rounded-full"
              animate={{ width: `${(holdTime / 2.5) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <p className="text-amber-200/90 text-xs font-medium mt-2 text-center">
            {isPerfect
              ? '✨ PERFECT RANGE! Hold steady...'
              : 'Move real hand left for colder, right for hotter!'}
          </p>
        </div>
      </div>

      {/* 4. Completion Announcement */}
      <AnimatePresence>
        {celebrated && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-40 text-center px-8 py-5 rounded-3xl glass-card border border-emerald-400/50 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(6, 78, 59, 0.88)' }}
          >
            <h3 className="text-3xl font-black text-emerald-300"># PERFECT SHOWER</h3>
            <p className="text-xs text-emerald-100 font-serif italic mt-1">
              “You have achieved shower enlightenment.”
            </p>
            <button
              onClick={handleFinish}
              className="mt-3.5 px-6 py-2 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-transform hover:scale-105 shadow-lg"
            >
              FINISH SHOWER (+10 USELESSNESS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
