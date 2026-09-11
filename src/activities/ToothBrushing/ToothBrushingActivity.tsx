import { useRef, useEffect, useState, useMemo } from 'react';
import type { TrackingState } from '../../hooks/useHandTracking';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioEngine } from '../../engine/AudioEngine';
import { useGameStore } from '../../store/gameStore';

interface Props {
  tracking: TrackingState;
  onComplete: () => void;
  isCompleted: boolean;
}

interface Zone {
  id: string;
  label: string;
  clean: number; // 0-100
  x: number;
  y: number;
  w: number;
  h: number;
}

const INITIAL_ZONES: Zone[] = [
  { id: 'upper_left',   label: 'Upper Left',   clean: 0, x: 0.16, y: 0.18, w: 0.20, h: 0.16 },
  { id: 'upper_mid',    label: 'Upper Mid',    clean: 0, x: 0.40, y: 0.14, w: 0.20, h: 0.16 },
  { id: 'upper_right',  label: 'Upper Right',  clean: 0, x: 0.64, y: 0.18, w: 0.20, h: 0.16 },
  { id: 'front',        label: 'Front Teeth',  clean: 0, x: 0.35, y: 0.33, w: 0.30, h: 0.18 },
  { id: 'lower_left',   label: 'Lower Left',   clean: 0, x: 0.16, y: 0.54, w: 0.20, h: 0.16 },
  { id: 'lower_mid',    label: 'Lower Mid',    clean: 0, x: 0.40, y: 0.58, w: 0.20, h: 0.16 },
  { id: 'lower_right',  label: 'Lower Right',  clean: 0, x: 0.64, y: 0.54, w: 0.20, h: 0.16 },
  { id: 'tongue',       label: 'Tongue',       clean: 0, x: 0.30, y: 0.74, w: 0.40, h: 0.16 },
];

export default function ToothBrushingActivity({ tracking, onComplete, isCompleted }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [brushPos, setBrushPos] = useState({ x: 0.5, y: 0.5 });
  const [feedback, setFeedback] = useState<string>('HAND DETECTED');
  const [feedbackDetail, setFeedbackDetail] = useState<string>('Hold toothbrush/hand in front of camera');
  const [foam, setFoam] = useState<Array<{ id: number; x: number; y: number; size: number; alpha: number }>>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [celebrated, setCelebrated] = useState(false);
  const { incrementStat } = useGameStore();

  const foamIdCounter = useRef(0);
  const historyRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const idleTimerRef = useRef<number>(0);

  // Map tracking coordinates to activity container
  useEffect(() => {
    const hand = tracking.primaryHand;
    if (!hand) {
      setFeedback('NO HAND DETECTED');
      setFeedbackDetail("“I can't see your hand. Move it into the camera frame.”");
      return;
    }

    const pos = { x: hand.position.x, y: hand.position.y };
    setBrushPos(pos);

    const now = performance.now();
    historyRef.current.push({ ...pos, t: now });
    if (historyRef.current.length > 15) historyRef.current.shift();

    const speed = hand.velocity.speed;
    const isMoving = speed > 0.03;

    if (!isMoving) {
      idleTimerRef.current += 1;
      if (idleTimerRef.current > 35) {
        setFeedback('BRUSHING STOPPED');
        setFeedbackDetail('“Keep brushing.”');
      }
      return;
    }

    idleTimerRef.current = 0;

    // Movement analysis
    if (speed > 0.45) {
      setFeedback('TOO FAST!');
      setFeedbackDetail("“Easy. You're brushing teeth, not sanding wood.”");
    } else if (speed < 0.06) {
      setFeedback('TOO SLOW');
      setFeedbackDetail("“At this speed, we'll finish tomorrow.”");
    } else {
      // Determine direction or circular
      if (hand.isCircular) {
        setFeedback('CIRCULAR BRUSHING');
        setFeedbackDetail('GOOD MOVEMENT ✨');
      } else if (Math.abs(hand.velocity.vx) > Math.abs(hand.velocity.vy) * 1.3) {
        setFeedback('HORIZONTAL BRUSHING');
        setFeedbackDetail(hand.velocity.vx > 0 ? 'MOVE RIGHT →' : '← MOVE LEFT');
      } else {
        setFeedback('VERTICAL BRUSHING');
        setFeedbackDetail('GOOD MOVEMENT ✨');
      }
    }

    // Play synthesized brushing audio
    AudioEngine.playBrushScrub(speed);

    // Spawn dynamic foam bubbles around brush tip
    if (Math.random() < 0.45) {
      const id = foamIdCounter.current++;
      const newBubble = {
        id,
        x: pos.x + (Math.random() - 0.5) * 0.06,
        y: pos.y + (Math.random() - 0.5) * 0.06,
        size: 5 + Math.random() * 9,
        alpha: 0.85,
      };
      setFoam(f => [...f.slice(-30), newBubble]);
      setTimeout(() => {
        setFoam(f => f.filter(b => b.id !== id));
      }, 1600);
    }

    // Clean zones where brush is located
    setZones(prev =>
      prev.map(zone => {
        const inX = pos.x >= zone.x - 0.05 && pos.x <= zone.x + zone.w + 0.05;
        const inY = pos.y >= zone.y - 0.05 && pos.y <= zone.y + zone.h + 0.05;
        if (inX && inY) {
          const rate = Math.min(speed * 32, 2.2);
          const nextClean = Math.min(100, zone.clean + rate);
          return { ...zone, clean: nextClean };
        }
        return zone;
      })
    );
  }, [tracking]);

  // Overall progress calculation
  useEffect(() => {
    const avg = zones.reduce((sum, z) => sum + z.clean, 0) / zones.length;
    const rounded = Math.round(avg);
    setTotalProgress(rounded);

    if (rounded >= 85 && !celebrated) {
      setCelebrated(true);
      incrementStat('teeth', 1);
      AudioEngine.playDing();
      setFeedback('TEETH CLEAN!');
      setFeedbackDetail('Your virtual teeth are cleaner than your real ones.');
    }
  }, [zones, celebrated, incrementStat]);

  // Render 2.5D Mouth & Teeth on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Deep mouth cavity / gums background
    const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 40, W * 0.5, H * 0.5, W * 0.48);
    bgGrad.addColorStop(0, '#5a1217');
    bgGrad.addColorStop(0.7, '#380a0e');
    bgGrad.addColorStop(1, '#1e0406');

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.48, W * 0.44, H * 0.38, 0, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Subtle gum rim
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#c44d58';
    ctx.stroke();
    ctx.restore();

    // Render Dental Zones
    zones.forEach(zone => {
      const zx = zone.x * W;
      const zy = zone.y * H;
      const zw = zone.w * W;
      const zh = zone.h * H;
      const cleanFactor = zone.clean / 100;

      ctx.save();

      // Tooth base: Dirty yellowish brown → Gleaming polished ivory white
      if (zone.id === 'tongue') {
        // Tongue rendering
        const tongueGrad = ctx.createLinearGradient(zx, zy, zx, zy + zh);
        const tr = Math.round(210 + cleanFactor * 25);
        const tg = Math.round(110 + cleanFactor * 40);
        const tb = Math.round(120 + cleanFactor * 40);
        tongueGrad.addColorStop(0, `rgb(${tr},${tg},${tb})`);
        tongueGrad.addColorStop(1, '#8b2e38');
        ctx.fillStyle = tongueGrad;
        ctx.beginPath();
        ctx.ellipse(zx + zw * 0.5, zy + zh * 0.5, zw * 0.48, zh * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      // Teeth Blocks
      const toothCount = zone.id === 'front' ? 4 : 3;
      const tWidth = (zw - 6) / toothCount;

      for (let i = 0; i < toothCount; i++) {
        const tx = zx + i * tWidth + 2;
        const ty = zy + 2;
        const tw = tWidth - 4;
        const th = zh - 4;

        // Dirty stain factor
        const stainR = Math.round(200 + cleanFactor * 55);
        const stainG = Math.round(165 + cleanFactor * 90);
        const stainB = Math.round(70 + cleanFactor * 185);

        const grad = ctx.createLinearGradient(tx, ty, tx, ty + th);
        grad.addColorStop(0, `rgb(${stainR},${stainG},${stainB})`);
        grad.addColorStop(1, `rgb(${Math.max(0, stainR - 35)},${Math.max(0, stainG - 35)},${Math.max(0, stainB - 35)})`);

        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, th, [6, 6, 8, 8]);
        ctx.fillStyle = grad;
        ctx.fill();

        // 3D tooth highlight
        ctx.beginPath();
        ctx.roundRect(tx + 2, ty + 2, tw - 4, th * 0.35, 4);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + cleanFactor * 0.45})`;
        ctx.fill();

        // Sparkle star if zone is spotless
        if (cleanFactor > 0.85 && (i === 1 || i === 2)) {
          const sx = tx + tw * 0.7;
          const sy = ty + th * 0.3;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    });

    // Render Foam Bubbles
    foam.forEach(b => {
      const bx = b.x * W;
      const by = b.y * H;
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, b.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(210, 235, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bubble highlight
      ctx.beginPath();
      ctx.arc(bx - b.size * 0.3, by - b.size * 0.3, b.size * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      ctx.restore();
    });

    // Render Realistic Virtual Toothbrush controlled by user's hand
    const bx = brushPos.x * W;
    const by = brushPos.y * H;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 12;

    // Handle
    ctx.fillStyle = '#2563eb'; // sleek cobalt handle
    ctx.beginPath();
    ctx.roundRect(bx - 6, by, 12, 55, [0, 0, 6, 6]);
    ctx.fill();

    // Neck
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.roundRect(bx - 4, by - 12, 8, 14, 2);
    ctx.fill();

    // Head base
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(bx - 9, by - 32, 18, 22, 4);
    ctx.fill();

    // Bristles (mint green & clean white rows)
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = c % 2 === 0 ? '#10b981' : '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(bx - 7 + c * 3.8, by - 44, 2.5, 12, 1);
      ctx.fill();
    }
    ctx.restore();
  }, [zones, brushPos, foam]);

  const handleReset = () => {
    setZones(INITIAL_ZONES);
    setTotalProgress(0);
    setCelebrated(false);
    setFeedback('HAND DETECTED');
    setFeedbackDetail('Hold toothbrush/hand in front of camera');
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col gap-3 relative select-none">
      {/* Activity Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl md:text-2xl text-white font-bold tracking-wide">
              🦷 Virtual Tooth Brushing
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
              SHOWCASE
            </span>
          </div>
          <p className="text-white/40 text-xs mt-0.5">
            Hold real toothbrush or move hand · 8 mouth zones · Brushing speed detection
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

      {/* Main Interactive 2.5D Mouth Stage */}
      <div
        className="flex-1 relative rounded-3xl overflow-hidden min-h-[280px]"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, #180b0c 0%, #0a0606 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          className="w-full h-full object-contain"
        />

        {/* Dynamic Real-Time Feedback Pill */}
        <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none">
          <div
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg"
            style={{
              background: 'rgba(18, 14, 11, 0.88)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(232, 168, 85, 0.25)',
              color: '#e8a855',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8a855] animate-ping" />
            <span>{feedback}</span>
            <span className="text-white/40 font-normal">| {feedbackDetail}</span>
          </div>
        </div>
      </div>

      {/* Progress & Cleanliness Bar */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-white/50 uppercase tracking-widest text-[10px]">
            Brushing Progress
          </span>
          <span className="font-mono font-bold" style={{ color: '#e8a855' }}>
            {totalProgress}%
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.2 }}
            style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 60%, #e8a855 100%)' }}
          />
        </div>
      </div>

      {/* 8 Dental Zones Grid Indicator */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
        {zones.map(zone => (
          <div
            key={zone.id}
            className="text-center p-1.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="h-1 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${zone.clean}%`,
                  background: zone.clean >= 80 ? '#22c55e' : zone.clean >= 40 ? '#e8a855' : '#ef4444',
                }}
              />
            </div>
            <p className="text-white/40 text-[9px] truncate font-medium">{zone.label}</p>
          </div>
        ))}
      </div>

      {/* Completion & Next Action */}
      {totalProgress >= 85 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mt-1"
        >
          <button
            onClick={onComplete}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-transform hover:scale-[1.02]"
            style={{ background: '#e8a855', color: '#100d0a' }}
          >
            ✓ FINISH BRUSHING (+10 USELESSNESS)
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl text-xs text-white/60 hover:text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Restart
          </button>
        </motion.div>
      )}
    </div>
  );
}
