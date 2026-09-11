import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const items = [
  { id: 'shirt', label: 'T-Shirt', emoji: '👕' },
  { id: 'pants', label: 'Pants', emoji: '👖' },
  { id: 'towel', label: 'Towel', emoji: '🏖️' },
  { id: 'sockL', label: 'Left Sock', emoji: '🧦' },
  { id: 'sockR', label: 'Right Sock', emoji: '🧦' }
];

export default function VirtualLaundryFolding({ onComplete, onClose }: Props) {
  const [folded, setFolded] = useState<string[]>([]);
  const [neatness, setNeatness] = useState(100);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  const handleFold = () => {
    if (!selectedItem) return;
    setFolded(prev => [...prev, selectedItem]);
    setNeatness(prev => Math.max(0, prev - Math.floor(Math.random() * 16)));
    setSelectedItem(null);
  };

  const unfoldedItems = items.filter(i => !folded.includes(i.id));
  const done = folded.length === items.length;

  return (
    <div className="cream-surface p-6 rounded-lg text-[#2a1f0f]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Virtual Laundry Folding</h2>
        <button onClick={onClose} className="text-sm font-semibold hover:opacity-70">Close</button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-bold">FOLDING QUALITY: {neatness}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${neatness < 60 ? 'bg-red-500' : 'bg-[#e8a855]'}`} 
            style={{ width: `${neatness}%` }}
          />
        </div>
        {neatness < 60 && (
          <p className="text-red-600 text-xs mt-1 font-semibold">Your mother would not approve.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 min-h-[300px]">
        {/* Pile */}
        <div className="bg-white/50 rounded-xl p-4 border border-[#e8a855]/30 flex flex-col relative">
          <h3 className="font-bold text-lg mb-4">Pile</h3>
          <div className="flex-1 relative">
            <AnimatePresence>
              {unfoldedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: index * 5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedItem(item.id)}
                  className={`absolute top-0 left-0 right-0 p-4 rounded-lg cursor-pointer shadow-sm border transition-all ${selectedItem === item.id ? 'border-[#e8a855] bg-[#e8a855]/10 z-20 scale-105' : 'border-gray-200 bg-white z-10 hover:border-[#e8a855]/50'}`}
                  style={{ top: `${index * 15}px` }}
                >
                  <span className="text-2xl mr-2">{item.emoji}</span>
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <button
            onClick={handleFold}
            disabled={!selectedItem}
            className={`mt-auto py-3 rounded-xl font-bold transition-colors ${selectedItem ? 'bg-[#e8a855] text-white hover:bg-[#d0964b]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            Fold it!
          </button>
        </div>

        {/* Folded Stack */}
        <div className="bg-white/50 rounded-xl p-4 border border-[#e8a855]/30 flex flex-col items-center justify-end">
          <h3 className="font-bold text-lg mb-auto w-full text-left">Folded Stack</h3>
          <div className="flex flex-col-reverse items-center pb-4">
            {items.filter(i => folded.includes(i.id)).map((item) => (
              <motion.div
                key={`folded-${item.id}`}
                layoutId={item.id}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white border border-[#e8a855]/50 px-6 py-2 rounded-md shadow-sm mb-[-10px] z-10 w-32 text-center"
              >
                <span className="text-xl">{item.emoji}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
          <p className="text-xl font-bold mb-4">Perfectly folded. Completely unnecessary.</p>
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
