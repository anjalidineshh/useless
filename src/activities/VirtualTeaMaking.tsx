import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const steps = [
  'Fill pan with water', 
  'Turn stove on', 
  'Add water to pan', 
  'Add tea leaves', 
  'Add milk', 
  'Add sugar', 
  'Stir it well', 
  'Wait for boil', 
  'Pour into cup'
];
const stepEmojis = ['🫙', '🔥', '💧', '🍃', '🥛', '🍬', '🥄', '⏳', '☕'];

const VirtualTeaMaking: React.FC<Props> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [strength, setStrength] = useState(50);
  const [sweetness, setSweetness] = useState(50);
  const [stirCount, setStirCount] = useState(0);
  const [boiling, setBoiling] = useState(false);
  const [boiledOver, setBoiledOver] = useState(false);
  const [teaCups, setTeaCups] = useState(0);
  const [cupFill, setCupFill] = useState(0);

  const isLastStep = currentStep === steps.length - 1;
  const isDone = currentStep >= steps.length;

  useEffect(() => {
    if (currentStep === 7) { // Wait for boil
      setBoiling(true);
      if (Math.random() < 0.15) {
        setBoiledOver(true);
      }
      const timer = setTimeout(() => {
        setBoiling(false);
        setCurrentStep(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === 6 && stirCount < 5) return;
    
    if (isLastStep) {
      setCupFill(100);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setTeaCups(prev => prev + 1);
      }, 1500);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const resetProcess = () => {
    setCurrentStep(0);
    setStirCount(0);
    setBoiledOver(false);
    setCupFill(0);
  };

  let strLabel = 'Good';
  if (strength < 30) strLabel = 'Dishwater';
  else if (strength <= 50) strLabel = 'Decent';
  else if (strength <= 70) strLabel = 'Good';
  else if (strength <= 85) strLabel = 'Strong';
  else strLabel = 'Mud';

  let sweetLabel = 'Balanced';
  if (sweetness < 30) sweetLabel = 'Barely sweet';
  else if (sweetness <= 60) sweetLabel = 'Balanced';
  else if (sweetness <= 80) sweetLabel = 'Sweet';
  else sweetLabel = 'Dessert';

  return (
    <div className="cream-surface p-6 rounded-xl relative overflow-hidden text-[#2a1f0f] flex flex-col items-center w-full">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">✕</button>
      
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#e8a855]">Chai Time</h2>
        <span className="text-sm font-semibold bg-[#e8a855]/20 px-3 py-1 rounded-full text-[#b37a34]">
          Cups of tea: {teaCups}
        </span>
      </div>

      {!isDone ? (
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <div className="w-full flex gap-4">
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1">STRENGTH: {strLabel}</label>
              <input 
                type="range" min="0" max="100" 
                value={strength} 
                onChange={e => setStrength(Number(e.target.value))}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
                disabled={currentStep > 3}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1">SWEETNESS: {sweetLabel}</label>
              <input 
                type="range" min="0" max="100" 
                value={sweetness} 
                onChange={e => setSweetness(Number(e.target.value))}
                className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer"
                disabled={currentStep > 5}
              />
            </div>
          </div>

          <div className="bg-white/50 w-full p-8 rounded-2xl flex flex-col items-center shadow-inner border border-amber-100/50 min-h-[220px] justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center"
              >
                <div className="text-6xl mb-4 relative">
                  {stepEmojis[currentStep]}
                  {boiling && (
                    <motion.div 
                      className="absolute -top-4 -right-4 text-2xl"
                      animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      🫧
                    </motion.div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-6">{steps[currentStep]}</h3>
                
                {currentStep === 6 ? (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStirCount(c => c + 1)}
                      className="px-4 py-2 bg-[#e8a855]/20 hover:bg-[#e8a855]/40 text-[#a36d22] font-bold rounded-lg transition-colors"
                    >
                      Stir! ({stirCount}/5)
                    </button>
                    <button 
                      onClick={handleNext}
                      disabled={stirCount < 5}
                      className="px-6 py-2 bg-[#e8a855] disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>
                ) : currentStep === 7 ? (
                  <div className="text-center">
                    <p className="text-gray-500 animate-pulse">Boiling...</p>
                    {boiledOver && <p className="text-red-500 font-bold mt-2 text-sm">You have created a kitchen disaster.</p>}
                  </div>
                ) : currentStep === 8 ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="w-16 h-20 border-4 border-gray-300 border-t-0 rounded-b-xl relative overflow-hidden mb-4 bg-white">
                      <motion.div 
                        className="absolute bottom-0 left-0 right-0 bg-[#8b4513]"
                        animate={{ height: `${cupFill}%` }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </div>
                    <button 
                      onClick={handleNext}
                      disabled={cupFill > 0}
                      className="px-6 py-2 bg-[#e8a855] disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors"
                    >
                      Pour it!
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleNext}
                    className="px-6 py-2 bg-[#e8a855] text-white font-bold rounded-lg hover:bg-[#d99b4a] transition-colors"
                  >
                    Done
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-8 w-full"
        >
          <div className="text-2xl font-bold text-[#8b4513] mb-6">TEA READY ☕</div>
          
          <div className="w-24 h-32 border-4 border-gray-300 border-t-0 rounded-b-xl relative overflow-hidden mb-8 shadow-lg bg-white">
            <div className="absolute bottom-0 left-0 right-0 bg-[#8b4513] h-full" />
            <div className="absolute top-2 left-2 w-8 h-2 bg-white/20 rounded-full" />
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button 
              onClick={resetProcess}
              className="px-6 py-3 bg-[#e8a855]/20 text-[#a36d22] font-bold rounded-lg hover:bg-[#e8a855]/30 transition-colors w-full"
            >
              MAKE ANOTHER ONE
            </button>
            {teaCups >= 1 && (
              <button 
                onClick={onComplete}
                className="px-6 py-3 bg-[#e8a855] text-white font-bold rounded-lg hover:bg-[#d99b4a] transition-colors shadow-md w-full"
              >
                Drink & Finish
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
export default VirtualTeaMaking;
