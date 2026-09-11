import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TrackingState } from '../hooks/useHandTracking';
import { AudioEngine } from '../engine/AudioEngine';
import { useGameStore } from '../store/gameStore';

interface Props {
  tracking: TrackingState;
  onComplete: () => void;
  isCompleted: boolean;
}

interface DustItem {
  id: number;
  x: number;
  y: number;
  type: 'dust' | 'paper' | 'sock' | 'crumb';
  size: number;
  active: boolean;
}

const INITIAL_DUST: DustItem[] = Array.from({ length: 24 }).map((_, i) => ({
  id: i,
  x: 12 + Math.random() * 76,
  y: 18 + Math.random() * 66,
  type: i % 7 === 0 ? 'sock' : i % 4 === 0 ? 'paper' : 'dust',
  size: i % 7 === 0 ? 22 : i % 4 === 0 ? 16 : 8 + Math.random() * 6,
  active: true,
}));

export default function RoomCleaningActivity({ tracking, onComplete, isCompleted }: Props) {
  const [particles, setParticles] = useState<DustItem[]>(INITIAL_DUST);
  const [statusMessage, setStatusMessage] = useState('Swing your hand back and forth to sweep the floor');
  const [missedSpawned, setMissedSpawned] = useState(false);
  const { incrementStat } = useGameStore();

  const hand = tracking.primaryHand;
  const handPos = hand?.position || { x: 0.5, y: 0.5 };

  // Track arm/hand sweeping motion
  useEffect(() => {
    if (!hand) return;

    const speed = hand.velocity.speed;
    const isSweeping = speed > 0.08;

    if (isSweeping) {
      AudioEngine.playSweepWhoosh(speed);

      // Check collision between broom head and dust particles
      const bx = handPos.x * 100;
      const by = handPos.y * 100;

      setParticles(prev =>
        prev.map(p => {
          if (!p.active) return p;
          const dist = Math.hypot(p.x - bx, p.y - by);
          if (dist < 14) {
            return { ...p, active: false };
          }
          return p;
        })
      );
    }
  }, [hand, handPos.x, handPos.y]);

  // Cleanliness percentage
  const activeCount = particles.filter(p => p.active).length;
  const totalCount = particles.length;
  const cleanliness = Math.round(((totalCount - activeCount) / totalCount) * 100);

  // Trigger "ROOM CLEAN" and then "You missed something"
  useEffect(() => {
    if (cleanliness === 100 && !missedSpawned) {
      setStatusMessage('✨ ROOM CLEAN!');
      AudioEngine.playDing();

      const timer = setTimeout(() => {
        setParticles(prev => [
          ...prev,
          {
            id: 9999,
            x: 48,
            y: 52,
            type: 'crumb',
            size: 10,
            active: true,
          },
        ]);
        setMissedSpawned(true);
        setStatusMessage('👀 “You missed something.”');
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [cleanliness, missedSpawned]);

  const handleFinish = () => {
    incrementStat('roomsCleaned', 1);
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="h-full flex flex-col gap-3 relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl md:text-2xl text-white font-bold tracking-wide">
            🧹 Virtual Room Cleaning
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Broom follows hand · Wide arm sweeping motion clears dust & clutter
          </p>
        </div>

        {isCompleted && (
          <span
            className="px-3 py-1 rounded-xl text-xs text-green-400 font-bold flex items-center gap-1"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <span>✓</span>
            <span>COMPLETED</span>
          </span>
        )}
      </div>

      {/* Main Room Floor Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[320px] p-6"
        style={{
          background: 'linear-gradient(180deg, #1c1510 0%, #0d0a08 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.6)',
        }}
      >
        {/* Parquet Wooden Floor Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #e8a855 0, #e8a855 1px, transparent 0, transparent 40px)',
          }}
        />

        {/* Dust, papers & socks on the floor */}
        {particles.map(p => {
          if (!p.active) return null;
          return (
            <motion.div
              key={p.id}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="absolute pointer-events-none flex items-center justify-center"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {p.type === 'sock' && <span className="text-xl">🧦</span>}
              {p.type === 'paper' && <span className="text-lg">📄</span>}
              {p.type === 'crumb' && (
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-bounce shadow-md shadow-amber-400/50" />
              )}
              {p.type === 'dust' && (
                <div
                  className="rounded-full bg-stone-500/80 shadow-sm"
                  style={{ width: p.size, height: p.size }}
                />
              )}
            </motion.div>
          );
        })}

        {/* The Tracked Virtual Broom Follower */}
        <div
          className="absolute z-30 pointer-events-none flex flex-col items-center"
          style={{
            left: `${handPos.x * 100}%`,
            top: `${handPos.y * 100}%`,
            transform: 'translate(-50%, -80%) rotate(15deg)',
            transition: 'left 0.05s linear, top 0.05s linear',
          }}
        >
          {/* Long wooden handle */}
          <div
            className="w-2.5 h-36 rounded-t-full shadow-lg"
            style={{ background: 'linear-gradient(90deg, #b45309 0%, #d97706 50%, #92400e 100%)' }}
          />
          {/* Broom bristles head */}
          <div
            className="w-16 h-12 rounded-[2px_2px_8px_8px] -mt-1 shadow-md flex items-end justify-around px-1"
            style={{
              background: 'linear-gradient(180deg, #ca8a04 0%, #a16207 100%)',
              borderBottom: '3px solid #713f12',
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-0.5 h-5 bg-amber-950/40 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Cleanliness Telemetry HUD */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-white/40 uppercase tracking-widest text-[10px]">
            ROOM CLEANLINESS
          </span>
          <span className="font-mono font-bold text-amber-400 text-sm">{cleanliness}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${cleanliness}%` }}
            transition={{ duration: 0.2 }}
            style={{ background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)' }}
          />
        </div>
        <p className="text-amber-200/80 text-xs mt-2 font-medium">{statusMessage}</p>
      </div>

      {/* Completion button */}
      {(cleanliness >= 90 || missedSpawned) && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
          style={{ background: '#e8a855', color: '#100d0a' }}
        >
          ✓ FINISH CLEANING (+10 USELESSNESS)
        </motion.button>
      )}
    </div>
  );
}
