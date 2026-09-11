import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { AudioEngine } from '../engine/AudioEngine';
import type { TrackingState } from '../hooks/useHandTracking';

// 12 Augmented Reality Activity Components
import BrushTeethAR from '../activities/ar/BrushTeethAR';
import VirtualBathAR from '../activities/ar/VirtualBathAR';
import HairWashingAR from '../activities/ar/HairWashingAR';
import FaceWashingAR from '../activities/ar/FaceWashingAR';
import DishwashingAR from '../activities/ar/DishwashingAR';
import ClothWashingAR from '../activities/ar/ClothWashingAR';
import RoomCleaningAR from '../activities/ar/RoomCleaningAR';
import BedMakingAR from '../activities/ar/BedMakingAR';
import MosquitoAR from '../activities/ar/MosquitoAR';
import TeaMakingAR from '../activities/ar/TeaMakingAR';
import PillowAR from '../activities/ar/PillowAR';
import ShowerTemperatureAR from '../activities/ar/ShowerTemperatureAR';

export const ACTIVITIES = [
  { id: 'brushing',    label: 'Teeth',    emoji: '🦷', component: BrushTeethAR,         name: 'Teeth Brushing AR',      hint: 'Mouth & Hand' },
  { id: 'bath',        label: 'Shower',   emoji: '🚿', component: VirtualBathAR,        name: 'Virtual Shower AR',      hint: 'Head & Body' },
  { id: 'hair',        label: 'Hair',     emoji: '💆', component: HairWashingAR,        name: 'Hair Washing AR',        hint: 'Scalp & Hands' },
  { id: 'face',        label: 'Face',     emoji: '🧼', component: FaceWashingAR,        name: 'Face Scrub AR',          hint: 'Cheeks & Hands' },
  { id: 'dishes',      label: 'Dishes',   emoji: '🍽️', component: DishwashingAR,        name: 'Dish Scrub AR',          hint: 'Two Hands' },
  { id: 'clothes',     label: 'Clothes',  emoji: '🫧', component: ClothWashingAR,       name: 'Cloth Washing AR',       hint: 'Two Hands' },
  { id: 'clean',       label: 'Clean',    emoji: '🧹', component: RoomCleaningAR,       name: 'Room Sweeping AR',       hint: 'Room & Hand' },
  { id: 'bed',         label: 'Bed',      emoji: '🛏️', component: BedMakingAR,          name: 'Bed Making AR',          hint: 'Room & Hands' },
  { id: 'mosquito',    label: 'Mosquito', emoji: '🦟', component: MosquitoAR,           name: 'Mosquito Slap AR',       hint: 'Face & Rapid Slap' },
  { id: 'tea',         label: 'Chai',     emoji: '☕', component: TeaMakingAR,          name: 'Chai Making AR',         hint: 'Two Hands' },
  { id: 'pillow',      label: 'Pillow',   emoji: '🛌', component: PillowAR,             name: 'Cold Pillow AR',         hint: 'Head Tilt' },
  { id: 'shower',      label: 'Temp',     emoji: '🌡️', component: ShowerTemperatureAR, name: 'Shower Temp AR',        hint: 'Head & Hand' },
] as const;

// MediaPipe Hand connections
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

// MediaPipe Face key lips contour
const LIPS_OUTLINE = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];

interface Props {
  tracking: TrackingState;
  onStopCamera: () => void;
  onStartDemo?: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function MainLayout({ tracking, onStopCamera, onStartDemo, videoRef }: Props) {
  const [activeId, setActiveId] = useState<string>('brushing');
  const [timeString, setTimeString] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { completedActivities, completeActivity, getUselessnessPercent, soundEnabled, toggleSound } = useGameStore();
  const pct = getUselessnessPercent();

  const activeActivity = ACTIVITIES.find(a => a.id === activeId) ?? ACTIVITIES[0];
  const ActivityComponent = activeActivity.component;

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeString(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Debug Mesh Canvas Overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!tracking.debugMode) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Draw Face Landmarks if available
    if (tracking.rawFaceLandmarks && tracking.rawFaceLandmarks.length > 0) {
      const faceLms = tracking.rawFaceLandmarks[0];
      if (faceLms && faceLms.length > 0) {
        // Draw Lips Outline in Radiant Pink
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        LIPS_OUTLINE.forEach((idx, i) => {
          const pt = faceLms[idx];
          if (!pt) return;
          const x = (1 - pt.x) * W;
          const y = pt.y * H;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw Face Mesh Dots (subsample for high performance)
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        for (let i = 0; i < faceLms.length; i += 4) {
          const pt = faceLms[i];
          const x = (1 - pt.x) * W;
          const y = pt.y * H;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Mouth Open & Tilt stats
        if (tracking.face) {
          const m = tracking.face.mouth;
          const mx = (1 - m.center.x) * W;
          const my = m.center.y * H;
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#f472b6';
          ctx.fillText(`MOUTH: ${m.isOpen ? 'OPEN' : 'CLOSED'} (${(m.openRatio * 100).toFixed(0)}%)`, mx - 60, my + 30);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`TILT: ${tracking.face.tiltAngle.toFixed(1)}°`, mx - 30, my + 44);
        }
      }
    }

    // Draw Hand Landmarks & Skeleton in Glowing Gold
    tracking.landmarks.forEach(hand => {
      if (!hand.length) return;

      const px = (lm: { x: number; y: number }) => ({
        x: (1 - lm.x) * W,
        y: lm.y * H,
      });

      // Connections
      ctx.strokeStyle = 'rgba(232, 168, 85, 0.75)';
      ctx.lineWidth = 2;
      HAND_CONNECTIONS.forEach(([a, b]) => {
        if (!hand[a] || !hand[b]) return;
        const pa = px(hand[a]), pb = px(hand[b]);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      });

      // Knuckle & Fingertip Dots
      hand.forEach((lm, i) => {
        const p = px(lm);
        const isTip = [4, 8, 12, 16, 20].includes(i);
        ctx.beginPath();
        ctx.arc(p.x, p.y, isTip ? 5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? '#ffffff' : 'rgba(232, 168, 85, 0.9)';
        ctx.fill();

        if (isTip) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(232, 168, 85, 0.3)';
          ctx.fill();
        }
      });
    });
  }, [tracking.rawFaceLandmarks, tracking.landmarks, tracking.debugMode, tracking.face]);

  const handleSelectActivity = (id: string) => {
    AudioEngine.playDing();
    setActiveId(id);
  };

  const isLive = tracking.mode === 'live';
  const isDemo = tracking.mode === 'demo';
  const hasFace = !!tracking.face;
  const hasHands = tracking.hands.length > 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-transparent">

      {/* Demo Mode Ambient Camera Simulation Background */}
      {isDemo && (
        <div
          className="fixed inset-0 w-full h-full z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, #221a14 0%, #0c0907 85%, #050403 100%)',
          }}
        >
          {/* Subtle camera scanlines & ambient room silhouette */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(232,168,85,0.06) 0%, transparent 60%)',
            }}
          />

          {/* Interactive silhouette representing the user */}
          <div
            className="absolute left-1/2 bottom-0 -translate-x-1/2 opacity-25"
            style={{
              width: '460px',
              height: '560px',
              background: 'radial-gradient(ellipse at 50% 30%, rgba(232,168,85,0.3) 0%, transparent 65%)',
              borderRadius: '50% 50% 0 0',
              filter: 'blur(30px)',
            }}
          />

          {/* Subtle Demo Banner Badge */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-wide backdrop-blur-md shadow-lg">
            🖱️ DEMO SIMULATOR ACTIVE • Move Mouse (Hands) • Left Click (Scrub/Slap) • Spacebar (Mouth)
          </div>
        </div>
      )}

      {/* Camera Loading Overlay */}
      {tracking.mode === 'loading' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="text-center p-8 rounded-3xl border border-amber-500/20 bg-[#120d09]/90 max-w-sm">
            <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-1">Starting AR Vision...</h3>
            <p className="text-white/50 text-xs">Loading on-device neural landmark models for real face and hand tracking.</p>
          </div>
        </div>
      )}

      {/* Camera Error Modal */}
      {tracking.mode === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="text-center p-8 rounded-3xl border border-red-500/30 bg-[#1a0f0d] max-w-md shadow-2xl">
            <div className="text-4xl mb-3">📷⚠️</div>
            <h3 className="text-white font-bold text-lg mb-2">Camera Unavailable</h3>
            <p className="text-white/60 text-xs mb-6 leading-relaxed">
              {tracking.errorMessage || 'Camera access was denied or another application is using your webcam.'}
            </p>
            <div className="flex gap-3 justify-center">
              {onStartDemo && (
                <button
                  onClick={onStartDemo}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 transition-all shadow-lg"
                >
                  Switch to Demo Mode (Mouse)
                </button>
              )}
              <button
                onClick={onStopCamera}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-white/70 bg-white/10 hover:bg-white/20 transition-all"
              >
                Back to Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Debug Mesh Canvas Overlay (Face & Hands) */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth || 1280}
        height={window.innerHeight || 720}
        className={`fixed inset-0 w-full h-full pointer-events-none z-10 ${tracking.debugMode ? 'block' : 'hidden'}`}
      />

      {/* 3. AR Activity Interactive Layer */}
      <div className="fixed inset-0 z-20 pointer-events-none">
        <AnimatePresence mode="wait">
          {ActivityComponent && (
            <motion.div
              key={activeId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              <ActivityComponent
                tracking={tracking}
                onComplete={() => completeActivity(activeId)}
                isCompleted={completedActivities.includes(activeId)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Top Floating Glassmorphism HUD Bar */}
      <header className="fixed top-4 left-4 right-4 z-40 pointer-events-auto flex items-center justify-between">
        {/* Left: Branding & Digital Clock */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2.5 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-xl"
            style={{
              background: 'rgba(14, 11, 8, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
            <div className="flex flex-col">
              <span className="font-display font-black text-xs md:text-sm text-white tracking-wider flex items-center gap-1.5">
                USELESS REALITY <span className="text-[10px] text-amber-400 font-mono font-normal">AR</span>
              </span>
              <span className="text-[9px] text-amber-200/50 font-mono tracking-widest">
                {timeString || 'LIVE'}
              </span>
            </div>
          </div>

          {/* Telemetry Badges (Desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Feed Mode */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono backdrop-blur-lg"
              style={{
                background: 'rgba(14, 11, 8, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: isLive ? '#86efac' : '#fde047',
              }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span>{isLive ? 'CAMERA: LIVE' : 'FEED: DEMO'}</span>
            </div>

            {/* Face Status */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono backdrop-blur-lg"
              style={{
                background: 'rgba(14, 11, 8, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: hasFace ? '#86efac' : 'rgba(255,255,255,0.4)',
              }}
            >
              <span>{hasFace ? '👤 FACE: 100%' : '👤 FACE: SEARCHING'}</span>
            </div>

            {/* Hand Status */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono backdrop-blur-lg"
              style={{
                background: 'rgba(14, 11, 8, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: hasHands ? '#86efac' : 'rgba(255,255,255,0.4)',
              }}
            >
              <span>{hasHands ? `🖐️ HAND: ${tracking.hands.length}` : '🖐️ HAND: SEARCHING'}</span>
            </div>
          </div>
        </div>

        {/* Right: Sound, Mesh Toggle, Score, Stop */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2.5 rounded-xl text-sm transition-all hover:bg-white/10 flex items-center justify-center backdrop-blur-xl text-white/80"
            style={{
              background: 'rgba(14, 11, 8, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
            title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          {/* Debug Mesh Toggle */}
          <button
            onClick={tracking.toggleDebug}
            className="px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all hover:bg-white/15 flex items-center gap-1.5 backdrop-blur-xl"
            style={{
              background: tracking.debugMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 11, 8, 0.85)',
              border: tracking.debugMode ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
              color: tracking.debugMode ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
            }}
            title="Toggle Real-Time Face & Hand Landmark Mesh"
          >
            <span>🕸️</span>
            <span className="hidden sm:inline">{tracking.debugMode ? 'MESH ON' : 'MESH'}</span>
          </button>

          {/* Uselessness Score Badge */}
          <div
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-xl shadow-lg"
            style={{
              background: 'rgba(232, 168, 85, 0.16)',
              color: '#e8a855',
              border: '1px solid rgba(232, 168, 85, 0.4)',
            }}
          >
            <span className="text-[10px] text-amber-200/60 uppercase tracking-widest font-sans hidden sm:inline">Score:</span>
            <span>{pct}% USELESS</span>
          </div>

          {/* Exit / Stop Camera Button */}
          <button
            onClick={onStopCamera}
            className="px-3.5 py-2 rounded-xl text-xs text-white/70 hover:text-white transition-all font-medium backdrop-blur-xl hover:bg-red-950/40"
            style={{
              background: 'rgba(14, 11, 8, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            ✕ Exit
          </button>
        </div>
      </header>

      {/* 5. Bottom Floating Glassmorphism AR Activity Dock */}
      <footer className="fixed bottom-4 left-0 right-0 z-40 pointer-events-auto flex flex-col items-center justify-center px-4">
        {/* Dock Container */}
        <div
          className="flex items-center gap-1.5 p-1.5 rounded-2xl max-w-full overflow-x-auto no-scrollbar shadow-2xl backdrop-blur-2xl"
          style={{
            background: 'rgba(10, 8, 6, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          {ACTIVITIES.map(act => {
            const done = completedActivities.includes(act.id);
            const isActive = activeId === act.id;
            return (
              <button
                key={act.id}
                onClick={() => handleSelectActivity(act.id)}
                className="flex flex-col items-center px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[54px] sm:min-w-[62px] flex-shrink-0 relative group"
                style={{
                  background: isActive
                    ? 'linear-gradient(180deg, rgba(232,168,85,0.28) 0%, rgba(232,168,85,0.12) 100%)'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(232,168,85,0.5)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 16px rgba(232,168,85,0.25)' : 'none',
                }}
              >
                <span className="text-xl relative transition-transform group-hover:scale-115">
                  {act.emoji}
                  {done && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 text-black font-bold flex items-center justify-center text-[9px] shadow-sm">
                      ✓
                    </span>
                  )}
                </span>
                <span
                  className="text-[10px] mt-0.5 whitespace-nowrap font-medium transition-colors"
                  style={{ color: isActive ? '#e8a855' : 'rgba(255,255,255,0.5)' }}
                >
                  {act.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subtle Privacy & Philosophy Notice */}
        <p className="text-[10px] text-white/35 font-mono tracking-wide mt-2 flex items-center gap-1.5 drop-shadow">
          <span>🔒</span>
          <span>MediaPipe On-Device AR • Zero video saved or uploaded • You are the character</span>
        </p>
      </footer>
    </div>
  );
}
