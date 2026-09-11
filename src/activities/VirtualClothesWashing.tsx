import React, { useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = ['Pick up clothes', 'Put in bucket', 'Add detergent', 'Scrub', 'Rinse', 'Wring', 'Hang to dry'];

export const VirtualClothesWashing: React.FC<{ onComplete: () => void; onClose: () => void }> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scrubProgress, setScrubProgress] = useState(0);
  
  const isDone = currentStep >= STEPS.length;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setCurrentStep(STEPS.length);
    }
  };

  const handleScrub = () => {
    setScrubProgress(prev => Math.min(100, prev + 8));
  };

  const canProceed = currentStep !== 3 || scrubProgress >= 100;

  return (
    <div className="cream-surface p-6 text-[#2a1f0f] relative max-w-lg mx-auto rounded-lg shadow-md bg-[#fdfbf7]">
      <button onClick={onClose} className="absolute top-2 right-2 text-sm text-gray-500 hover:text-gray-800">Close</button>
      <h2 className="text-xl font-bold mb-4">Virtual Clothes Washing</h2>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {STEPS.map((step, idx) => (
          <div key={idx} className={`flex-shrink-0 px-3 py-1 text-sm rounded ${idx === currentStep ? 'bg-[#e8a855] text-white font-bold' : idx < currentStep ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
            {idx + 1}. {step}
          </div>
        ))}
      </div>

      <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded mb-6 relative overflow-hidden">
        {currentStep < 6 && (
          <motion.div 
            className="w-32 h-24 rounded-lg bg-gray-600 flex items-center justify-center relative"
            animate={{ backgroundColor: currentStep >= 4 ? '#a0aec0' : '#4a5568' }}
          >
             {currentStep === 3 && scrubProgress > 20 && (
                <div className="absolute -top-4 w-full flex justify-around">
                  {[1, 2, 3].map(i => (
                    <motion.div 
                      key={i}
                      className="w-4 h-4 bg-white rounded-full opacity-80"
                      animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
             )}
          </motion.div>
        )}
        
        {currentStep >= 6 && (
          <div className="flex w-full items-center justify-center space-x-4">
             <div className="w-full h-1 bg-gray-400 absolute top-1/4"></div>
             <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="w-16 h-20 bg-[#a0aec0] rounded-md z-10 shadow" />
             <motion.div initial={{ y: -50 }} animate={{ y: 0 }} transition={{ delay: 0.2 }} className="w-16 h-20 bg-[#a0aec0] rounded-md z-10 shadow" />
          </div>
        )}
      </div>

      {currentStep === 3 && (
        <div className="mb-6 flex flex-col items-center">
          <div className="w-full bg-gray-200 h-4 rounded mb-2 overflow-hidden">
            <div className="bg-[#e8a855] h-full transition-all" style={{ width: `${scrubProgress}%` }} />
          </div>
          <p className="font-bold mb-2">SCRUBBING: {scrubProgress}%</p>
          <button onClick={handleScrub} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Scrub!</button>
        </div>
      )}

      {isDone ? (
        <div className="text-center">
          <p className="font-bold text-lg mb-1">Your virtual clothes are now clean.</p>
          <p className="italic text-xs text-gray-500 mb-4">Your real clothes remain dirty.</p>
          <button onClick={onComplete} className="px-6 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600 transition-colors">Finish</button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button 
            onClick={handleNext}
            disabled={!canProceed}
            className={`px-6 py-2 rounded font-bold transition-colors ${canProceed ? 'bg-[#e8a855] text-white hover:bg-[#d89845]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default VirtualClothesWashing;
