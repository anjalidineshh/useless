import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EVENTS = [
  { emoji: '🧺', message: 'Your virtual laundry is still wet.' },
  { emoji: '☕', message: 'Your virtual tea is getting cold.' },
  { emoji: '🦟', message: 'A mosquito has entered the kitchen.' },
  { emoji: '📱', message: 'Your virtual phone is ringing. No one important.' },
  { emoji: '🧦', message: 'A random sock has appeared on the floor.' },
  { emoji: '🛁', message: 'Someone left the virtual tap running.' },
  { emoji: '🍽️', message: "There's a dish in the sink. Just one. It's judging you." },
  { emoji: '🛏️', message: 'Your pillow moved. Slightly. Ominously.' },
  { emoji: '☕', message: 'The tea cup tipped over. Virtually.' },
  { emoji: '💧', message: "Drip. Drip. That's the tap." },
];

export default function RandomEvents() {
  const [currentEvent, setCurrentEvent] = useState<typeof EVENTS[0] | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Start random events after 30 seconds of any usage
    const firstTimer = setTimeout(() => {
      setActive(true);
    }, 30000);
    return () => clearTimeout(firstTimer);
  }, []);

  useEffect(() => {
    if (!active) return;

    const show = () => {
      const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      setCurrentEvent(event);
      setTimeout(() => setCurrentEvent(null), 4000);
    };

    show();
    const interval = setInterval(() => {
      if (Math.random() > 0.4) show();
    }, 45000);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="fixed bottom-24 left-4 z-40 pointer-events-none">
      <AnimatePresence>
        {currentEvent && (
          <motion.div
            initial={{ opacity: 0, x: -60, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-card-dark p-3 flex items-center gap-3 max-w-[260px]"
          >
            <span className="text-2xl">{currentEvent.emoji}</span>
            <p className="text-white/70 text-xs italic">{currentEvent.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
