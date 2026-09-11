import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function AchievementsPanel({ onClose }: { onClose: () => void }) {
  const { achievements } = useGameStore();
  const unlocked = achievements.filter(a => a.unlocked).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: 'rgba(10,8,6,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg max-h-[70vh] overflow-y-auto glass-card p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl text-white">Your Useless Achievements</h2>
            <p className="text-white/40 text-sm">{unlocked} / {achievements.length} unlocked</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-2xl">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {achievements.map((ach) => (
            <motion.div
              key={ach.id}
              layout
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                ach.unlocked
                  ? 'bg-amber-warm/10 border border-amber-warm/30'
                  : 'bg-white/5 border border-white/10 opacity-50'
              }`}
            >
              <div className={`text-3xl ${ach.unlocked ? '' : 'grayscale opacity-30'}`}>
                {ach.unlocked ? ach.emoji : '🔒'}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${ach.unlocked ? 'text-amber-warm' : 'text-white/40'}`}>
                  {ach.title}
                </p>
                <p className="text-white/40 text-xs mt-0.5">{ach.description}</p>
              </div>
              {ach.unlocked && (
                <span className="text-green-400 text-xs font-bold">✓</span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
