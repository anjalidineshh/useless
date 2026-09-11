import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const stepsList = ['Pull bedsheet', 'Fix corners', 'Place pillows', 'Straighten blanket', 'Arrange cushions'];

export default function VirtualBedMaking({ onComplete, onClose }: Props) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [messed, setMessed] = useState(false);

  const handleStep = (step: string) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
  };

  const handleMessItUp = () => {
    setMessed(true);
    setCompletedSteps([]);
  };

  const handleReset = () => {
    setMessed(false);
    setCompletedSteps([]);
  };

  const allDone = completedSteps.length === stepsList.length;

  return (
    <div className="cream-surface p-6 rounded-lg text-[#2a1f0f]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Virtual Bed Making</h2>
        <button onClick={onClose} className="text-sm font-semibold hover:opacity-70">Close</button>
      </div>

      <div className="mb-8 flex justify-center">
        {/* Bed Visuals */}
        <div className="relative w-64 h-80 bg-white rounded-xl overflow-hidden shadow-inner border-4 border-[#e8a855]/20">
          {/* Headboard */}
          <div className="absolute top-0 w-full h-12 bg-amber-900/80 rounded-t-lg" />
          
          {/* Mattress base */}
          <div className="absolute top-12 w-full h-full bg-[#fdfbf7]" />

          {/* Bedsheet */}
          <motion.div 
            animate={{ opacity: messed ? 0.3 : completedSteps.includes('Pull bedsheet') ? 1 : 0.5, y: completedSteps.includes('Pull bedsheet') && !messed ? 0 : 20 }}
            className="absolute top-12 w-full h-full bg-white shadow-sm border-t"
          />

          {/* Corners */}
          {completedSteps.includes('Fix corners') && !messed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-0 w-full h-8 bg-white/90 border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" />
          )}

          {/* Pillows */}
          <motion.div 
            animate={{ 
              x: completedSteps.includes('Place pillows') && !messed ? 0 : -30,
              y: completedSteps.includes('Place pillows') && !messed ? 0 : 20,
              rotate: completedSteps.includes('Place pillows') && !messed ? 0 : -15,
              opacity: messed ? 0.5 : 1 
            }}
            className="absolute top-14 left-4 w-24 h-16 bg-white rounded-xl shadow-md border border-gray-100"
          />
          <motion.div 
            animate={{ 
              x: completedSteps.includes('Place pillows') && !messed ? 0 : 40,
              y: completedSteps.includes('Place pillows') && !messed ? 0 : 40,
              rotate: completedSteps.includes('Place pillows') && !messed ? 0 : 25,
              opacity: messed ? 0.5 : 1 
            }}
            className="absolute top-14 right-4 w-24 h-16 bg-white rounded-xl shadow-md border border-gray-100"
          />

          {/* Blanket */}
          <motion.div 
            animate={{ 
              y: completedSteps.includes('Straighten blanket') && !messed ? 0 : 60,
              rotate: completedSteps.includes('Straighten blanket') && !messed ? 0 : 10,
              opacity: messed ? 0.6 : completedSteps.includes('Straighten blanket') ? 1 : 0.8
            }}
            className="absolute bottom-0 w-full h-48 bg-[#e8a855] rounded-t-xl shadow-lg border-t-2 border-white/30"
          />

          {/* Cushions */}
          <motion.div 
            animate={{ 
              opacity: completedSteps.includes('Arrange cushions') && !messed ? 1 : 0,
              scale: completedSteps.includes('Arrange cushions') && !messed ? 1 : 0.5,
              y: completedSteps.includes('Arrange cushions') && !messed ? 0 : -20
            }}
            className="absolute top-24 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-700 rounded-full shadow-md"
          />
        </div>
      </div>

      {!allDone && !messed && (
        <div className="flex flex-col gap-3">
          {stepsList.map(step => (
            <div key={step} className="flex items-center min-h-[40px]">
              {completedSteps.includes(step) ? (
                <span className="text-green-600 font-bold flex items-center">
                  <span className="mr-2">✅</span> {step}
                </span>
              ) : (
                <button 
                  onClick={() => handleStep(step)}
                  className="bg-white border-2 border-[#e8a855] text-[#e8a855] hover:bg-[#e8a855] hover:text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm w-full text-left"
                >
                  {step}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {allDone && !messed && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <h3 className="text-3xl font-black text-[#e8a855] mb-6 tracking-wide">BED: PERFECT ✨</h3>
          <div className="flex flex-col gap-3 items-center">
            <button 
              onClick={onComplete}
              className="bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-green-700 w-full max-w-xs"
            >
              Finish
            </button>
            <button 
              onClick={handleMessItUp}
              className="bg-red-500 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-red-600 w-full max-w-xs mt-4"
            >
              MESS IT UP
            </button>
          </div>
        </motion.div>
      )}

      {messed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="italic text-lg mb-6 text-gray-600">Nature is healing.</p>
          <button 
            onClick={handleReset}
            className="bg-[#e8a855] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#d0964b]"
          >
            Make it again
          </button>
        </motion.div>
      )}
    </div>
  );
}
