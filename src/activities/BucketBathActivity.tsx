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

export default function BucketBathActivity({ tracking, onComplete, isCompleted }: Props) {
  const [bucketLevel, setBucketLevel] = useState(100);
  const [mugLevel, setMugLevel] = useState(0); // 0 to 100
  const [totalPours, setTotalPours] = useState(0);
  const [isPouring, setIsPouring] = useState(false);
  const [funMessage, setFunMessage] = useState('Scoop water from bucket, lift & tilt to pour');
  const { incrementStat } = useGameStore();

  const hand = tracking.primaryHand;
  const handPos = hand?.position || { x: 0.5, y: 0.5 };
  const wristAngle = hand?.wristAngle || 0;

  useEffect(() => {
    if (!hand) return;

    // Detect Scoop: Hand lowers into bucket region (center-bottom, y > 0.55) while mug is empty
    if (handPos.y > 0.55 && handPos.x > 0.35 && handPos.x < 0.65 && mugLevel === 0 && bucketLevel >= 10) {
      setMugLevel(100);
      setBucketLevel(prev => Math.max(0, prev - 12));
      AudioEngine.playWaterDrop();
      setFunMessage('Mug full! Lift up and tilt your wrist downward to pour.');
    }

    // Detect Pour: Mug has water, hand is raised (y < 0.5), and either wrist angle is tilted (> 30 deg) or sudden downward velocity (> 0.25)
    const tilted = Math.abs(wristAngle) > 28 || hand.velocity.vy > 0.28 || hand.gesture === 'swipe_down';
    if (mugLevel > 0 && handPos.y < 0.52 && tilted) {
      setIsPouring(true);
      setMugLevel(0);
      setTotalPours(p => p + 1);
      AudioEngine.playSplash(0.8);

      const cheers = [
        'Refreshing splash! 🌊',
        'Splendid Indian bathroom technique! 🪣',
        'Pure nostalgia. Zero hot water wasted.',
        'Mug balance mastery achieved! ✨',
      ];
      setFunMessage(cheers[Math.floor(Math.random() * cheers.length)]);

      setTimeout(() => setIsPouring(false), 600);
    }
  }, [hand, handPos.x, handPos.y, mugLevel, bucketLevel, wristAngle]);

  const handleFinish = () => {
    incrementStat('baths', 1);
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="h-full flex flex-col gap-3 relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl md:text-2xl text-white font-bold tracking-wide">
            🪣 Virtual Bucket Bath
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Grab mug with hand · Scoop from bucket · Tilt wrist to pour
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

      {/* Main Bathroom Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[320px] flex items-center justify-center p-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #15110d 0%, #0a0705 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Bathroom tiled wall backdrop hint */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #e8a855 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Central Bucket */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          {/* Bucket Plastic Handle Arch */}
          <div
            className="w-48 h-20 -mb-8 rounded-t-full border-4 border-amber-500/40 pointer-events-none"
          />

          {/* Bucket Cylinder */}
          <div
            className="relative w-44 h-48 rounded-[6px_6px_28px_28px] overflow-hidden shadow-2xl border-2 border-amber-600/40"
            style={{
              background: 'linear-gradient(180deg, #c2410c 0%, #9a3412 70%, #7c2d12 100%)',
              boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
            }}
          >
            {/* Water Inside Bucket */}
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              animate={{ height: `${bucketLevel}%` }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.4)',
              }}
            >
              <div
                className="w-full h-2.5 opacity-60"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.8), transparent)' }}
              />
            </motion.div>

            {/* Bucket Level Label on Bucket Face */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white/80 font-mono font-black text-sm tracking-wider drop-shadow">
                {bucketLevel}%
              </span>
            </div>
          </div>
        </div>

        {/* Water Stream Pour Animation */}
        {isPouring && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 160, opacity: 0.9 }}
            exit={{ opacity: 0 }}
            className="absolute z-20 pointer-events-none rounded-full"
            style={{
              left: `${handPos.x * 100}%`,
              top: `${handPos.y * 100}%`,
              width: 14,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(56,189,248,0.85) 100%)',
              boxShadow: '0 0 16px rgba(56,189,248,0.6)',
            }}
          />
        )}

        {/* The Tracked Virtual Mug Follower */}
        <motion.div
          className="absolute z-30 pointer-events-none flex items-center justify-center"
          style={{
            left: `${handPos.x * 100}%`,
            top: `${handPos.y * 100}%`,
            transform: `translate(-50%, -50%) rotate(${Math.max(-45, Math.min(45, wristAngle))}deg)`,
            transition: 'transform 0.08s ease-out',
          }}
        >
          {/* Mug body */}
          <div
            className="relative w-14 h-16 rounded-[4px_4px_12px_12px] border-2 border-blue-400 overflow-hidden shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            }}
          >
            {/* Water inside mug */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-200"
              style={{
                height: `${mugLevel}%`,
                background: 'linear-gradient(180deg, #67e8f9 0%, #06b6d4 100%)',
              }}
            />
          </div>

          {/* Mug Handle */}
          <div
            className="w-4 h-8 -ml-1 rounded-r-lg border-2 border-l-0 border-blue-400"
            style={{ background: 'transparent' }}
          />
        </motion.div>
      </div>

      {/* Telemetry & Stats Pill */}
      <div className="glass-card p-3.5 flex items-center justify-between">
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            BUCKET LEVEL: <span className="text-white font-bold">{bucketLevel}%</span>
          </p>
          <p className="text-amber-200/90 text-xs font-medium mt-0.5">{funMessage}</p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-white/40 uppercase">Pours:</span>
          <span className="font-mono font-bold text-amber-400 text-lg ml-2">{totalPours}</span>
        </div>
      </div>

      {/* Completion Button */}
      {totalPours >= 4 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
          style={{ background: '#e8a855', color: '#100d0a' }}
        >
          ✓ FINISH BUCKET BATH (+10 USELESSNESS)
        </motion.button>
      )}
    </div>
  );
}
