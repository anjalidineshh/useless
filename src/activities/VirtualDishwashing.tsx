import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const initialDishes = [
  { id: 'plate', emoji: '🍽️', label: 'Plate' },
  { id: 'cup', emoji: '☕', label: 'Cup' },
  { id: 'spoon', emoji: '🥄', label: 'Spoon' },
  { id: 'bowl', emoji: '🥣', label: 'Bowl' },
  { id: 'pan', emoji: '🍳', label: 'Pan' }
];

export default function VirtualDishwashing({ onComplete, onClose }: Props) {
  const [dishStates, setDishStates] = useState<Record<string, 'dirty' | 'scrubbing' | 'rinsed' | 'clean'>>(
    initialDishes.reduce((acc, d) => ({ ...acc, [d.id]: 'dirty' }), {})
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [scrubCount, setScrubCount] = useState<Record<string, number>>({});
  const [onRack, setOnRack] = useState<string[]>([]);
  const [lastSpoonAppeared, setLastSpoonAppeared] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);

  const selectedDish = initialDishes.find(d => d.id === selected) || (selected === 'lastSpoon' ? { id: 'lastSpoon', emoji: '🥄', label: 'Spoon' } : null);

  useEffect(() => {
    if (onRack.length === 5 && !lastSpoonAppeared) {
      const timer = setTimeout(() => {
        setLastSpoonAppeared(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [onRack.length, lastSpoonAppeared]);

  const handleAddSoap = () => {
    if (selected && dishStates[selected] === 'dirty') {
      setDishStates(prev => ({ ...prev, [selected]: 'scrubbing' }));
      setScrubCount(prev => ({ ...prev, [selected]: 0 }));
    }
  };

  const handleScrub = () => {
    if (selected && dishStates[selected] === 'scrubbing') {
      setShowBubbles(true);
      setTimeout(() => setShowBubbles(false), 300);
      setScrubCount(prev => {
        const count = (prev[selected] || 0) + 20;
        return { ...prev, [selected]: Math.min(count, 100) };
      });
    }
  };

  const handleRinse = () => {
    if (selected && scrubCount[selected] === 100) {
      setDishStates(prev => ({ ...prev, [selected]: 'rinsed' }));
    }
  };

  const handleToRack = () => {
    if (selected && dishStates[selected] === 'rinsed') {
      setDishStates(prev => ({ ...prev, [selected]: 'clean' }));
      setOnRack(prev => [...prev, selected]);
      setSelected(null);
    }
  };

  const handleLastSpoon = () => {
    setOnRack(prev => [...prev, 'lastSpoon']);
    setLastSpoonAppeared(false);
  };

  const sinkEmpty = onRack.length >= 5 && !lastSpoonAppeared;

  return (
    <div className="cream-surface p-6 rounded-lg text-[#2a1f0f]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Virtual Dishwashing</h2>
        <button onClick={onClose} className="text-sm font-semibold hover:opacity-70">Close</button>
      </div>

      <div className="grid grid-cols-2 gap-6 min-h-[350px]">
        {/* Sink */}
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 flex flex-col relative overflow-hidden">
          <h3 className="font-bold text-lg mb-4 text-blue-900">Sink</h3>
          
          {sinkEmpty ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="font-bold text-blue-400">SINK STATUS: EMPTY</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1">
              {initialDishes.filter(d => !onRack.includes(d.id)).map(dish => (
                <button
                  key={dish.id}
                  onClick={() => setSelected(dish.id)}
                  className={`p-3 rounded-lg text-left flex items-center gap-3 transition-colors ${selected === dish.id ? 'bg-blue-200 border-blue-400' : 'bg-white hover:bg-blue-100'} border`}
                >
                  <span className="text-2xl">{dish.emoji}</span>
                  <span className="font-medium">{dish.label}</span>
                  <span className="ml-auto text-xs font-bold text-gray-500 uppercase">{dishStates[dish.id]}</span>
                </button>
              ))}
              
              {lastSpoonAppeared && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center cursor-pointer hover:bg-red-100" onClick={handleLastSpoon}>
                  <p className="text-sm font-bold text-red-600 mb-2">You forgot one.</p>
                  <span className="text-4xl">🥄</span>
                </motion.div>
              )}
            </div>
          )}

          {/* Selected Dish Workflow */}
          {selected && !lastSpoonAppeared && (
            <div className="mt-4 p-4 bg-white rounded-lg border shadow-sm relative">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{selectedDish?.emoji}</span>
                <div className="flex-1">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${scrubCount[selected] || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleAddSoap} 
                  disabled={dishStates[selected] !== 'dirty'}
                  className="p-2 text-sm bg-blue-100 rounded disabled:opacity-50 font-bold"
                >Add Soap</button>
                <button 
                  onClick={handleScrub} 
                  disabled={dishStates[selected] !== 'scrubbing'}
                  className="p-2 text-sm bg-yellow-100 rounded disabled:opacity-50 font-bold"
                >Scrub!</button>
                <button 
                  onClick={handleRinse} 
                  disabled={dishStates[selected] !== 'scrubbing' || scrubCount[selected] < 100}
                  className="p-2 text-sm bg-cyan-100 rounded disabled:opacity-50 font-bold"
                >Rinse</button>
                <button 
                  onClick={handleToRack} 
                  disabled={dishStates[selected] !== 'rinsed'}
                  className="p-2 text-sm bg-green-100 rounded disabled:opacity-50 font-bold"
                >To Rack</button>
              </div>

              {/* Bubbles animation */}
              <AnimatePresence>
                {showBubbles && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none flex items-center justify-center text-4xl"
                  >
                    🫧
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Rack */}
        <div className="bg-white/50 rounded-xl p-4 border border-[#e8a855]/30 flex flex-col">
          <h3 className="font-bold text-lg mb-4">Drying Rack</h3>
          <div className="flex-1 flex flex-wrap-reverse items-end content-end gap-2">
            {onRack.map((id, i) => {
              const d = id === 'lastSpoon' ? { emoji: '🥄' } : initialDishes.find(x => x.id === id);
              return (
                <motion.div
                  key={`${id}-${i}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl p-2 bg-white rounded shadow-sm border"
                >
                  {d?.emoji}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {onRack.length > 5 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
          <button 
            onClick={onComplete}
            className="bg-[#e8a855] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#d0964b]"
          >
            Finish
          </button>
        </motion.div>
      )}
    </div>
  );
}
