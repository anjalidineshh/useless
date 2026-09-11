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

const DISH_PRESETS = [
  { name: 'Dinner Plate with Marinara & Grease', emoji: '🍽️', color: '#c2410c' },
  { name: 'Curry Pan with Burnt Gravy', emoji: '🍳', color: '#854d0e' },
  { name: 'Coffee Mug with Dried Stains', emoji: '☕', color: '#78350f' },
  { name: 'Soup Bowl with Cheese Crust', emoji: '🥣', color: '#b45309' },
];

export default function DishwashingActivity({ tracking, onComplete, isCompleted }: Props) {
  const [dishIndex, setDishIndex] = useState(0);
  const [dirtPercentage, setDirtPercentage] = useState(100);
  const [dishesWashed, setDishesWashed] = useState(0);
  const [celebration, setCelebration] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { incrementStat } = useGameStore();

  const hand = tracking.primaryHand;
  const handPos = hand?.position || { x: 0.5, y: 0.5 };
  const currentDish = DISH_PRESETS[dishIndex % DISH_PRESETS.length];

  // Initialize dirt canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw greasy dirty layer on circular plate
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 150, 130, 0, Math.PI * 2);
    ctx.fillStyle = currentDish.color;
    ctx.fill();

    // Splotches
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(60 + Math.random() * 180, 60 + Math.random() * 180, 15 + Math.random() * 25, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
    }
    ctx.restore();
    setDirtPercentage(100);
    setCelebration(false);
  }, [dishIndex, currentDish.color]);

  // Scrub with tracked hand
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hand || celebration) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const speed = hand.velocity.speed;
    const isScrubbing = hand.isCircular || speed > 0.06;

    if (isScrubbing) {
      // Map hand position to canvas
      const cx = handPos.x * canvas.width;
      const cy = handPos.y * canvas.height;

      // Erase dirt mask using destination-out
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      AudioEngine.playBrushScrub(speed);
      if (Math.random() < 0.15) {
        AudioEngine.playDishSqueak();
      }

      // Check remaining dirt percentage periodically
      if (Math.random() < 0.25) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let filled = 0;
        const total = imgData.data.length / 4;
        for (let i = 3; i < imgData.data.length; i += 16) {
          if (imgData.data[i] > 20) filled++;
        }
        const pct = Math.round((filled / (total / 4)) * 100);
        setDirtPercentage(pct);

        if (pct <= 12 && !celebration) {
          setCelebration(true);
          AudioEngine.playDishSqueak();
          AudioEngine.playDing();
          setDishesWashed(d => d + 1);
          incrementStat('dishes', 1);

          setTimeout(() => {
            setDishIndex(prev => prev + 1);
          }, 1800);
        }
      }
    }
  }, [hand, handPos.x, handPos.y, celebration, incrementStat]);

  const dirtRemoved = Math.min(100, Math.max(0, 100 - dirtPercentage));

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="h-full flex flex-col gap-3 relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl md:text-2xl text-white font-bold tracking-wide">
            🍽️ Virtual Dishwashing
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Hold a real sponge · Scrub in circular motions · Erase digital grease
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

      {/* Main Plate Sink Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center p-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #171a21 0%, #0a0c10 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Sink Basin Border */}
        <div
          className="relative w-80 h-80 rounded-full flex items-center justify-center shadow-2xl"
          style={{
            background: 'radial-gradient(circle, #f8fafc 0%, #e2e8f0 70%, #cbd5e1 100%)',
            border: '8px solid #94a3b8',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.2), 0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          {/* Ceramic Plate Rim */}
          <div
            className="w-72 h-72 rounded-full border-4 border-slate-300 relative overflow-hidden flex items-center justify-center"
            style={{ background: '#ffffff' }}
          >
            {/* Clean Plate Decorative Rim Line */}
            <div className="absolute inset-4 rounded-full border border-blue-200/50 pointer-events-none" />

            {/* Dirt Layer Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Celebration Announcement */}
        {celebration && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute z-40 px-5 py-2.5 rounded-2xl text-center shadow-2xl font-bold text-sm tracking-wide"
            style={{ background: '#10b981', color: '#ffffff' }}
          >
            ✨ DISH SUCCESSFULLY WASHED!
            <p className="text-xs text-emerald-100 font-normal mt-0.5">Spawning next dirty dish...</p>
          </motion.div>
        )}

        {/* Tracked Virtual Sponge Follower */}
        <div
          className="absolute z-30 pointer-events-none flex items-center justify-center shadow-2xl"
          style={{
            left: `${handPos.x * 100}%`,
            top: `${handPos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.05s linear, top 0.05s linear',
          }}
        >
          {/* Yellow Foam Body with Green Scrub Top */}
          <div
            className="w-16 h-12 rounded-xl overflow-hidden border-2 border-yellow-500 shadow-xl"
            style={{ background: '#facc15' }}
          >
            <div className="h-3 w-full bg-emerald-700 border-b border-emerald-800" />
            <div className="flex justify-around pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-600/30" />
              <span className="w-2 h-2 rounded-full bg-yellow-600/30" />
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-600/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Dirt Progress HUD */}
      <div className="glass-card p-3.5">
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-white/40 uppercase tracking-widest text-[10px]">
            DIRT REMOVED
          </span>
          <span className="font-mono font-bold text-amber-400">{dirtRemoved}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${dirtRemoved}%` }}
            transition={{ duration: 0.15 }}
            style={{ background: 'linear-gradient(90deg, #ef4444 0%, #e8a855 50%, #10b981 100%)' }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/50 mt-2">
          <span>Current: <strong className="text-white">{currentDish.name}</strong></span>
          <span>Washed: <strong className="text-amber-400 font-mono">{dishesWashed}</strong></span>
        </div>
      </div>

      {/* Completion Button */}
      {dishesWashed >= 1 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
          style={{ background: '#e8a855', color: '#100d0a' }}
        >
          ✓ FINISH DISHWASHING (+10 USELESSNESS)
        </motion.button>
      )}
    </div>
  );
}
