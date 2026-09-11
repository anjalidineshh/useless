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

type Stage = 'DRY' | 'WET' | 'SHAMPOO' | 'FOAM' | 'CLEAN';
const STAGES: Stage[] = ['DRY', 'WET', 'SHAMPOO', 'FOAM', 'CLEAN'];

export default function HairWashingActivity({ tracking, onComplete, isCompleted }: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const [funHint, setFunHint] = useState('Massage your hands in circular motions near your head');
  const { incrementStat } = useGameStore();

  const currentStage = STAGES[stageIndex];
  const hand = tracking.primaryHand;

  useEffect(() => {
    if (!hand || stageIndex >= STAGES.length - 1) return;

    // Movement near head (upper half y < 0.6)
    const isNearHead = hand.position.y < 0.65;
    const isCircOrScrub = hand.isCircular || hand.velocity.speed > 0.08;

    if (isNearHead && isCircOrScrub) {
      AudioEngine.playBrushScrub(hand.velocity.speed);

      // Spawn lather bubbles
      if (Math.random() < 0.35) {
        setBubbles(b => [
          ...b.slice(-30),
          {
            id: Math.random(),
            x: 35 + Math.random() * 30,
            y: 25 + Math.random() * 25,
            size: 8 + Math.random() * 16,
          },
        ]);
      }

      setStageProgress(prev => {
        const next = prev + 1.2;
        if (next >= 100) {
          AudioEngine.playWaterDrop();
          setStageIndex(s => Math.min(STAGES.length - 1, s + 1));
          return 0;
        }
        return next;
      });
    }
  }, [hand, stageIndex]);

  useEffect(() => {
    switch (currentStage) {
      case 'DRY':
        setFunHint('Wet your hair! Wave hands across the top of your head.');
        break;
      case 'WET':
        setFunHint('Pinch/grab to apply shampoo, then massage your scalp.');
        break;
      case 'SHAMPOO':
        setFunHint('Scrub in circles! Watch the rich bubbly foam multiply.');
        break;
      case 'FOAM':
        setFunHint('Rinse out the lather! Sweep hands over your head.');
        break;
      case 'CLEAN':
        setFunHint('✨ Hair fully washed and squeaky clean!');
        break;
    }
  }, [currentStage]);

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
            💆 Virtual Hair Washing
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Circular hand motions near head · Progress: DRY → WET → SHAMPOO → FOAM → CLEAN
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

      {/* Main Avatar Head Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center p-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #1c1412 0%, #090605 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Animated Head Silhouette */}
        <div className="relative flex flex-col items-center">
          {/* Hair Mound with visual changes */}
          <motion.div
            className="relative w-48 h-36 rounded-t-full shadow-2xl transition-colors duration-500 overflow-hidden flex items-center justify-center"
            style={{
              background:
                currentStage === 'DRY'
                  ? 'linear-gradient(180deg, #451a03 0%, #291102 100%)'
                  : currentStage === 'WET'
                  ? 'linear-gradient(180deg, #1c1917 0%, #0c0a09 100%)'
                  : currentStage === 'SHAMPOO'
                  ? 'linear-gradient(180deg, #0ea5e9 0%, #0369a1 100%)'
                  : currentStage === 'FOAM'
                  ? 'linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%)'
                  : 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
            }}
          >
            {/* Water Drops Running Down */}
            {(currentStage === 'WET' || currentStage === 'FOAM') && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-4 bg-sky-300/80 rounded-full"
                    style={{ left: `${20 + i * 15}%` }}
                    animate={{ y: [0, 100], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            )}

            {/* Bubble Foam Overlay */}
            {bubbles.map(b => (
              <motion.div
                key={b.id}
                className="absolute rounded-full bg-white/85 border border-white shadow"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: b.size,
                  height: b.size,
                }}
                animate={{ scale: [0.8, 1.1, 0.9] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            ))}
          </motion.div>

          {/* Face */}
          <div
            className="w-36 h-36 rounded-b-[48px] shadow-lg -mt-4"
            style={{
              background: 'linear-gradient(180deg, #fed7aa 0%, #fdba74 100%)',
            }}
          >
            {/* Eyes closed enjoying shampoo */}
            <div className="flex justify-around pt-10 px-6">
              <div className="w-5 h-2 border-b-2 border-amber-900 rounded-full" />
              <div className="w-5 h-2 border-b-2 border-amber-900 rounded-full" />
            </div>
            {/* Relaxed smile */}
            <div className="flex justify-center pt-5">
              <div className="w-8 h-4 border-b-2 border-amber-900 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stage Progression Hierarchy */}
      <div className="glass-card p-3.5">
        <div className="flex justify-between items-center text-xs mb-2">
          {STAGES.map((s, idx) => {
            const isDone = idx < stageIndex;
            const isCurrent = idx === stageIndex;
            return (
              <div key={s} className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold transition-all ${
                    isCurrent
                      ? 'bg-amber-400 text-black shadow-sm'
                      : isDone
                      ? 'text-green-400'
                      : 'text-white/30'
                  }`}
                >
                  {s}
                </span>
                {idx < STAGES.length - 1 && <span className="text-white/20 text-[10px]">→</span>}
              </div>
            );
          })}
        </div>

        {/* Current Step Progress */}
        {currentStage !== 'CLEAN' && (
          <div className="h-2 rounded-full overflow-hidden bg-white/10 mt-1">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-amber-400"
              animate={{ width: `${stageProgress}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        )}

        <p className="text-amber-200/80 text-xs font-medium mt-2">{funHint}</p>
      </div>

      {/* Completion button */}
      {currentStage === 'CLEAN' && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
          style={{ background: '#e8a855', color: '#100d0a' }}
        >
          ✓ FINISH HAIR WASH (+10 USELESSNESS)
        </motion.button>
      )}
    </div>
  );
}
