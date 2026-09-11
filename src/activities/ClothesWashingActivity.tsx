import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrackingState } from '../hooks/useHandTracking';
import { AudioEngine } from '../engine/AudioEngine';
import { useGameStore } from '../store/gameStore';

interface Props {
  tracking: TrackingState;
  onComplete: () => void;
  isCompleted: boolean;
}

type Step = 'scrub' | 'rinse' | 'wring' | 'done';

export default function ClothesWashingActivity({ tracking, onComplete, isCompleted }: Props) {
  const [step, setStep] = useState<Step>('scrub');
  const [scrubProgress, setScrubProgress] = useState(0);
  const [rinseProgress, setRinseProgress] = useState(0);
  const [wringProgress, setWringProgress] = useState(0);
  const [foamLevel, setFoamLevel] = useState(10);
  const [wringingScale, setWringingScale] = useState(1);
  const { incrementStat } = useGameStore();

  const hand = tracking.primaryHand;

  useEffect(() => {
    if (!hand || step === 'done') return;

    // 1. Scrub step: circular motion or speed > 0.08
    if (step === 'scrub') {
      const isScrubbing = hand.isCircular || hand.velocity.speed > 0.08;
      if (isScrubbing) {
        AudioEngine.playBrushScrub(hand.velocity.speed);
        setFoamLevel(f => Math.min(100, f + 1.5));
        setScrubProgress(prev => {
          const next = prev + hand.velocity.speed * 18;
          if (next >= 100) {
            AudioEngine.playWaterDrop();
            setStep('rinse');
            return 100;
          }
          return next;
        });
      }
    }
    // 2. Rinse step: side to side swipes
    else if (step === 'rinse') {
      if (hand.gesture === 'swipe_left' || hand.gesture === 'swipe_right' || Math.abs(hand.velocity.vx) > 0.15) {
        AudioEngine.playSplash(0.5);
        setFoamLevel(f => Math.max(0, f - 2));
        setRinseProgress(prev => {
          const next = prev + 3.5;
          if (next >= 100) {
            AudioEngine.playDing();
            setStep('wring');
            return 100;
          }
          return next;
        });
      }
    }
    // 3. Wring step: pinch/grab gestures to squeeze out water
    else if (step === 'wring') {
      if (hand.gesture === 'pinch' || hand.gesture === 'grab' || hand.pinchDistance < 0.04) {
        setWringingScale(0.75);
        AudioEngine.playSplash(0.3);
        setWringProgress(prev => {
          const next = prev + 2.5;
          if (next >= 100) {
            AudioEngine.playAchievement();
            setStep('done');
            incrementStat('clothes', 1);
            return 100;
          }
          return next;
        });
      } else {
        setWringingScale(1);
      }
    }
  }, [hand, step, incrementStat]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  const garmentColor =
    step === 'scrub'
      ? `rgb(${Math.round(130 - scrubProgress * 0.4)}, ${Math.round(110 - scrubProgress * 0.2)}, ${Math.round(80 - scrubProgress * 0.1)})`
      : step === 'rinse'
      ? '#cbd5e1'
      : '#f8fafc';

  return (
    <div className="h-full flex flex-col gap-3 relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl md:text-2xl text-white font-bold tracking-wide">
            🫧 Virtual Clothes Washing
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Hand scrubbing lather · Water rinse swipes · Pinch & grab wringing
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

      {/* Main Wash Basin Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center p-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #151820 0%, #0a0c10 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Laundry Tub */}
        <div
          className="relative w-80 h-64 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl border-4 border-slate-700"
          style={{ background: '#1e293b' }}
        >
          {/* Water pool */}
          <div
            className="absolute inset-0 opacity-80"
            style={{ background: 'linear-gradient(180deg, #38bdf8 0%, #0369a1 100%)' }}
          />

          {/* Foam Bubble Clusters */}
          {foamLevel > 15 && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: Math.min(25, Math.floor(foamLevel / 4)) }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white/80 border border-white"
                  style={{
                    width: 14 + (i % 4) * 6,
                    height: 14 + (i % 4) * 6,
                    left: `${15 + (i * 12) % 70}%`,
                    top: `${20 + (i * 18) % 60}%`,
                  }}
                  animate={{ scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 1.5 + (i % 3) * 0.4, repeat: Infinity }}
                />
              ))}
            </div>
          )}

          {/* Virtual Garment T-Shirt */}
          <motion.div
            animate={{
              scaleX: wringingScale,
              rotate: step === 'wring' ? [0, 8, -8, 0] : 0,
            }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-44 h-48 flex flex-col items-center justify-center"
          >
            <div
              className="w-40 h-44 rounded-2xl shadow-xl transition-colors duration-500 relative flex items-center justify-center"
              style={{
                background: garmentColor,
                border: '3px solid rgba(0,0,0,0.15)',
              }}
            >
              <span className="text-4xl opacity-80">👕</span>
              {/* Dirt Stains in Scrub Stage */}
              {step === 'scrub' && (
                <div
                  className="absolute inset-0 rounded-2xl flex items-center justify-center transition-opacity"
                  style={{ opacity: 1 - scrubProgress / 100 }}
                >
                  <div className="w-16 h-12 bg-amber-900/60 rounded-full blur-sm" />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Step Instructions & Progress HUD */}
      <div className="glass-card p-3.5 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs px-2.5 py-0.5 rounded-lg font-bold ${
                step === 'scrub' ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/60'
              }`}
            >
              1. SCRUB
            </span>
            <span
              className={`font-mono text-xs px-2.5 py-0.5 rounded-lg font-bold ${
                step === 'rinse' ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/60'
              }`}
            >
              2. RINSE
            </span>
            <span
              className={`font-mono text-xs px-2.5 py-0.5 rounded-lg font-bold ${
                step === 'wring' ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/60'
              }`}
            >
              3. WRING
            </span>
          </div>

          <span className="font-mono font-bold text-amber-400">
            {step === 'scrub'
              ? `${Math.round(scrubProgress)}%`
              : step === 'rinse'
              ? `${Math.round(rinseProgress)}%`
              : `${Math.round(wringProgress)}%`}
          </span>
        </div>

        <p className="text-amber-200/90 text-xs font-medium">
          {step === 'scrub' && '🌀 Move hand in circles to lather detergent and scrub dirt'}
          {step === 'rinse' && '🌊 Swipe hands left and right across water to wash away soap'}
          {step === 'wring' && '🤏 Pinch and grab tightly to wring the garment dry'}
          {step === 'done' && '✨ T-shirt freshly laundered, fragrant, and spotless!'}
        </p>
      </div>

      {/* Completion Button */}
      {step === 'done' && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
          style={{ background: '#e8a855', color: '#100d0a' }}
        >
          ✓ FINISH CLOTHES WASHING (+10 USELESSNESS)
        </motion.button>
      )}
    </div>
  );
}
