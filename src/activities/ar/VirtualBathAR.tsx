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

interface SplashDroplet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export default function VirtualBathAR({ tracking, onComplete, isCompleted }: Props) {
  const [shampooMode, setShampooMode] = useState(false);
  const [shampooLevel, setShampooLevel] = useState(0);
  const [waterActive, setWaterActive] = useState(true);
  const [splashes, setSplashes] = useState<SplashDroplet[]>([]);
  const [foams, setFoams] = useState<Array<{ id: number; relX: number; relY: number; size: number }>>([]);
  const splashIdRef = useRef(0);
  const { incrementStat } = useGameStore();

  const face = tracking.face;
  const hand = tracking.primaryHand;

  // Real head position (anchored to top of forehead / skull)
  const headX = face ? 1 - face.headTop.x : 0.5;
  const headY = face ? face.headTop.y : 0.35;

  // Hand position
  const handX = hand ? 1 - hand.position.x : 0.75;
  const handY = hand ? hand.position.y : 0.65;

  // Water streams & splashes on real head
  useEffect(() => {
    if (!waterActive) return;

    AudioEngine.playWaterDrop();

    // Spawn splash droplets bouncing off real head
    const newSplashes: SplashDroplet[] = Array.from({ length: 4 }).map(() => ({
      id: splashIdRef.current++,
      x: headX + (Math.random() - 0.5) * 0.14,
      y: headY + (Math.random() - 0.5) * 0.04,
      vx: (Math.random() - 0.5) * 0.08,
      vy: Math.random() * 0.06 + 0.02,
      size: 4 + Math.random() * 6,
      alpha: 0.85,
    }));

    setSplashes(prev => [...prev.slice(-25), ...newSplashes]);
  }, [waterActive, headX, headY]);

  // Shampoo application: hand moving near head/hair
  useEffect(() => {
    if (!shampooMode || !hand) return;

    const distToHead = Math.hypot(handX - headX, handY - headY);
    if (distToHead < 0.22 && hand.velocity.speed > 0.04) {
      AudioEngine.playBrushScrub(0.3);
      setShampooLevel(l => Math.min(100, l + 1.2));

      // Add foam to head
      if (Math.random() < 0.4) {
        setFoams(prev => [
          ...prev.slice(-30),
          {
            id: Math.random(),
            relX: (Math.random() - 0.5) * 0.18,
            relY: -0.06 + (Math.random() - 0.5) * 0.06,
            size: 10 + Math.random() * 18,
          },
        ]);
      }
    }
  }, [shampooMode, hand, handX, handY, headX, headY]);

  const handleFinish = () => {
    AudioEngine.playAchievement();
    incrementStat('baths', 1);
    onComplete();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Virtual Shower Head floating directly ABOVE user's real head */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-75 flex flex-col items-center"
        style={{
          left: `${headX * 100}%`,
          top: `${Math.max(0.04, headY - 0.22) * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Metal Pipe */}
        <div
          className="w-4 h-12 rounded-t-md shadow-lg"
          style={{ background: 'linear-gradient(90deg, #94a3b8 0%, #e2e8f0 50%, #64748b 100%)' }}
        />
        {/* Chrome Shower Head Cone */}
        <div
          className="w-28 h-12 rounded-b-[40px] shadow-2xl border border-slate-300 flex items-end justify-center pb-1"
          style={{
            background: 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-slate-700/60" />
            ))}
          </div>
        </div>

        {/* 2. Virtual Water Streams cascading down onto user's real head */}
        {waterActive && (
          <div className="relative w-28 flex justify-around pointer-events-none">
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full opacity-80"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(56,189,248,0.7) 100%)',
                  boxShadow: '0 0 8px rgba(56,189,248,0.6)',
                }}
                animate={{ height: [80, 140, 110] }}
                transition={{ duration: 0.35 + (i % 3) * 0.1, repeat: Infinity }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Water Impact & Splashes off User's Real Head */}
      {waterActive &&
        splashes.map(sp => (
          <motion.div
            key={sp.id}
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 1.4, opacity: 0, y: 15 }}
            transition={{ duration: 0.4 }}
            className="absolute rounded-full pointer-events-none bg-sky-200 border border-white"
            style={{
              left: `${sp.x * 100}%`,
              top: `${sp.y * 100}%`,
              width: sp.size,
              height: sp.size,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 6px rgba(255,255,255,0.8)',
            }}
          />
        ))}

      {/* 4. Foam lather directly over real hair/head */}
      {foams.map(f => (
        <motion.div
          key={f.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute rounded-full bg-white/95 border border-sky-200 shadow-md pointer-events-none"
          style={{
            left: `${(headX + f.relX) * 100}%`,
            top: `${(headY + f.relY) * 100}%`,
            width: f.size,
            height: f.size,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 10px rgba(255,255,255,0.9)',
          }}
        />
      ))}

      {/* 5. Virtual Shampoo Bottle near user's real hand (when Shampoo Mode active) */}
      {shampooMode && (
        <div
          className="absolute pointer-events-none z-30 transition-all duration-75"
          style={{
            left: `${handX * 100}%`,
            top: `${handY * 100}%`,
            transform: 'translate(-50%, -50%) rotate(15deg)',
          }}
        >
          {/* Shampoo Bottle */}
          <div
            className="w-12 h-24 rounded-2xl shadow-2xl border-2 border-emerald-400/50 flex flex-col items-center justify-between p-1.5"
            style={{ background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)' }}
          >
            <div className="w-4 h-3 bg-emerald-200 rounded-t-sm" />
            <span className="text-[10px] font-bold text-white font-mono tracking-wider">
              SHAMPOO
            </span>
            <div className="w-8 h-1 bg-white/40 rounded-full" />
          </div>
        </div>
      )}

      {/* 6. Floating Control Cards & Telemetry */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              VIRTUAL SHOWER
            </span>
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShampooMode(m => !m)}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-between"
              style={{
                background: shampooMode ? '#10b981' : 'rgba(255,255,255,0.08)',
                color: shampooMode ? '#ffffff' : 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <span>🧴 {shampooMode ? 'Shampoo Active' : 'Apply Shampoo'}</span>
              <span className="text-[10px] font-mono">{Math.round(shampooLevel)}%</span>
            </button>

            {shampooMode && (
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${shampooLevel}%` }}
                />
              </div>
            )}

            <button
              onClick={() => setWaterActive(w => !w)}
              className="w-full py-1.5 px-3 rounded-xl text-xs text-white/60 hover:text-white bg-white/5 border border-white/10"
            >
              🚿 {waterActive ? 'Pause Water' : 'Resume Water'}
            </button>
          </div>
        </div>

        {/* Real-time instruction hint */}
        <div className="px-3.5 py-2 rounded-xl glass-card text-xs text-amber-200/90 border border-amber-500/20 text-center font-medium shadow-lg">
          {shampooMode
            ? 'Move hand near your actual hair to lather shampoo!'
            : 'Stand under the shower stream. Move left/right to test tracking!'}
        </div>
      </div>

      {/* Completion Trigger */}
      {(shampooLevel >= 70 || isCompleted) && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-40 text-center">
          <button
            onClick={handleFinish}
            className="btn-primary py-3 px-8 rounded-2xl font-bold text-sm tracking-wide shadow-2xl transition-transform hover:scale-105"
            style={{ background: '#e8a855', color: '#100d0a' }}
          >
            ✓ FINISH VIRTUAL BATH (+10 USELESSNESS)
          </button>
        </div>
      )}
    </div>
  );
}
