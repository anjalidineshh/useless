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

export default function MosquitoAR({ tracking, onComplete, isCompleted }: Props) {
  const [mosquitoPos, setMosquitoPos] = useState({ x: 0.5, y: 0.35 });
  const [killed, setKilled] = useState(0);
  const [splats, setSplats] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [slapEffect, setSlapEffect] = useState<{ x: number; y: number } | null>(null);
  const speedMultiplier = useRef(1.0);
  const { incrementStat } = useGameStore();

  const face = tracking.face;
  const hand = tracking.primaryHand;

  const handX = hand ? 1 - hand.position.x : 0.5;
  const handY = hand ? hand.position.y : 0.5;

  const faceX = face ? 1 - face.nose.x : 0.5;
  const faceY = face ? face.nose.y : 0.45;

  // Start annoying mosquito buzz audio
  useEffect(() => {
    AudioEngine.startMosquitoBuzz(speedMultiplier.current);
    return () => {
      AudioEngine.stopMosquitoBuzz();
    };
  }, []);

  // Mosquito Flight AI: circles around user's real head and shoulders!
  useEffect(() => {
    const flightTimer = setInterval(() => {
      setMosquitoPos(prev => {
        // Orbit around user's real face/shoulders with erratic jitter
        const targetX = faceX + (Math.random() - 0.5) * 0.45;
        const targetY = faceY + (Math.random() - 0.5) * 0.4;

        // Evasion: if hand is too close, dart away!
        const dx = prev.x - handX;
        const dy = prev.y - handY;
        const distToHand = Math.hypot(dx, dy);

        let nextX = prev.x * 0.7 + targetX * 0.3;
        let nextY = prev.y * 0.7 + targetY * 0.3;

        if (distToHand < 0.22 && (!hand || hand.velocity.speed < 0.24)) {
          nextX += (dx / (distToHand || 0.01)) * 0.18;
          nextY += (dy / (distToHand || 0.01)) * 0.18;
        }

        return {
          x: Math.max(0.1, Math.min(0.9, nextX)),
          y: Math.max(0.12, Math.min(0.88, nextY)),
        };
      });
    }, Math.max(200, 600 / speedMultiplier.current));

    return () => clearInterval(flightTimer);
  }, [faceX, faceY, handX, handY, hand]);

  // Audio pitch update based on proximity to real ear/head
  useEffect(() => {
    const distToHead = Math.hypot(mosquitoPos.x - faceX, mosquitoPos.y - faceY);
    const proximity = Math.max(0, 1 - distToHead * 2);
    AudioEngine.updateMosquitoBuzz(proximity, hand?.velocity.speed || 0);
  }, [mosquitoPos, faceX, faceY, hand]);

  // Slap Detection
  useEffect(() => {
    if (!hand) return;

    const dist = Math.hypot(handX - mosquitoPos.x, handY - mosquitoPos.y);
    const isRapidSlap = hand.velocity.speed > 0.22 || hand.gesture === 'slap';

    if (dist < 0.15 && isRapidSlap) {
      AudioEngine.playMosquitoSlap();

      const nextKilled = killed + 1;
      setKilled(nextKilled);
      incrementStat('mosquitoes', 1);

      // Decal on camera
      setSplats(s => [...s.slice(-6), { id: Math.random(), x: mosquitoPos.x, y: mosquitoPos.y }]);
      setSlapEffect({ x: handX, y: handY });
      setTimeout(() => setSlapEffect(null), 500);

      // Increase speed
      speedMultiplier.current = Math.min(2.4, speedMultiplier.current + 0.18);

      // Respawn near opposite shoulder
      setMosquitoPos({
        x: faceX + (Math.random() > 0.5 ? 0.3 : -0.3),
        y: faceY + (Math.random() - 0.5) * 0.2,
      });
    }
  }, [hand, handX, handY, mosquitoPos, killed, faceX, faceY, incrementStat]);

  const handleFinish = () => {
    AudioEngine.stopMosquitoBuzz();
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Blood Splats Decals on Camera */}
      {splats.map(sp => (
        <div
          key={sp.id}
          className="absolute pointer-events-none text-2xl opacity-80 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-md"
          style={{ left: `${sp.x * 100}%`, top: `${sp.y * 100}%` }}
        >
          💥
        </div>
      ))}

      {/* 2. Flying Mosquito buzzing around user's real face */}
      <motion.div
        className="absolute z-20 pointer-events-none text-3xl select-none"
        style={{
          left: `${mosquitoPos.x * 100}%`,
          top: `${mosquitoPos.y * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          x: [0, 5, -5, 0],
          y: [0, -4, 4, 0],
          rotate: [0, 15, -15, 0],
        }}
        transition={{ duration: 0.12, repeat: Infinity }}
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
            className="absolute z-30 pointer-events-none font-black text-3xl text-amber-300 drop-shadow-2xl"
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

      {/* 3. Floating Telemetry Card */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              MOSQUITOES DEFEATED
            </span>
            <span className="font-mono font-bold text-amber-400 text-lg">{killed}</span>
          </div>

          <p className="text-amber-200/90 text-xs font-medium mt-1">
            The mosquito is buzzing around your face! Slap it fast with your real hand.
          </p>
        </div>
      </div>

      {/* 4. Completion Button */}
      {killed >= 2 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-40 text-center">
          <button
            onClick={handleFinish}
            className="btn-primary py-3 px-8 rounded-2xl font-bold text-sm tracking-wide shadow-2xl transition-transform hover:scale-105"
            style={{ background: '#e8a855', color: '#100d0a' }}
          >
            ✓ FINISH MOSQUITO SLAPPING (+10 USELESSNESS)
          </button>
        </div>
      )}
    </div>
  );
}
