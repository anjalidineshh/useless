import { useGameStore } from '../store/gameStore';

export default function HUD() {
  const { completedActivities, getUselessnessPercent } = useGameStore();
  const pct = getUselessnessPercent();
  const done = completedActivities.length;
  const total = 12;

  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="glass-card px-4 py-3 flex items-center gap-4">
      {/* Progress ring */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="progress-ring w-12 h-12" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20" fill="none"
            stroke="#e8a855"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-amber-warm text-xs font-bold">{pct}%</span>
        </div>
      </div>

      <div>
        <p className="text-white/40 text-xs tracking-widest uppercase">Today's Uselessness</p>
        <p className="text-white text-sm font-medium">{done} / {total} activities</p>
        {pct >= 100 && (
          <p className="text-green-400 text-xs font-bold">COMPLETE! 🎉</p>
        )}
      </div>
    </div>
  );
}
