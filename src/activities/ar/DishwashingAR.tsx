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

export default function DishwashingAR({ tracking, onComplete, isCompleted }: Props) {
  const [cleanliness, setCleanliness] = useState(0);
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [celebrated, setCelebrated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { incrementStat } = useGameStore();

  const hands = tracking.hands;
  const primaryHand = tracking.primaryHand;

  // Real hand holding the plate
  const plateHand = hands.length >= 2 ? hands[0] : primaryHand;
  const scrubHand = hands.length >= 2 ? hands[1] : primaryHand;

  const plateX = plateHand ? 1 - plateHand.position.x : 0.5;
  const plateY = plateHand ? plateHand.position.y : 0.65;

  const scrubX = scrubHand ? 1 - scrubHand.position.x : 0.5;
  const scrubY = scrubHand ? scrubHand.position.y : 0.65;

  // Initialize dirty plate canvas mask
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw thick grease & marinara stains on transparent circular canvas
    ctx.save();
    ctx.beginPath();
    ctx.arc(110, 110, 95, 0, Math.PI * 2);
    ctx.fillStyle = '#b45309'; // grease brown
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(60 + Math.random() * 100, 60 + Math.random() * 100, 18 + Math.random() * 20, 0, Math.PI * 2);
      ctx.fillStyle = '#7c2d12';
      ctx.fill();
    }
    ctx.restore();
    setCleanliness(0);
  }, []);

  // Scrubbing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scrubHand || celebrated) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dist = Math.hypot(scrubX - plateX, scrubY - plateY);
    const speed = scrubHand.velocity.speed;
    const isScrubbing = (dist < 0.18 || hands.length === 1) && (scrubHand.isCircular || speed > 0.05);

    if (isScrubbing) {
      // Erase grease from canvas
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(110 + (Math.random() - 0.5) * 80, 110 + (Math.random() - 0.5) * 80, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      AudioEngine.playBrushScrub(speed);
      if (Math.random() < 0.12) {
        AudioEngine.playDishSqueak();
      }

      setCleanliness(prev => {
        const next = Math.min(100, prev + speed * 15);
        if (next >= 100 && !celebrated) {
          setCelebrated(true);
          AudioEngine.playDishSqueak();
          AudioEngine.playAchievement();
          incrementStat('dishes', 1);
        }
        return next;
      });

      if (Math.random() < 0.35) {
        setBubbles(b => [
          ...b.slice(-20),
          { id: Math.random(), x: scrubX + (Math.random() - 0.5) * 0.08, y: scrubY + (Math.random() - 0.5) * 0.08 },
        ]);
      }
    }
  }, [scrubHand, scrubX, scrubY, plateX, plateY, hands.length, celebrated, incrementStat]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. AR Plate anchored directly in user's real hand */}
      <div
        className="absolute pointer-events-none z-20 transition-all duration-75 flex items-center justify-center shadow-2xl"
        style={{
          left: `${plateX * 100}%`,
          top: `${plateY * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Ceramic Plate Body */}
        <div
          className="relative w-56 h-56 rounded-full border-4 border-slate-200 shadow-2xl flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, #ffffff 0%, #f1f5f9 85%, #cbd5e1 100%)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
          }}
        >
          {/* Inner ring */}
          <div className="absolute inset-3 rounded-full border border-sky-300/40" />

          {/* Grease layer canvas overlay */}
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        </div>
      </div>

      {/* 2. Virtual Sponge on user's scrubbing hand */}
      <div
        className="absolute pointer-events-none z-30 transition-all duration-75"
        style={{
          left: `${scrubX * 100}%`,
          top: `${scrubY * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="w-14 h-10 rounded-xl overflow-hidden border-2 border-yellow-500 shadow-xl"
          style={{ background: '#facc15' }}
        >
          <div className="h-2.5 w-full bg-emerald-700" />
        </div>
      </div>

      {/* Bubbles on plate */}
      {bubbles.map(b => (
        <motion.div
          key={b.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute rounded-full bg-white/85 border border-white shadow-md pointer-events-none"
          style={{
            left: `${b.x * 100}%`,
            top: `${b.y * 100}%`,
            width: 12,
            height: 12,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* 3. Floating Telemetry Card */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              PLATE CLEANLINESS
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {Math.round(cleanliness)}%
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
              animate={{ width: `${cleanliness}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>

          <p className="text-amber-200/90 text-xs font-medium mt-3 text-center">
            Hold your hand up to hold the plate · Scrub in circles with your real hand!
          </p>
        </div>
      </div>

      {/* 4. Completion Banner */}
      <AnimatePresence>
        {celebrated && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-40 text-center px-8 py-5 rounded-3xl glass-card border border-emerald-400/50 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(6, 78, 59, 0.88)' }}
          >
            <h3 className="text-2xl font-black text-white">PLATE SQUEAKY CLEAN!</h3>
            <p className="text-xs text-emerald-200 font-serif italic mt-1">
              You digitally washed a plate in the palm of your actual hand.
            </p>
            <button
              onClick={handleFinish}
              className="mt-3.5 px-6 py-2 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-transform hover:scale-105 shadow-lg"
            >
              FINISH DISHWASHING (+10 USELESSNESS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
