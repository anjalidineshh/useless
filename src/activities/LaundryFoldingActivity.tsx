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

type FoldStage = 'spread' | 'left_fold' | 'right_fold' | 'bottom_fold' | 'folded';

export default function LaundryFoldingActivity({ tracking, onComplete, isCompleted }: Props) {
  const [stage, setStage] = useState<FoldStage>('spread');
  const [foldedCount, setFoldedCount] = useState(0);
  const [hint, setHint] = useState('Pinch left sleeve and fold inward to the center');
  const { incrementStat } = useGameStore();

  const hand = tracking.primaryHand;

  useEffect(() => {
    if (!hand || stage === 'folded') return;

    const isPinchOrGrab = hand.gesture === 'pinch' || hand.gesture === 'grab' || hand.pinchDistance < 0.04;
    const isSwiping = Math.abs(hand.velocity.vx) > 0.12 || Math.abs(hand.velocity.vy) > 0.12;

    if (isPinchOrGrab || isSwiping) {
      if (stage === 'spread') {
        // Fold left sleeve
        if (hand.velocity.vx > 0.1 || hand.position.x < 0.45) {
          AudioEngine.playSweepWhoosh(0.4);
          setStage('left_fold');
          setHint('Now fold the right sleeve inward to the center');
        }
      } else if (stage === 'left_fold') {
        // Fold right sleeve
        if (hand.velocity.vx < -0.1 || hand.position.x > 0.55) {
          AudioEngine.playSweepWhoosh(0.4);
          setStage('right_fold');
          setHint('Now swipe upward from the bottom hem to complete the fold');
        }
      } else if (stage === 'right_fold') {
        // Fold bottom up
        if (hand.velocity.vy < -0.1 || hand.gesture === 'swipe_up') {
          AudioEngine.playAchievement();
          setStage('folded');
          setFoldedCount(c => c + 1);
          incrementStat('clothes', 1);
          setHint('✨ Crisp boutique fold achieved! Perfectly neat.');
        }
      }
    }
  }, [hand, stage, incrementStat]);

  const handleNextShirt = () => {
    AudioEngine.playDing();
    setStage('spread');
    setHint('Pinch left sleeve and fold inward to the center');
  };

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
            🧺 Virtual Laundry Folding
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Pinch & grab sleeves · Fold left, right & bottom into boutique stack
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

      {/* Main Folding Table Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center p-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #1e1713 0%, #0c0907 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Modern Wooden Folding Tabletop */}
        <div
          className="relative w-80 h-72 rounded-3xl shadow-2xl flex items-center justify-center border-4 border-amber-900/40"
          style={{
            background: 'linear-gradient(135deg, #451a03 0%, #291102 100%)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)',
          }}
        >
          {/* Origami Cloth Shirt Model */}
          <div className="relative w-56 h-60 flex items-center justify-center">
            {/* Center Body */}
            <motion.div
              className="w-28 h-44 rounded-xl shadow-xl border border-sky-400/30 flex flex-col items-center justify-between py-3"
              style={{ background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)' }}
            >
              <div className="w-12 h-6 border-b-2 border-white/60 rounded-full" />
              <div className="flex flex-col gap-2">
                <div className="w-2 h-2 rounded-full bg-white/80" />
                <div className="w-2 h-2 rounded-full bg-white/80" />
                <div className="w-2 h-2 rounded-full bg-white/80" />
              </div>
            </motion.div>

            {/* Left Sleeve */}
            <motion.div
              className="absolute top-4 left-2 w-14 h-24 rounded-tl-xl shadow-md"
              style={{
                background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                transformOrigin: 'right center',
              }}
              animate={{
                rotateY: stage === 'spread' ? 0 : 180,
                x: stage === 'spread' ? 0 : 36,
              }}
              transition={{ duration: 0.4 }}
            />

            {/* Right Sleeve */}
            <motion.div
              className="absolute top-4 right-2 w-14 h-24 rounded-tr-xl shadow-md"
              style={{
                background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                transformOrigin: 'left center',
              }}
              animate={{
                rotateY: stage === 'spread' || stage === 'left_fold' ? 0 : -180,
                x: stage === 'spread' || stage === 'left_fold' ? 0 : -36,
              }}
              transition={{ duration: 0.4 }}
            />

            {/* Bottom Hem Fold */}
            {stage === 'folded' && (
              <motion.div
                initial={{ scaleY: 1 }}
                animate={{ scaleY: 0.55 }}
                className="absolute inset-0 border-4 border-amber-300 rounded-xl pointer-events-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Folding Guide & HUD */}
      <div className="glass-card p-3.5 flex items-center justify-between">
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            FOLDING STEP: <span className="text-white font-bold">{stage.toUpperCase()}</span>
          </p>
          <p className="text-amber-200/90 text-xs font-medium mt-0.5">{hint}</p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-white/40 uppercase">Folded:</span>
          <span className="font-mono font-bold text-amber-400 text-lg ml-2">{foldedCount}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {stage === 'folded' && (
        <div className="flex gap-2">
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleFinish}
            className="flex-1 btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
            style={{ background: '#e8a855', color: '#100d0a' }}
          >
            ✓ FINISH LAUNDRY (+10 USELESSNESS)
          </motion.button>
          <button
            onClick={handleNextShirt}
            className="px-5 py-3 rounded-2xl text-xs text-white/70 hover:text-white font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Fold Next 👕
          </button>
        </div>
      )}
    </div>
  );
}
