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

const CHAI_STEPS = [
  { id: 'water', label: 'Pour Water', hint: 'Tilt wrist downward to pour water into the pan' },
  { id: 'stove', label: 'Light Stove', hint: 'Pinch & turn stove dial clockwise' },
  { id: 'tea', label: 'Add Chai Patti', hint: 'Pinch tea leaves and drop into the boiling water' },
  { id: 'ginger', label: 'Crush Ginger & Elaichi', hint: 'Pinch/grab fresh ginger & cardamom' },
  { id: 'milk', label: 'Pour Fresh Milk', hint: 'Tilt milk pot to pour milk (careful, don’t make soup!)' },
  { id: 'sugar', label: 'Add Sugar', hint: 'Pinch sugar cubes and drop into chai' },
  { id: 'stir', label: 'Stir Chai', hint: 'Move hand in circles to stir the fragrant concoction' },
  { id: 'boil', label: 'Simmer & Boil', hint: 'Watch the rich amber chai foam rise to the brim!' },
  { id: 'pour_cup', label: 'Pour into Kulhad Cup', hint: 'Tilt pan downward to serve the steaming chai' },
];

export default function TeaMakingActivity({ tracking, onComplete, isCompleted }: Props) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [milkAmount, setMilkAmount] = useState(0);
  const [stirCount, setStirCount] = useState(0);
  const [boilProgress, setBoilProgress] = useState(0);
  const [boiledOver, setBoiledOver] = useState(false);
  const [teaSoup, setTeaSoup] = useState(false);
  const [cupFill, setCupFill] = useState(0);
  const [done, setDone] = useState(false);
  const { incrementStat } = useGameStore();

  const hand = tracking.primaryHand;
  const currentStep = CHAI_STEPS[currentStepIdx];

  // Gestures mapping
  useEffect(() => {
    if (!hand || done || boiledOver || teaSoup) return;

    const isPinch = hand.gesture === 'pinch' || hand.pinchDistance < 0.04;
    const isTilt = Math.abs(hand.wristAngle) > 25 || hand.velocity.vy > 0.22;
    const isCirc = hand.isCircular || hand.velocity.speed > 0.07;

    // Step 0: Water pour
    if (currentStepIdx === 0 && isTilt) {
      AudioEngine.playSplash(0.7);
      advanceStep();
    }
    // Step 1: Stove light
    else if (currentStepIdx === 1 && (isPinch || hand.isCircular)) {
      AudioEngine.playWaterDrop();
      advanceStep();
    }
    // Step 2: Tea patti
    else if (currentStepIdx === 2 && isPinch) {
      AudioEngine.playDing();
      advanceStep();
    }
    // Step 3: Ginger & Cardamom
    else if (currentStepIdx === 3 && (isPinch || hand.gesture === 'grab')) {
      AudioEngine.playDing();
      advanceStep();
    }
    // Step 4: Milk pour
    else if (currentStepIdx === 4 && isTilt) {
      AudioEngine.playSplash(0.6);
      setMilkAmount(prev => {
        const next = prev + 35;
        if (next > 110) {
          setTeaSoup(true);
        } else if (next >= 70) {
          advanceStep();
        }
        return next;
      });
    }
    // Step 5: Sugar
    else if (currentStepIdx === 5 && isPinch) {
      AudioEngine.playDing();
      advanceStep();
    }
    // Step 6: Stir
    else if (currentStepIdx === 6 && isCirc) {
      AudioEngine.playBrushScrub(0.3);
      setStirCount(s => {
        const next = s + 1;
        if (next > 22) {
          advanceStep();
        }
        return next;
      });
    }
    // Step 7: Boil
    else if (currentStepIdx === 7) {
      AudioEngine.startBoilSound();
      const interval = setInterval(() => {
        setBoilProgress(b => {
          const next = b + 4;
          if (next > 95) {
            AudioEngine.stopBoilSound();
            advanceStep();
          }
          return next;
        });
      }, 100);
      return () => {
        clearInterval(interval);
        AudioEngine.stopBoilSound();
      };
    }
    // Step 8: Pour into Kulhad
    else if (currentStepIdx === 8 && isTilt) {
      AudioEngine.playSplash(0.4);
      setCupFill(c => {
        const next = c + 15;
        if (next >= 100) {
          AudioEngine.playAchievement();
          setDone(true);
          incrementStat('tea', 1);
        }
        return next;
      });
    }
  }, [hand, currentStepIdx, done, boiledOver, teaSoup, incrementStat]);

  const advanceStep = () => {
    setCurrentStepIdx(prev => Math.min(CHAI_STEPS.length - 1, prev + 1));
  };

  const handleReset = () => {
    setCurrentStepIdx(0);
    setMilkAmount(0);
    setStirCount(0);
    setBoilProgress(0);
    setBoiledOver(false);
    setTeaSoup(false);
    setCupFill(0);
    setDone(false);
    AudioEngine.stopBoilSound();
  };

  const handleFinish = () => {
    AudioEngine.stopBoilSound();
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="h-full flex flex-col gap-3 relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl md:text-2xl text-white font-bold tracking-wide">
            ☕ Virtual Tea Making (Indian Chai)
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Pinch spices · Tilt milk vessel · Circular spoon stirring · Kulhad pour
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

      {/* Main Kitchen Stove Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center p-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #20150d 0%, #0c0805 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Steam Animation */}
        {currentStepIdx >= 2 && !done && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-10 h-10 rounded-full bg-white/20 blur-md absolute"
                animate={{ y: [-10, -80], opacity: [0, 0.4, 0] }}
                transition={{ duration: 1.8 + i * 0.2, repeat: Infinity, delay: i * 0.25 }}
              />
            ))}
          </div>
        )}

        {/* Chai Pan on Gas Burner */}
        <div className="relative flex flex-col items-center">
          {/* Chai Pot Body */}
          <div
            className="relative w-48 h-36 rounded-[12px_12px_40px_40px] overflow-hidden shadow-2xl border-4 border-amber-900/50 flex flex-col justify-end"
            style={{
              background: 'linear-gradient(180deg, #52525b 0%, #27272a 100%)',
              boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
            }}
          >
            {/* Boiling Tea Liquid */}
            <motion.div
              className="w-full relative overflow-hidden"
              animate={{
                height: currentStepIdx === 0 ? '0%' : currentStepIdx === 7 ? `${50 + boilProgress * 0.4}%` : '55%',
              }}
              style={{
                background:
                  currentStepIdx < 4
                    ? 'linear-gradient(180deg, #78350f 0%, #451a03 100%)' // Black tea
                    : 'linear-gradient(180deg, #d97706 0%, #92400e 100%)', // Rich masala milk tea
              }}
            >
              {/* Boiling Foam Bubbles */}
              {currentStepIdx >= 7 && (
                <div className="absolute inset-0 flex justify-around items-center opacity-75">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full bg-amber-200/60 animate-bounce"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Gas Burner Flame */}
          {currentStepIdx >= 1 && (
            <div className="flex gap-1.5 mt-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-4 rounded-full bg-sky-400 shadow-sm shadow-blue-500"
                  animate={{ scaleY: [0.8, 1.2, 0.9] }}
                  transition={{ duration: 0.3 + (i % 3) * 0.1, repeat: Infinity }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Kulhad Earthen Cup to the side */}
        <div className="absolute bottom-8 right-12 flex flex-col items-center">
          <div
            className="w-16 h-20 rounded-[4px_4px_16px_16px] border-2 border-amber-800 shadow-xl overflow-hidden flex flex-col justify-end"
            style={{ background: '#b45309' }}
          >
            <motion.div
              className="w-full bg-amber-600"
              animate={{ height: `${cupFill}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <span className="text-[10px] text-amber-300 font-mono mt-1">KULHAD</span>
        </div>

        {/* Warnings / Disasters */}
        {teaSoup && (
          <div className="absolute z-40 px-6 py-3 rounded-2xl bg-red-950/90 border border-red-500 text-center">
            <h4 className="text-red-300 font-bold text-sm">“You have invented tea soup.”</h4>
            <p className="text-white/50 text-xs mt-0.5">Too much milk poured!</p>
            <button
              onClick={handleReset}
              className="mt-2 px-3 py-1 rounded-lg bg-red-800 text-white text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Step Guide & HUD */}
      <div className="glass-card p-3.5 flex items-center justify-between">
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            STEP {currentStepIdx + 1} OF {CHAI_STEPS.length}:{' '}
            <span className="text-amber-400 font-bold">{currentStep.label.toUpperCase()}</span>
          </p>
          <p className="text-amber-200/90 text-xs font-medium mt-0.5">{currentStep.hint}</p>
        </div>

        {currentStepIdx === 6 && (
          <div className="text-right">
            <span className="text-[10px] text-white/40 uppercase">Stirs:</span>
            <span className="font-mono font-bold text-amber-400 text-sm ml-1.5">{stirCount}/20</span>
          </div>
        )}
      </div>

      {/* Completion Button */}
      {done && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
          style={{ background: '#e8a855', color: '#100d0a' }}
        >
          ✓ FINISH CHAI BREWING (+10 USELESSNESS)
        </motion.button>
      )}
    </div>
  );
}
