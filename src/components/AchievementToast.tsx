import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function AchievementToast() {
  const { newAchievement, clearNewAchievement } = useGameStore();

  useEffect(() => {
    if (newAchievement) {
      const t = setTimeout(clearNewAchievement, 4000);
      return () => clearTimeout(t);
    }
  }, [newAchievement]);

  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-none">
      <AnimatePresence>
        {newAchievement && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-card p-4 flex items-center gap-3 max-w-xs"
            style={{ border: '1px solid rgba(232,168,85,0.4)', background: 'rgba(26,20,16,0.9)' }}
          >
            <div className="text-3xl">{newAchievement.emoji}</div>
            <div>
              <p className="text-amber-warm text-xs font-bold tracking-widest uppercase">Achievement Unlocked!</p>
              <p className="text-white font-medium text-sm">{newAchievement.title}</p>
              <p className="text-white/50 text-xs">{newAchievement.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
