import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrackingState } from '../hooks/useHandTracking';
import { AudioEngine } from '../engine/AudioEngine';
import { useGameStore } from '../store/gameStore';

interface Props {
  tracking: TrackingState;
  onComplete: () => void;
  isCompleted: boolean;
}

interface Splat {
  id: number;
  x: number;
  y: number;
}

export default function MosquitoSlappingActivity({ tracking, onComplete, isCompleted }: Props) {
  const [mosquitoPos, setMosquitoPos] = useState({ x: 0.5, y: 0.4 });
  const [killed, setKilled] = useState(0);
  const [splats, setSplats] = useState<Splat[]>([]);
  const [slapEffect, setSlapEffect] = useState<{ x: number; y: number } | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const { incrementStat, unlockAchievement } = useGameStore();

  const hand = tracking.primaryHand;
  const handPos = hand?.position || { x: 0.5, y: 0.5 };
  const speedRef = useRef(1.0);

  // Audio: Start and update mosquito buzz based on hand distance
  useEffect(() => {
    AudioEngine.startMosquitoBuzz(speedRef.current);

    return () => {
      AudioEngine.stopMosquitoBuzz();
    };
  }, []);

  // Mosquito Flight AI: Flies in random erratic spurts, and evades hand if approached slowly!
  useEffect(() => {
    const flightInterval = setInterval(() => {
      setMosquitoPos(prev => {
        // Evasion vector: If hand is close, dart away!
        const dx = prev.x - handPos.x;
        const dy = prev.y - handPos.y;
        const dist = Math.hypot(dx, dy);

        let nextX = prev.x + (Math.random() - 0.5) * 0.25;
        let nextY = prev.y + (Math.random() - 0.5) * 0.25;

        // Dodge logic if hand is slowly creeping in
        if (dist < 0.22 && (!hand || hand.velocity.speed < 0.25)) {
          nextX = prev.x + (dx / (dist || 0.01)) * 0.22;
          nextY = prev.y + (dy / (dist || 0.01)) * 0.22;
        }

        // Clamp inside screen bounds
        nextX = Math.max(0.12, Math.min(0.88, nextX));
        nextY = Math.max(0.15, Math.min(0.85, nextY));

        return { x: nextX, y: nextY };
      });
    }, Math.max(250, 700 / speedRef.current));

    return () => clearInterval(flightInterval);
  }, [handPos.x, handPos.y, hand]);

  // Audio update on distance
  useEffect(() => {
    const dist = Math.hypot(mosquitoPos.x - handPos.x, mosquitoPos.y - handPos.y);
    const proximity = Math.max(0, 1 - dist * 2);
    AudioEngine.updateMosquitoBuzz(proximity, hand?.velocity.speed || 0);
  }, [mosquitoPos, handPos, hand]);

  // Collision & Slap Detection
  useEffect(() => {
    if (!hand) return;

    const dist = Math.hypot(handPos.x - mosquitoPos.x, handPos.y - mosquitoPos.y);
    const isRapidSlap = hand.velocity.speed > 0.22 || hand.gesture === 'slap';

    if (dist < 0.14 && isRapidSlap) {
      // SPLAT! Defeated the mosquito
      AudioEngine.playMosquitoSlap();

      const nextKilled = killed + 1;
      setKilled(nextKilled);
      incrementStat('mosquitoes', 1);

      // Add splat decal
      setSplats(s => [...s.slice(-8), { id: Math.random(), x: mosquitoPos.x, y: mosquitoPos.y }]);
      setSlapEffect({ x: handPos.x, y: handPos.y });
      setTimeout(() => setSlapEffect(null), 500);

      // Increase difficulty speed
      speedRef.current = Math.min(2.5, speedRef.current + 0.15);

      // Respawn mosquito elsewhere
      setMosquitoPos({
        x: 0.15 + Math.random() * 0.7,
        y: 0.2 + Math.random() * 0.6,
      });

      // Achievements feedback
      if (nextKilled === 1) showBanner('🩸 FIRST BLOOD');
      else if (nextKilled === 10) showBanner('🎯 MOSQUITO HUNTER');
      else if (nextKilled === 25) showBanner('💀 ABSOLUTE MENACE');
      else if (nextKilled === 50) showBanner('😤 SLEEP DESTROYER');
    }
  }, [hand, handPos.x, handPos.y, mosquitoPos, killed, incrementStat]);

  const showBanner = (text: string) => {
    setAnnouncement(text);
    setTimeout(() => setAnnouncement(null), 3000);
  };

  const handleFinish = () => {
    AudioEngine.stopMosquitoBuzz();
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="h-full flex flex-col gap-3 relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl md:text-2xl text-white font-bold tracking-wide">
            🦟 Virtual Mosquito Slapping
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Rapid hand slap trajectory · Smart evasive AI · Comic splats
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

      {/* Main Bedroom Arena Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[300px] p-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #171322 0%, #090710 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Splat Decals on Wall */}
        {splats.map(sp => (
          <div
            key={sp.id}
            className="absolute pointer-events-none text-2xl opacity-75 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${sp.x * 100}%`, top: `${sp.y * 100}%` }}
          >
            💥
          </div>
        ))}

        {/* The Flying Mosquito */}
        <motion.div
          className="absolute z-20 pointer-events-none flex items-center justify-center text-3xl drop-shadow-md"
          style={{
            left: `${mosquitoPos.x * 100}%`,
            top: `${mosquitoPos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, 4, -4, 0],
            y: [0, -3, 3, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{ duration: 0.15, repeat: Infinity }}
        >
          🦟
        </motion.div>

        {/* Slap Impact Burst */}
        <AnimatePresence>
          {slapEffect && (
            <motion.div
              initial={{ scale: 0.4, opacity: 1 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute z-30 pointer-events-none font-black text-2xl text-amber-300 drop-shadow-lg"
              style={{
                left: `${slapEffect.x * 100}%`,
                top: `${slapEffect.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              🖐️ SPLAT!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Achievement Banner */}
        <AnimatePresence>
          {announcement && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-2xl font-mono font-bold text-sm tracking-wider shadow-2xl"
              style={{ background: '#e8a855', color: '#100d0a' }}
            >
              {announcement}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Kill Counter HUD */}
      <div className="glass-card p-3.5 flex items-center justify-between">
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            TARGETS ELIMINATED
          </p>
          <p className="text-amber-200/90 text-sm font-bold mt-0.5">
            MOSQUITOES DEFEATED: <span className="font-mono text-amber-400 text-base">{killed}</span>
          </p>
        </div>

        <div className="flex gap-2">
          {['FIRST BLOOD', 'HUNTER', 'MENACE'].map(badge => (
            <span
              key={badge}
              className="text-[9px] font-mono px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/40 font-bold"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Completion Button */}
      {killed >= 3 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
          style={{ background: '#e8a855', color: '#100d0a' }}
        >
          ✓ FINISH MOSQUITO SLAPPING (+10 USELESSNESS)
        </motion.button>
      )}
    </div>
  );
}
