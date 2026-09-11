import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type Item = { id: number; label: string; emoji: string; placed: boolean; x: number; y: number };

const INITIAL_ITEMS: Item[] = [
  { id: 1, label: 'shirt', emoji: '👕', placed: false, x: 10, y: 20 },
  { id: 2, label: 'book', emoji: '📚', placed: false, x: 80, y: 15 },
  { id: 3, label: 'bottle', emoji: '🍾', placed: false, x: 40, y: 70 },
  { id: 4, label: 'shoe', emoji: '👟', placed: false, x: 20, y: 80 },
  { id: 5, label: 'bag', emoji: '👜', placed: false, x: 70, y: 60 },
  { id: 6, label: 'paper', emoji: '📄', placed: false, x: 50, y: 30 },
  { id: 7, label: 'pillow', emoji: '🛋️', placed: false, x: 85, y: 85 },
];

export const VirtualRoomCleaning: React.FC<{ onComplete: () => void; onClose: () => void }> = ({ onComplete, onClose }) => {
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [selected, setSelected] = useState<number | null>(null);
  const [showSock, setShowSock] = useState(false);
  const [brooming, setBrooming] = useState(false);

  const placedCount = items.filter(i => i.placed).length;
  const isRoomClean = placedCount === items.length;

  useEffect(() => {
    if (isRoomClean) {
      const timer = setTimeout(() => setShowSock(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isRoomClean]);

  const handleItemClick = (id: number) => {
    if (!isRoomClean) setSelected(id);
  };

  const handleDropZone = () => {
    if (selected !== null) {
      setItems(items.map(item => item.id === selected ? { ...item, placed: true } : item));
      setSelected(null);
    }
  };

  const handleBroom = () => {
    setBrooming(true);
    setTimeout(() => setBrooming(false), 2000);
  };

  return (
    <div className="cream-surface p-6 text-[#2a1f0f] relative max-w-lg mx-auto rounded-lg shadow-md bg-[#fdfbf7] h-[500px] flex flex-col">
      <button onClick={onClose} className="absolute top-2 right-2 text-sm text-gray-500 hover:text-gray-800 z-50">Close</button>
      <h2 className="text-xl font-bold mb-2">Virtual Room Cleaning</h2>
      <p className="mb-2 text-sm font-semibold">{placedCount} / {items.length} items cleared</p>

      <div className="flex-grow relative bg-gray-100 border-2 border-gray-300 rounded overflow-hidden">
        {/* Drop zones */}
        <div 
          className="absolute top-2 left-2 w-16 h-16 bg-red-200 border-2 border-red-400 rounded flex items-center justify-center text-2xl cursor-pointer hover:bg-red-300"
          onClick={handleDropZone}
        >
          🗑️
        </div>
        <div 
          className="absolute top-2 right-2 w-16 h-16 bg-blue-200 border-2 border-blue-400 rounded flex items-center justify-center text-2xl cursor-pointer hover:bg-blue-300"
          onClick={handleDropZone}
        >
          🗄️
        </div>

        {/* Items */}
        {items.map(item => !item.placed && (
          <motion.div
            key={item.id}
            className={`absolute text-3xl cursor-pointer transition-all ${selected === item.id ? 'drop-shadow-[0_0_8px_rgba(232,168,85,0.8)] scale-110 z-10' : ''}`}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            onClick={() => handleItemClick(item.id)}
            exit={{ scale: 0, opacity: 0 }}
          >
            {item.emoji}
          </motion.div>
        ))}

        {isRoomClean && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <motion.h3 initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-3xl font-bold text-green-600 bg-white px-4 py-2 rounded shadow">
               ROOM CLEAN
             </motion.h3>
          </div>
        )}

        {showSock && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-4 right-4 flex flex-col items-center">
             <span className="text-4xl">🧦</span>
             <span className="bg-white text-xs px-2 py-1 rounded shadow mt-1">You missed something.</span>
          </motion.div>
        )}

        {brooming && (
          <motion.div 
            initial={{ opacity: 1 }} 
            animate={{ opacity: 0 }} 
            transition={{ duration: 2 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gray-400 rounded-full"
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  opacity: 0
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button onClick={handleBroom} disabled={brooming} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 font-bold">
          🧹 Broom
        </button>
        {isRoomClean && (
          <button onClick={onComplete} className="px-6 py-2 bg-[#e8a855] text-white rounded font-bold hover:bg-[#d89845]">
            Finish
          </button>
        )}
      </div>
    </div>
  );
};

export default VirtualRoomCleaning;
