import { useRef, useEffect } from 'react';
import type { TrackingState } from '../hooks/useHandTracking';

// Hand skeleton connections (MediaPipe standard)
const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],        // thumb
  [0,5],[5,6],[6,7],[7,8],        // index
  [0,9],[9,10],[10,11],[11,12],   // middle
  [0,13],[13,14],[14,15],[15,16], // ring
  [0,17],[17,18],[18,19],[19,20], // pinky
  [5,9],[9,13],[13,17],           // palm
];

const TIP_INDICES = [4, 8, 12, 16, 20];

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  tracking: TrackingState;
}

export default function CameraPanel({ videoRef, tracking }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw landmarks
      tracking.landmarks.forEach(hand => {
        if (!hand.length) return;
        const W = canvas.width;
        const H = canvas.height;

        // Mirror X (because video is mirrored)
        const px = (lm: { x: number; y: number }) => ({
          x: (1 - lm.x) * W,
          y: lm.y * H,
        });

        // Draw connections
        ctx.strokeStyle = 'rgba(232, 168, 85, 0.65)';
        ctx.lineWidth = 1.5;
        CONNECTIONS.forEach(([a, b]) => {
          if (!hand[a] || !hand[b]) return;
          const pa = px(hand[a]), pb = px(hand[b]);
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        });

        // Draw knuckle dots
        hand.forEach((lm, i) => {
          const p = px(lm);
          const isTip = TIP_INDICES.includes(i);
          ctx.beginPath();
          ctx.arc(p.x, p.y, isTip ? 5.5 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isTip ? '#ffffff' : 'rgba(232, 168, 85, 0.9)';
          ctx.fill();

          // Elegant subtle glow for fingertips
          if (isTip) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 10);
            grad.addColorStop(0, 'rgba(232,168,85,0.4)');
            grad.addColorStop(1, 'rgba(232,168,85,0)');
            ctx.fillStyle = grad;
            ctx.fill();
          }
        });
      });
    };

    draw();
  }, [tracking.landmarks]);

  const isLive = tracking.mode === 'live' || tracking.mode === 'demo';
  const handDetected = tracking.hands.length > 0;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Camera frame with glassmorphism and subtle gold glow */}
      <div
        className="relative flex-1 rounded-3xl overflow-hidden"
        style={{
          background: '#0a0806',
          border: '1px solid rgba(232,168,85,0.25)',
          boxShadow: isLive ? '0 0 35px rgba(232,168,85,0.12)' : 'none',
        }}
      >
        {/* Video feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)', display: isLive && tracking.mode === 'live' ? 'block' : 'none' }}
          muted
          playsInline
        />

        {/* Demo mode placeholder background */}
        {tracking.mode === 'demo' && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, #201712 0%, #0d0a08 100%)' }}
          >
            <div className="text-center select-none px-6">
              <div className="text-5xl mb-3 opacity-60">🖱️</div>
              <p className="text-white/80 font-medium text-sm">Demo Mode Active</p>
              <p className="text-white/40 text-xs mt-1">Move your mouse to control the virtual world</p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] text-[#e8a855] bg-[#e8a855]/10 border border-[#e8a855]/20">
                Left Click: Pinch/Scrub · Fast Move: Slap
              </div>
            </div>
          </div>
        )}

        {/* Idle state */}
        {(tracking.mode === 'idle' || tracking.mode === 'error') && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0a0806' }}>
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-30">📷</div>
              <p className="text-white/30 text-sm">Camera not started</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {tracking.mode === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0a0806' }}>
            <div className="text-center">
              <div
                className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-3"
                style={{ borderColor: '#e8a855', borderTopColor: 'transparent' }}
              />
              <p className="text-white/70 text-sm font-medium">Starting MediaPipe Vision...</p>
              <p className="text-white/30 text-xs mt-1">Loading AI model in local WebAssembly</p>
            </div>
          </div>
        )}

        {/* Canvas overlay for tracked skeleton */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ display: isLive ? 'block' : 'none' }}
        />

        {/* Live status HUD overlays */}
        {isLive && (
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-10">
            {/* Camera & Tracking Status */}
            <div className="flex flex-col gap-1.5">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide"
                style={{
                  background: 'rgba(10,8,6,0.85)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/90">
                  {tracking.mode === 'demo' ? 'SIMULATION: DEMO' : 'CAMERA: LIVE'}
                </span>
              </div>

              <div
                className="flex items-center gap-2 px-3 py-1 rounded-xl text-[11px]"
                style={{
                  background: 'rgba(10,8,6,0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: handDetected ? '#22c55e' : '#ef4444' }}
                />
                <span className="text-white/60">HAND:</span>
                <span className="font-bold" style={{ color: handDetected ? '#86efac' : '#fca5a5' }}>
                  {handDetected ? 'TRACKED' : 'SEARCHING'}
                </span>
              </div>
            </div>

            {/* Telemetry: Tracking %, FPS, Latency */}
            <div className="flex flex-col gap-1 items-end">
              <div
                className="px-2.5 py-1 rounded-lg text-xs flex items-center gap-2"
                style={{
                  background: 'rgba(10,8,6,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-white/40 text-[10px] tracking-wider">TRACKING</span>
                <span className="font-mono font-bold text-xs" style={{ color: '#e8a855' }}>
                  {handDetected ? `${tracking.confidence}%` : '0%'}
                </span>
              </div>

              <div
                className="px-2.5 py-0.5 rounded-lg text-[10px] flex items-center gap-2"
                style={{
                  background: 'rgba(10,8,6,0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span className="text-white/40">FPS</span>
                <span className="text-white font-mono font-bold">{tracking.fps || 30}</span>
                <span className="text-white/20">|</span>
                <span className="text-white/40">LATENCY</span>
                <span className="text-emerald-400 font-mono font-bold">{tracking.latency || 12}ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Hand tracking lost notification banner */}
        {isLive && !handDetected && (
          <div className="absolute bottom-14 left-4 right-4 flex justify-center pointer-events-none z-10 animate-fade-in">
            <div
              className="px-4 py-2 rounded-2xl text-xs text-amber-200/90 font-medium flex items-center gap-2 shadow-lg"
              style={{
                background: 'rgba(24, 18, 12, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(232, 168, 85, 0.35)',
              }}
            >
              <span>🖐️</span>
              <span>I can't see your hand. Move it into the camera frame.</span>
            </div>
          </div>
        )}

        {/* Privacy badge */}
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center pointer-events-none z-10">
          <p className="text-white/35 text-[10px] tracking-wide flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
            <span>🔒</span>
            <span>Your camera feed stays in your browser and is not recorded.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
