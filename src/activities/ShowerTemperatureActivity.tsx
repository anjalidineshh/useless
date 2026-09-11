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

export default function ShowerTemperatureActivity({ tracking, onComplete, isCompleted }: Props) {
  const [coldValve, setColdValve] = useState(50); // 0-100
  const [hotValve, setHotValve] = useState(50); // 0-100
  const [holdTime, setHoldTime] = useState(0); // seconds held in sweet spot
  const [achieved, setAchieved] = useState(false);
  const { incrementStat, unlockAchievement } = useGameStore();

  const hands = tracking.hands;
  const primaryHand = tracking.primaryHand;

  // Temperature formula: Cold brings it down to 10°C, Hot brings it up to 65°C
  const calculatedTemp = 10 + (hotValve / 100) * 45 - (coldValve / 100) * 20;
  const isSweetSpot = calculatedTemp >= 37.8 && calculatedTemp <= 39.2; // 38.5°C golden range

  useEffect(() => {
    if (achieved) return;

    if (hands.length >= 2) {
      // Hand on left controls cold, hand on right controls hot
      const leftH = hands.find(h => h.position.x < 0.5) || hands[0];
      const rightH = hands.find(h => h.position.x >= 0.5) || hands[1];
      setColdValve((1 - leftH.position.y) * 100);
      setHotValve((1 - rightH.position.y) * 100);
    } else if (primaryHand) {
      // Single hand: x position decides valve, y position decides value
      if (primaryHand.position.x < 0.5) {
        setColdValve((1 - primaryHand.position.y) * 100);
      } else {
        setHotValve((1 - primaryHand.position.y) * 100);
      }
    }
  }, [hands, primaryHand, achieved]);

  // Track hold duration in the tiny golden sweet spot
  useEffect(() => {
    if (achieved) return;

    let timer: number;
    if (isSweetSpot) {
      timer = window.setInterval(() => {
        setHoldTime(h => {
          const next = h + 0.1;
          if (next >= 2.5) {
            setAchieved(true);
            AudioEngine.playAchievement();
            unlockAchievement('shower_enlightenment');
            incrementStat('baths', 1);
            return 2.5;
          }
          return next;
        });
      }, 100);
    } else {
      setHoldTime(0);
    }

    return () => clearInterval(timer);
  }, [isSweetSpot, achieved, incrementStat, unlockAchievement]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  const tempColor =
    calculatedTemp > 50
      ? '#ef4444'
      : calculatedTemp < 25
      ? '#38bdf8'
      : isSweetSpot
      ? '#22c55e'
      : '#f59e0b';

  return (
    <div className="h-full flex flex-col gap-3 relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl md:text-2xl text-white font-bold tracking-wide">
            🌡️ Virtual Shower Temperature
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Left hand = COLD valve · Right hand = HOT valve · Balance to find 38.5°C
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

      {/* Main Thermal Visualization Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center p-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #161822 0%, #0a0b10 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Steam or Ice aura effect */}
        {calculatedTemp > 45 && (
          <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[2px] pointer-events-none" />
        )}
        {calculatedTemp < 22 && (
          <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[2px] pointer-events-none" />
        )}

        {/* Dual Valve Knobs Display */}
        <div className="flex justify-between w-full max-w-md items-center px-6 z-10">
          {/* Cold Valve Column */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-cyan-400 text-xs font-mono font-bold">COLD VALVE</span>
            <div className="w-8 h-48 rounded-full bg-black/40 border border-cyan-500/30 overflow-hidden relative flex flex-col justify-end">
              <motion.div
                className="w-full bg-cyan-400 rounded-full"
                animate={{ height: `${coldValve}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="font-mono text-xs text-cyan-300">{Math.round(coldValve)}%</span>
          </div>

          {/* Central Shower Head & Temperature Dial */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex flex-col items-center">
              {/* Shower head cone */}
              <div
                className="w-24 h-10 rounded-t-full border-2 border-slate-400 flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)' }}
              />
              {/* Water spray streams */}
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full"
                    style={{ background: tempColor }}
                    animate={{ height: [15, 45, 25] }}
                    transition={{ duration: 0.5 + i * 0.05, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>

            {/* Glowing Big Temperature Meter */}
            <div
              className="px-6 py-3 rounded-2xl border text-center shadow-xl backdrop-blur-md"
              style={{
                background: 'rgba(15, 12, 10, 0.85)',
                borderColor: isSweetSpot ? '#22c55e' : 'rgba(255,255,255,0.15)',
                boxShadow: isSweetSpot ? '0 0 30px rgba(34,197,94,0.4)' : 'none',
              }}
            >
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono block">
                WATER TEMP
              </span>
              <span className="font-mono text-3xl font-black" style={{ color: tempColor }}>
                {calculatedTemp.toFixed(1)}°C
              </span>
            </div>
          </div>

          {/* Hot Valve Column */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-red-400 text-xs font-mono font-bold">HOT VALVE</span>
            <div className="w-8 h-48 rounded-full bg-black/40 border border-red-500/30 overflow-hidden relative flex flex-col justify-end">
              <motion.div
                className="w-full bg-red-500 rounded-full"
                animate={{ height: `${hotValve}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="font-mono text-xs text-red-300">{Math.round(hotValve)}%</span>
          </div>
        </div>

        {/* Enlightenment Overlay */}
        {achieved && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute z-30 text-center px-8 py-5 rounded-3xl shadow-2xl border border-emerald-400/40"
            style={{
              background: 'radial-gradient(ellipse at center, #064e3b 0%, #022c22 100%)',
            }}
          >
            <h3 className="text-3xl font-black text-emerald-300"># PERFECT</h3>
            <p className="text-sm text-emerald-100 font-serif italic mt-1">
              “You have achieved shower enlightenment.”
            </p>
          </motion.div>
        )}
      </div>

      {/* Sweet Spot Progress Bar */}
      <div className="glass-card p-3.5 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            GOLDEN TEMPERATURE TARGET: 38.5°C
          </span>
          <span className="font-mono text-xs" style={{ color: isSweetSpot ? '#22c55e' : '#e8a855' }}>
            {isSweetSpot ? `HOLDING (${Math.round((holdTime / 2.5) * 100)}%)` : 'ADJUST VALVES'}
          </span>
        </div>

        <div className="h-2 rounded-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full rounded-full bg-green-500"
            animate={{ width: `${(holdTime / 2.5) * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Completion Button */}
      {achieved && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
          style={{ background: '#e8a855', color: '#100d0a' }}
        >
          ✓ FINISH SHOWER (+10 USELESSNESS)
        </motion.button>
      )}
    </div>
  );
}
