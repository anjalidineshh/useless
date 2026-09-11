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

export default function BedMakingActivity({ tracking, onComplete, isCompleted }: Props) {
  const [sheetStretch, setSheetStretch] = useState(30); // 0 to 100
  const [cornersSnapped, setCornersSnapped] = useState(false);
  const [pillowsAligned, setPillowsAligned] = useState(false);
  const [isMessy, setIsMessy] = useState(true);
  const [funMessage, setFunMessage] = useState('Spread your arms wide to stretch the wrinkled bedsheet');
  const { incrementStat, unlockAchievement } = useGameStore();

  const hands = tracking.hands;
  const primaryHand = tracking.primaryHand;

  useEffect(() => {
    if (!isMessy) return;

    // Dual-hand outward stretch OR wide horizontal motion
    let spread = 0.3;
    if (hands.length >= 2) {
      spread = Math.abs(hands[0].position.x - hands[1].position.x);
    } else if (primaryHand) {
      spread = Math.abs(primaryHand.position.x - 0.5) * 2;
    }

    if (spread > 0.35) {
      AudioEngine.playSweepWhoosh(0.3);
      setSheetStretch(prev => Math.min(100, prev + spread * 12));
    }

    // When stretched > 80%, detect snapping corners onto mattress
    if (sheetStretch > 75 && !cornersSnapped) {
      if (primaryHand && (primaryHand.gesture === 'pinch' || primaryHand.position.y > 0.6)) {
        AudioEngine.playDing();
        setCornersSnapped(true);
        setFunMessage('Corners tucked tight! Now place the pillows straight.');
      }
    }

    // When corners snapped, align pillows
    if (cornersSnapped && !pillowsAligned) {
      if (primaryHand && primaryHand.position.y < 0.4) {
        AudioEngine.playAchievement();
        setPillowsAligned(true);
        setIsMessy(false);
        incrementStat('bedsMade', 1);
        setFunMessage('✨ BED PERFECTLY MADE! Crisp hotel corners.');
      }
    }
  }, [hands, primaryHand, sheetStretch, cornersSnapped, pillowsAligned, isMessy, incrementStat]);

  const handleDestroy = () => {
    AudioEngine.playSplash(1.2);
    unlockAchievement('bed_destroyer');
    setSheetStretch(25);
    setCornersSnapped(false);
    setPillowsAligned(false);
    setIsMessy(true);
    setFunMessage('💥 Bed utterly destroyed! Chaos restored.');
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
            🛏️ Virtual Bed Making
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Spread arms outward to stretch sheet · Tuck corners · Straighten pillows
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

      {/* Main Bed Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center p-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #1f1814 0%, #0d0a08 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Modern Wooden Bed Frame */}
        <div
          className="relative w-72 h-80 rounded-2xl shadow-2xl flex flex-col justify-between p-3 border-4 border-amber-950/60"
          style={{
            background: 'linear-gradient(180deg, #3f2010 0%, #2b140a 100%)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Headboard Pillows */}
          <div className="flex justify-around gap-2 pt-2 z-20">
            <motion.div
              animate={{
                rotate: pillowsAligned ? 0 : -15,
                y: pillowsAligned ? 0 : -8,
              }}
              className="w-28 h-14 rounded-xl shadow-md border border-white/40 flex items-center justify-center"
              style={{ background: '#f8fafc' }}
            >
              <div className="w-16 h-0.5 bg-slate-200 rounded-full" />
            </motion.div>

            <motion.div
              animate={{
                rotate: pillowsAligned ? 0 : 20,
                y: pillowsAligned ? 0 : 6,
              }}
              className="w-28 h-14 rounded-xl shadow-md border border-white/40 flex items-center justify-center"
              style={{ background: '#f8fafc' }}
            >
              <div className="w-16 h-0.5 bg-slate-200 rounded-full" />
            </motion.div>
          </div>

          {/* Stretched Duvet Sheet */}
          <motion.div
            className="w-full relative rounded-xl overflow-hidden shadow-inner flex items-center justify-center"
            animate={{
              height: cornersSnapped ? '68%' : `${Math.max(35, sheetStretch * 0.65)}%`,
              skewX: isMessy ? -4 : 0,
            }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
              border: cornersSnapped ? '2px solid #7dd3fc' : '2px dashed rgba(255,255,255,0.4)',
            }}
          >
            {/* Sheet Pattern / Folds */}
            <div className="text-white/60 text-xs font-mono font-bold tracking-widest uppercase">
              {cornersSnapped ? 'HOTEL CORNERS TUCKED' : 'WRINKLED'}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bed Status HUD */}
      <div className="glass-card p-3.5 flex items-center justify-between">
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            STRETCH: <span className="text-white font-bold">{Math.round(sheetStretch)}%</span>
          </p>
          <p className="text-amber-200/90 text-xs font-medium mt-0.5">{funMessage}</p>
        </div>

        {/* DESTROY BED button */}
        {!isMessy && (
          <button
            onClick={handleDestroy}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-300 bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 transition-colors"
          >
            💥 DESTROY BED
          </button>
        )}
      </div>

      {/* Completion Button */}
      {!isMessy && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFinish}
          className="btn-primary py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg"
          style={{ background: '#e8a855', color: '#100d0a' }}
        >
          ✓ FINISH BED MAKING (+10 USELESSNESS)
        </motion.button>
      )}
    </div>
  );
}
