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

export default function FaceWashingAR({ tracking, onComplete, isCompleted }: Props) {
  const [faceCleanliness, setFaceCleanliness] = useState(0);
  const [rinsing, setRinsing] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const { incrementStat } = useGameStore();

  const face = tracking.face;
  const hand = tracking.primaryHand;

  // Real cheek coordinates (mirrored)
  const leftCheekX = face ? 1 - face.leftCheek.x : 0.38;
  const leftCheekY = face ? face.leftCheek.y : 0.48;
  const rightCheekX = face ? 1 - face.rightCheek.x : 0.62;
  const rightCheekY = face ? face.rightCheek.y : 0.48;
  const noseX = face ? 1 - face.nose.x : 0.5;
  const noseY = face ? face.nose.y : 0.48;

  const handX = hand ? 1 - hand.position.x : 0.5;
  const handY = hand ? hand.position.y : 0.5;

  // Proximity to either cheek
  const distLeft = Math.hypot(handX - leftCheekX, handY - leftCheekY);
  const distRight = Math.hypot(handX - rightCheekX, handY - rightCheekY);
  const isRubbingCheek = (distLeft < 0.16 || distRight < 0.16) && (hand?.velocity.speed || 0) > 0.05;

  useEffect(() => {
    if (celebrated || rinsing) return;

    if (isRubbingCheek) {
      AudioEngine.playBrushScrub(0.25);
      setFaceCleanliness(prev => {
        const next = Math.min(100, prev + (hand?.velocity.speed || 0.1) * 18);
        if (next >= 100) {
          setRinsing(true);
          AudioEngine.playSplash(1);
          setTimeout(() => {
            setCelebrated(true);
            AudioEngine.playAchievement();
            incrementStat('baths', 1);
          }, 1400);
        }
        return next;
      });
    }
  }, [isRubbingCheek, hand?.velocity.speed, celebrated, rinsing, incrementStat]);

  const handleFinish = () => {
    AudioEngine.playDing();
    onComplete();
  };

  const foamOpacity = rinsing ? 0 : Math.max(0.15, 0.85 - (faceCleanliness / 100) * 0.7);

  return (
    <div className="fixed inset-0 pointer-events-none z-15 select-none overflow-hidden">
      {/* 1. Virtual Soap Lather directly over user's actual cheeks & nose */}
      {!celebrated && (
        <>
          {/* Left Cheek Foam */}
          <motion.div
            className="absolute rounded-full pointer-events-none transition-all duration-75"
            style={{
              left: `${leftCheekX * 100}%`,
              top: `${leftCheekY * 100}%`,
              width: 70,
              height: 70,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(224,242,254,0.4) 70%, transparent 100%)',
              opacity: foamOpacity,
              filter: 'blur(2px)',
            }}
          />

          {/* Right Cheek Foam */}
          <motion.div
            className="absolute rounded-full pointer-events-none transition-all duration-75"
            style={{
              left: `${rightCheekX * 100}%`,
              top: `${rightCheekY * 100}%`,
              width: 70,
              height: 70,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(224,242,254,0.4) 70%, transparent 100%)',
              opacity: foamOpacity,
              filter: 'blur(2px)',
            }}
          />

          {/* Forehead / Nose Suds */}
          <motion.div
            className="absolute rounded-full pointer-events-none transition-all duration-75"
            style={{
              left: `${noseX * 100}%`,
              top: `${(noseY - 0.08) * 100}%`,
              width: 80,
              height: 45,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 80%)',
              opacity: foamOpacity,
              filter: 'blur(3px)',
            }}
          />
        </>
      )}

      {/* 2. Rinsing Water Wave Animation */}
      {rinsing && (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: '120%' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(56,189,248,0.4) 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
          }}
        />
      )}

      {/* 3. Floating Telemetry Card */}
      <div className="absolute top-20 right-6 pointer-events-auto flex flex-col gap-2 w-64">
        <div className="glass-card p-4 border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">
              FACE CLEANLINESS
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {Math.round(faceCleanliness)}%
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
              animate={{ width: `${faceCleanliness}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>

          <p className="text-amber-200/90 text-xs font-medium mt-3 text-center">
            {isRubbingCheek ? 'Rubbing cheeks ✨' : 'Rub your real cheeks to scrub the foam!'}
          </p>
        </div>
      </div>

      {/* 4. Completion Banner */}
      <AnimatePresence>
        {celebrated && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-40 text-center px-8 py-5 rounded-3xl glass-card border border-emerald-400/50 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(6, 78, 59, 0.88)' }}
          >
            <h3 className="text-2xl font-black text-white">FACE: VIRTUALLY CLEAN</h3>
            <p className="text-xs text-emerald-200 font-serif italic mt-1">
              Gleaming skin. Zero soap in eyes.
            </p>
            <button
              onClick={handleFinish}
              className="mt-3.5 px-6 py-2 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-transform hover:scale-105 shadow-lg"
            >
              FINISH FACE WASH (+10 USELESSNESS)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
