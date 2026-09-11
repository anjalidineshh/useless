import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import HUD from '../components/HUD';
import BottomNav from '../components/BottomNav';

// Activity imports
import VirtualBath from '../activities/VirtualBath';
import VirtualBucketBath from '../activities/VirtualBucketBath';
import VirtualClothesWashing from '../activities/VirtualClothesWashing';
import VirtualRoomCleaning from '../activities/VirtualRoomCleaning';
import VirtualToothBrushing from '../activities/VirtualToothBrushing';
import VirtualHairWashing from '../activities/VirtualHairWashing';
import VirtualLaundryFolding from '../activities/VirtualLaundryFolding';
import VirtualBedMaking from '../activities/VirtualBedMaking';
import VirtualDishwashing from '../activities/VirtualDishwashing';
import VirtualShowerTemperature from '../activities/VirtualShowerTemperature';
import VirtualMosquitoSlapping from '../activities/VirtualMosquitoSlapping';
import VirtualTeaMaking from '../activities/VirtualTeaMaking';

const ROOMS: Record<string, {
  label: string;
  emoji: string;
  bg: string;
  activities: Activity[];
  description: string;
}> = {
  bathroom: {
    label: 'Bathroom',
    emoji: '🚿',
    bg: 'from-blue-950/80 to-slate-900/80',
    description: 'Smells like eucalyptus. Or maybe mildew.',
    activities: [
      { id: 'bath', label: 'Virtual Bath', emoji: '🛁', points: 8, description: 'A full immersive bathing experience. For your mouse.' },
      { id: 'bucket_bath', label: 'Bucket Bath', emoji: '🪣', points: 6, description: 'Bucket. Mug. Dignity optional.' },
      { id: 'tooth_brushing', label: 'Tooth Brushing', emoji: '🦷', points: 5, description: 'Your virtual teeth deserve better.' },
      { id: 'hair_washing', label: 'Hair Washing', emoji: '💆', points: 7, description: 'Suds. Rinse. Repeat. Why.' },
      { id: 'shower_temperature', label: 'Shower Temperature', emoji: '🌡️', points: 4, description: 'The eternal struggle.' },
    ],
  },
  bedroom: {
    label: 'Bedroom',
    emoji: '🛏️',
    bg: 'from-purple-950/80 to-slate-900/80',
    description: 'Chaos lives here. Also your socks.',
    activities: [
      { id: 'room_cleaning', label: 'Room Cleaning', emoji: '🧹', points: 10, description: 'Drag virtual trash to virtual bin.' },
      { id: 'bed_making', label: 'Bed Making', emoji: '🛏️', points: 6, description: 'Perfect corners. Pointless perfection.' },
      { id: 'mosquito_slapping', label: 'Mosquito Slapping', emoji: '🦟', points: 9, description: 'They come. They beep. You suffer.' },
    ],
  },
  kitchen: {
    label: 'Kitchen',
    emoji: '🍳',
    bg: 'from-orange-950/80 to-amber-950/80',
    description: 'Tea is law. Also dishes.',
    activities: [
      { id: 'dishwashing', label: 'Dishwashing', emoji: '🍽️', points: 8, description: 'Scrub. Rinse. Stack. Meaning: none.' },
      { id: 'tea_making', label: 'Tea Making', emoji: '☕', points: 10, description: 'Chai. The entire process. Digitally.' },
    ],
  },
  laundry: {
    label: 'Laundry',
    emoji: '👕',
    bg: 'from-teal-950/80 to-slate-900/80',
    description: 'The pile grows. You fold. It grows again.',
    activities: [
      { id: 'clothes_washing', label: 'Clothes Washing', emoji: '🫧', points: 8, description: 'Scrub. Wring. Hang. Weep.' },
      { id: 'laundry_folding', label: 'Laundry Folding', emoji: '🧺', points: 7, description: 'Fold with purpose. Accomplish nothing.' },
    ],
  },
};

interface Activity {
  id: string;
  label: string;
  emoji: string;
  points: number;
  description: string;
}

const ACTIVITY_MAP: Record<string, React.ComponentType<{ onComplete: () => void; onClose: () => void }>> = {
  bath: VirtualBath,
  bucket_bath: VirtualBucketBath,
  clothes_washing: VirtualClothesWashing,
  room_cleaning: VirtualRoomCleaning,
  tooth_brushing: VirtualToothBrushing,
  hair_washing: VirtualHairWashing,
  laundry_folding: VirtualLaundryFolding,
  bed_making: VirtualBedMaking,
  dishwashing: VirtualDishwashing,
  shower_temperature: VirtualShowerTemperature,
  mosquito_slapping: VirtualMosquitoSlapping,
  tea_making: VirtualTeaMaking,
};

export default function ApartmentPage() {
  const navigate = useNavigate();
  const { currentRoom, completedActivities, completeActivity, getUselessnessPercent } = useGameStore();
  const [activeActivity, setActiveActivity] = useState<string | null>(null);

  const room = ROOMS[currentRoom] ?? ROOMS.bathroom;
  const uselessness = getUselessnessPercent();

  // Navigate to final screen when all done
  if (uselessness >= 100 && !activeActivity) {
    navigate('/done');
  }

  const handleActivityComplete = (id: string) => {
    completeActivity(id);
    setActiveActivity(null);
  };

  const ActivityComponent = activeActivity ? ACTIVITY_MAP[activeActivity] : null;

  return (
    <motion.div
      key="apartment"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen overflow-hidden"
      style={{ background: '#1a1410' }}
    >
      {/* Room background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${room.bg} transition-all duration-700`} />

      {/* Room illustration area */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top area */}
        <div className="flex items-start justify-between p-4 md:p-6">
          <HUD />
          <div className="glass-card px-4 py-2 text-right">
            <p className="text-white/40 text-xs tracking-widest uppercase">Current Location</p>
            <p className="text-white font-display text-lg">{room.emoji} {room.label}</p>
          </div>
        </div>

        {/* Main room view */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
          {/* Room scene */}
          <motion.div
            key={currentRoom}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            {/* Room card */}
            <div className="glass-card p-8 text-center mb-6 relative overflow-hidden">
              {/* Big emoji scene */}
              <div className="text-8xl mb-4 select-none">{room.emoji}</div>
              <h2 className="font-display text-3xl text-white mb-2">{room.label}</h2>
              <p className="text-white/40 italic text-sm mb-6">{room.description}</p>

              {/* Activities grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.activities.map((activity) => {
                  const done = completedActivities.includes(activity.id);
                  return (
                    <motion.button
                      key={activity.id}
                      whileHover={!done ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!done ? { scale: 0.98 } : {}}
                      onClick={() => !done && setActiveActivity(activity.id)}
                      className={`relative p-4 rounded-2xl text-left transition-all duration-300 ${
                        done
                          ? 'opacity-60 cursor-default'
                          : 'cursor-pointer hover:shadow-lg'
                      }`}
                      style={{
                        background: done
                          ? 'rgba(126, 200, 126, 0.15)'
                          : 'rgba(245, 240, 232, 0.08)',
                        border: done
                          ? '1px solid rgba(126, 200, 126, 0.4)'
                          : '1px solid rgba(245, 240, 232, 0.15)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{activity.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm">{activity.label}</p>
                          <p className="text-white/40 text-xs mt-0.5 truncate">{activity.description}</p>
                        </div>
                        {done ? (
                          <span className="text-green-400 text-lg">✓</span>
                        ) : (
                          <span className="text-amber-warm text-xs font-bold">+{activity.points}</span>
                        )}
                      </div>
                      {done && (
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
                          <span className="text-green-400 text-xs font-bold tracking-widest bg-green-400/10 px-3 py-1 rounded-full">
                            COMPLETED
                          </span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Completion status */}
            <div className="text-center text-white/30 text-xs tracking-wider">
              {completedActivities.length} / 12 activities completed
              {completedActivities.length === 12 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2"
                >
                  <button
                    onClick={() => navigate('/done')}
                    className="btn-primary text-sm px-6 py-2"
                    style={{ background: '#e8a855', color: '#1a1410' }}
                  >
                    SEE FINAL RESULTS 🏆
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom navigation */}
      <BottomNav rooms={Object.entries(ROOMS).map(([id, r]) => ({ id, label: r.label, emoji: r.emoji }))} />

      {/* Activity modal */}
      <AnimatePresence>
        {activeActivity && ActivityComponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 activity-backdrop flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <ActivityComponent
                onComplete={() => handleActivityComplete(activeActivity)}
                onClose={() => setActiveActivity(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
