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

interface DustItem {
  id: number;
  x: number;
  y: number;
  type: 'dust' | 'paper' | 'sock';
  size: number;
  active: boolean;
}

const INITIAL_DUST: DustItem[] = Array.from({ length: 22 }).map((_, i) => ({
  id: i,
  x: 10 + Math.random() * 80,
  y: 20 + Math.random() * 70,
  type: i % 7 === 0 ? 'sock' : i % 3 === 0 ? 'paper' : 'dust',
  size: i % 7 === 0 ? 24 : i % 3 === 0 ? 18 : 8 + Math.random() * 6,
  active: true,
}));

export default function RoomCleaningAR({ tracking, onComplete, isCompleted }: Props) {
  const [dustList, setDustList] = useState<DustItem[]>(INITIAL_DUST);
  const [missedSpawned, setMissedSpawned] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const { incrementStat } = useGameStore();

  const hand = tracking.primaryHand;
  const handX = hand ? 1 - hand.position.x : 0.5;
  const handY = hand ? hand.position.y : 0.7;

  useEffect(() => {
    if (!hand) return;

    const speed = hand.velocity.speed;
    const isSweeping = speed > 0.08 || hand.gesture === 'swipe_left' || hand.gesture === 'swipe_right';

    if (isSweeping) {
      AudioEngine.playSweepWhoosh(speed);

      // Check collision between real hand / broom and dust items
      setDustList(prev =>
        prev.map(item => {
          if (!item.active) return item;
          const dist = Math.hypot((item.x / 100) - handX, (item.y / 100) - handY);
          if (dist < 0.16) {
            return { ...item, active: false };
          }
          return item;
        })
      );
    }
  }, [hand, handX, handY]);

  const activeCount = dustList.filter(d => d.active).length;
  const cleanliness = Math.round(((dustList.length - activeCount) / dustList.length) * 100);

  useEffect(() => {
    if (cleanliness === 100 && !missedSpawned) {
      AudioEngine.playAchievement();
      setCelebrated(true);
      incrementStat('roomsCleaned', 1);

      const timer = setTimeout(() => {
        setDustList(prev => [
          ...prev,
          { id: 9999, x: 50, y: 55, type: 'dust', size: 10, active: true },
        ]);
        setMissedSpawned(true);
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [cleanliness, missedSpawned, incrementStat]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Virtual Dust & socks overlaid directly across the real room camera view */}
      {dustList.map(item => {
        if (!item.active) return null;
        return (
          <motion.div
            key={item.id}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="absolute pointer-events-none flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            {item.type === 'sock' && <span className="text-2xl drop-shadow-md">🧦</span>}
            {item.type === 'paper' && <span className="text-xl drop-shadow-md">📄</span>}
            {item.type === 'dust' && (
              <div
                className="rounded-full bg-amber-200/60 shadow-lg border border-white/50 backdrop-blur-sm"
                style={{ width: item.size, height: item.size }}
              />
            )}
          </motion.div>
        );
      })}

      {/* 2. Virtual Broom attached to user's real hand */}
      <div
        className="absolute pointer-events-none z-30 transition-all duration-75 flex flex-col items-center"
        style={{
          left: `${handX * 100}%`,
          top: `${handY * 100}%`,
          transform: 'translate(-50%, -75%) rotate(20deg)',
        }}
      >
        <div
          className="w-2.5 h-36 rounded-t-full shadow-2xl"
          style={{ background: 'linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #92400e 100%)' }}
        />
        <div
          className="w-16 h-12 rounded-b-md shadow-xl flex items-end justify-around px-1 pb-0.5"
          style={{ background: '#ca8a04', borderBottom: '3px solid #713f12' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-0.5 h-6 bg-amber-950/40 rounded-full" />
          ))}
        </div>
      </div>

      {/* 3. Floating Telemetry Card */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              ROOM CLEANLINESS
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">{cleanliness}%</span>
          </div>

          <div className="h-2 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
              animate={{ width: `${cleanliness}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>

          <p className="text-amber-200/90 text-xs font-medium mt-3 text-center">
            {missedSpawned
              ? '👀 “You missed one.”'
              : 'Sweep your real arm to clear dust off your camera scene!'}
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
            <h3 className="text-xl font-black text-white">
              YOUR REAL ROOM IS NOW 100% VIRTUALLY CLEAN.
            </h3>
            <p className="text-xs text-emerald-200 font-serif italic mt-1">
              {missedSpawned ? '“You missed one.”' : 'Every dust particle swept away.'}
            </p>
            <button
              onClick={handleFinish}
              className="mt-3.5 px-6 py-2 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-transform hover:scale-105 shadow-lg"
            >
              FINISH CLEANING (+10 USELESSNESS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
