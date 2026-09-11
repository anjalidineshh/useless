import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrackingState } from '../../hooks/useHandTracking';
import { AudioEngine } from '../../engine/AudioEngine';
import { useGameStore } from '../../store/gameStore';

interface Props {
  tracking: TrackingState;
  onComplete: () => void;
  isCompleted: boolean;
}

type TeaStep = 'kettle' | 'milk' | 'stir' | 'serve';

export default function TeaMakingAR({ tracking, onComplete, isCompleted }: Props) {
  const [step, setStep] = useState<TeaStep>('kettle');
  const [cupFill, setCupFill] = useState(0);
  const [stirProgress, setStirProgress] = useState(0);
  const [celebrated, setCelebrated] = useState(false);
  const { incrementStat } = useGameStore();

  const hand = tracking.primaryHand;
  const handX = hand ? 1 - hand.position.x : 0.5;
  const handY = hand ? hand.position.y : 0.65;
  const isTilt = Math.abs(hand?.wristAngle || 0) > 22 || (hand?.velocity.vy || 0) > 0.18;
  const isCirc = hand?.isCircular || (hand?.velocity.speed || 0) > 0.06;

  // Real-time gesture reaction
  useEffect(() => {
    if (celebrated || !hand) return;

    if (step === 'kettle' && isTilt) {
      AudioEngine.playSplash(0.6);
      setCupFill(c => {
        const next = c + 4;
        if (next >= 50) {
          AudioEngine.playDing();
          setStep('milk');
        }
        return next;
      });
    } else if (step === 'milk' && isTilt) {
      AudioEngine.playSplash(0.5);
      setCupFill(c => {
        const next = c + 4;
        if (next >= 100) {
          AudioEngine.playDing();
          setStep('stir');
        }
        return next;
      });
    } else if (step === 'stir' && isCirc) {
      AudioEngine.playBrushScrub(0.25);
      setStirProgress(p => {
        const next = p + (hand.velocity.speed || 0.1) * 16;
        if (next >= 100) {
          AudioEngine.playAchievement();
          setCelebrated(true);
          incrementStat('tea', 1);
        }
        return next;
      });
    }
  }, [hand, isTilt, isCirc, step, celebrated, incrementStat]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Kulhad Chai Cup floating in camera scene */}
      <div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center"
      >
        {/* Rising Steam */}
        {cupFill > 20 && (
          <div className="flex gap-2 -mb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-4 h-14 rounded-full bg-white/30 blur-sm"
                animate={{ y: [-5, -60], opacity: [0.6, 0] }}
                transition={{ duration: 1.5 + i * 0.2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        )}

        {/* Terracotta Kulhad */}
        <div
          className="relative w-24 h-32 rounded-[6px_6px_28px_28px] border-2 border-amber-900 shadow-2xl overflow-hidden flex flex-col justify-end"
          style={{
            background: 'linear-gradient(180deg, #c2410c 0%, #9a3412 100%)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Chai Liquid Fill */}
          <motion.div
            className="w-full relative"
            animate={{ height: `${cupFill}%` }}
            style={{
              background:
                step === 'kettle'
                  ? 'linear-gradient(180deg, #78350f 0%, #451a03 100%)' // black tea
                  : 'linear-gradient(180deg, #d97706 0%, #92400e 100%)', // masala milk chai
            }}
          />
        </div>
        <span className="text-[10px] text-amber-300 font-mono mt-1 drop-shadow">KULHAD CHAI</span>
      </div>

      {/* 2. Virtual Kettle / Milk Vessel attached to user's real hand */}
      <div
        className="absolute pointer-events-none z-30 transition-all duration-75"
        style={{
          left: `${handX * 100}%`,
          top: `${handY * 100}%`,
          transform: `translate(-50%, -50%) rotate(${isTilt ? -35 : 0}deg)`,
        }}
      >
        {step === 'kettle' && (
          <div
            className="w-20 h-16 rounded-2xl border-2 border-slate-400 shadow-2xl flex items-center justify-center p-2"
            style={{ background: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)' }}
          >
            <span className="text-2xl">🫖</span>
          </div>
        )}
        {step === 'milk' && (
          <div
            className="w-16 h-20 rounded-xl border-2 border-slate-300 shadow-2xl flex items-center justify-center p-2"
            style={{ background: '#ffffff' }}
          >
            <span className="text-2xl">🥛</span>
          </div>
        )}
        {step === 'stir' && (
          <div
            className="w-3 h-28 rounded-full border border-slate-300 shadow-lg"
            style={{ background: 'linear-gradient(90deg, #e2e8f0 0%, #94a3b8 100%)' }}
          />
        )}
      </div>

      {/* 3. Floating Telemetry Card */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              CHAI BREWING: {step.toUpperCase()}
            </span>
            <span className="font-mono font-bold text-amber-400 text-xs">
              {step === 'stir' ? `${Math.round(stirProgress)}%` : `${Math.round(cupFill)}%`}
            </span>
          </div>

          <p className="text-amber-200/90 text-xs font-medium mt-1">
            {step === 'kettle' && 'Tilt your real hand downward to pour hot tea!'}
            {step === 'milk' && 'Tilt your hand to pour rich fresh milk!'}
            {step === 'stir' && 'Move hand in circles to stir the fragrant masala chai!'}
          </p>
        </div>
      </div>

      {/* 4. Completion Announcement */}
      <AnimatePresence>
        {celebrated && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-40 text-center px-8 py-5 rounded-3xl glass-card border border-emerald-400/50 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(6, 78, 59, 0.88)' }}
          >
            <h3 className="text-2xl font-black text-white">CHAI PERFECTLY BREWED!</h3>
            <p className="text-xs text-emerald-200 font-serif italic mt-1">
              Steaming hot masala chai prepared on your live camera.
            </p>
            <button
              onClick={handleFinish}
              className="mt-3.5 px-6 py-2 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-transform hover:scale-105 shadow-lg"
            >
              FINISH CHAI BREWING (+10 USELESSNESS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
