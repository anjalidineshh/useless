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

export default function VirtualBathActivity({ tracking, onComplete, isCompleted }: Props) {
  const [waterLevel, setWaterLevel] = useState(25);
  const [temperature, setTemperature] = useState(38); // Celsius
  const [faucetRunning, setFaucetRunning] = useState(false);
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const { incrementStat } = useGameStore();

  const hand = tracking.primaryHand;

  // Track hand interactions
  useEffect(() => {
    if (!hand) {
      setFaucetRunning(false);
      return;
    }

    // 1. Raise hand: Turn faucet ON
    if (hand.position.y < 0.35) {
      setFaucetRunning(true);
      setWaterLevel(w => Math.min(95, w + 0.45));
      AudioEngine.playWaterDrop();
    } else {
      setFaucetRunning(false);
    }

    // 2. Hand circular: Adjust temperature
    if (hand.isCircular) {
      if (hand.circularDirection === 'cw') {
        setTemperature(t => Math.min(85, t + 0.6));
      } else if (hand.circularDirection === 'ccw') {
        setTemperature(t => Math.max(10, t - 0.6));
      }
    }

    // 3. Hand downward swipe: Drain water
    if (hand.velocity.vy > 0.35) {
      setWaterLevel(w => Math.max(0, w - 1.2));
      AudioEngine.playSplash(0.5);
    }

    // 4. Pinch: Spawn bubbles
    if (hand.gesture === 'pinch' || hand.pinchDistance < 0.04) {
      if (Math.random() < 0.4) {
        setBubbles(prev => [
          ...prev.slice(-25),
          {
            id: Math.random(),
            x: 20 + Math.random() * 60,
            y: Math.random() * 20,
            size: 10 + Math.random() * 18,
          },
        ]);
        AudioEngine.playWaterDrop();
      }
    }
  }, [hand]);

  const handleFinish = () => {
    incrementStat('baths', 1);
    AudioEngine.playDing();
    onComplete();
  };

  // Visual cues based on temperature
  let tempMessage = 'Perfect bath warmth ✨';
  if (temperature > 65) tempMessage = '🔥 “This is no longer a bath. This is lava.”';
  else if (temperature > 50) tempMessage = '♨️ Steaming hot!';
  else if (temperature < 20) tempMessage = '❄️ “This is no longer a bath. This is character development.”';

  const tempColor =
    temperature > 55
      ? '#ef4444'
      : temperature > 40
      ? '#f59e0b'
      : temperature > 25
      ? '#3b82f6'
      : '#06b6d4';

  const waterBg =
    temperature > 55
      ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.7) 0%, rgba(185, 28, 28, 0.85) 100%)'
      : temperature > 40
      ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.65) 0%, rgba(217, 119, 6, 0.85) 100%)'
      : 'linear-gradient(180deg, rgba(56, 189, 248, 0.7) 0%, rgba(37, 99, 235, 0.85) 100%)';

  return (
    <div className="h-full flex flex-col gap-3 relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl md:text-2xl text-white font-bold tracking-wide">
            🛁 Virtual Bath
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Raise hand = Faucet ON · Circle = Temp · Swipe down = Drain · Pinch = Bubbles
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

      {/* Main Bathtub Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center p-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #171310 0%, #0a0806 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Steam particles if hot */}
        {temperature > 48 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 40 + i * 15,
                  height: 40 + i * 15,
                  bottom: '40%',
                  left: `${25 + i * 8}%`,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
                animate={{ y: [-10, -120], opacity: [0, 0.45, 0] }}
                transition={{ duration: 2.2 + i * 0.3, repeat: Infinity, delay: i * 0.25 }}
              />
            ))}
          </div>
        )}

        {/* Faucet at top center */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
          <div
            className="w-10 h-7 rounded-t-lg"
            style={{ background: 'linear-gradient(90deg, #9ca3af 0%, #d1d5db 50%, #6b7280 100%)' }}
          />
          <div
            className="w-4 h-6 -mt-1 rounded-b-md"
            style={{ background: 'linear-gradient(90deg, #d1d5db 0%, #f3f4f6 50%, #9ca3af 100%)' }}
          />
          {/* Running Water Stream */}
          {faucetRunning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 110, opacity: 0.8 }}
              className="w-3 rounded-full mt-0.5"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(56,189,248,0.7) 100%)',
                boxShadow: '0 0 12px rgba(56,189,248,0.5)',
              }}
            />
          )}
        </div>

        {/* The Ceramic Bathtub */}
        <div
          className="relative w-full max-w-[420px] h-[200px] rounded-[16px_16px_90px_90px] overflow-hidden shadow-2xl flex flex-col justify-end"
          style={{
            background: 'linear-gradient(180deg, #f3ede2 0%, #e5ded2 60%, #c9c0b2 100%)',
            border: '4px solid #ede5d8',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 6px 14px rgba(255,255,255,0.8)',
          }}
        >
          {/* Water Surface inside Tub */}
          <motion.div
            className="w-full relative overflow-hidden"
            animate={{ height: `${waterLevel}%` }}
            transition={{ duration: 0.2 }}
            style={{ background: waterBg }}
          >
            {/* Water Wave Ripple */}
            <div
              className="absolute top-0 left-0 right-0 h-3 opacity-60"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)',
                borderRadius: '50% 50% 0 0',
              }}
            />

            {/* Floating Soap Bubbles */}
            {bubbles.map(b => (
              <motion.div
                key={b.id}
                className="absolute rounded-full bg-white/75 border border-white/90 shadow-sm"
                style={{
                  left: `${b.x}%`,
                  bottom: `${b.y}px`,
                  width: b.size,
                  height: b.size,
                }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Temperature Gauge & Water Level HUD */}
      <div className="glass-card p-4 flex flex-col gap-3">
        {/* Temperature slider visual */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1 font-medium">
            <span className="text-white/40 uppercase tracking-widest text-[10px]">Temperature</span>
            <span className="font-mono font-bold" style={{ color: tempColor }}>
              {Math.round(temperature)}°C
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${((temperature - 10) / 75) * 100}%`,
                background: 'linear-gradient(90deg, #38bdf8 0%, #facc15 50%, #ef4444 100%)',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30 mt-1">
            <span>COLD (10°C)</span>
            <span className="text-amber-200/70 font-medium">{tempMessage}</span>
            <span>HOT (85°C)</span>
          </div>
        </div>

        {/* Water Level */}
        <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
          <span className="text-white/40">Water Fill:</span>
          <span className="font-mono font-bold text-white/90">{Math.round(waterLevel)}%</span>
        </div>
      </div>

      {/* Completion button */}
      {waterLevel >= 55 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
          style={{ background: '#e8a855', color: '#100d0a' }}
        >
          ✓ FINISH BATH (+10 USELESSNESS)
        </motion.button>
      )}
    </div>
  );
}
