import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

interface Room { id: string; label: string; emoji: string; }

export default function BottomNav({ rooms }: { rooms: Room[] }) {
  const { currentRoom, setCurrentRoom, getUselessnessPercent, setShowAchievements, soundEnabled, toggleSound } = useGameStore();
  const pct = getUselessnessPercent();

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
        className="glass-card-dark flex items-center gap-1 px-3 py-2"
        style={{ maxWidth: '100%', overflowX: 'auto' }}
      >
        {/* Room buttons */}
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setCurrentRoom(room.id)}
            className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] ${
              currentRoom === room.id
                ? 'bg-amber-warm/20 text-amber-warm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <span className="text-lg">{room.emoji}</span>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">{room.label}</span>
          </button>
        ))}

        <div className="w-px h-8 bg-white/10 mx-1 flex-shrink-0" />

        {/* Uselessness counter (clickable → achievements) */}
        <button
          onClick={() => setShowAchievements(true)}
          className="flex flex-col items-center px-3 py-2 rounded-xl hover:bg-white/5 transition-all min-w-[64px]"
        >
          <span className="text-amber-warm text-xs font-bold">{pct}%</span>
          <span className="text-white/40 text-[10px]">useless</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/5 text-white/50 hover:text-white/80 transition-all"
          title={soundEnabled ? 'Sound ON' : 'Sound OFF'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </motion.div>
    </div>
  );
}
