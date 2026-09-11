import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const steps = ['Turn shower on', 'Wet hair', 'Apply shampoo', 'Massage scalp', 'Rinse', 'Apply conditioner', 'Rinse again', 'Dry hair'];
const stepEmojis = ['🚿', '💧', '🧴', '👐', '💦', '🫙', '💦', '🌬️'];

export default function VirtualHairWashing({ onComplete, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [temp, setTemp] = useState(38);
  const [done, setDone] = useState(false);

  const handleDoIt = () => {
    if (currentStep === 7) {
      setDone(true);
      setTimeout(onComplete, 1500);
    } else {
      setCurrentStep(c => c + 1);
    }
  };

  return (
    <div className="cream-surface p-6 rounded-lg text-[#2a1f0f] relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Virtual Hair Washing</h2>
        <button onClick={onClose} className="text-sm font-semibold hover:opacity-70">Close</button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Water Temperature: {temp}°C</label>
        <input 
          type="range" min="15" max="65" value={temp} 
          onChange={(e) => setTemp(Number(e.target.value))}
          className="w-full accent-[#e8a855]"
        />
        <div className="mt-2 text-sm font-medium min-h-[20px]">
          {temp > 55 ? <span className="text-red-600">This shower has become a survival game.</span> :
           temp < 18 ? <span className="text-blue-600">Cold shower. Bold choice.</span> :
           (temp >= 36 && temp <= 42) ? <span className="text-green-600">Perfect temperature 🌡️</span> : null}
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${i <= currentStep ? 'bg-[#e8a855]' : 'bg-gray-300'}`} />
        ))}
      </div>

      {!done ? (
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center bg-white/50 p-8 rounded-xl shadow-sm border border-[#e8a855]/30 relative"
        >
          <div className="text-6xl mb-4 relative z-10">{stepEmojis[currentStep]}</div>
          <h3 className="text-xl font-bold mb-6 relative z-10">{steps[currentStep]}</h3>
          <button 
            onClick={handleDoIt}
            className="bg-[#e8a855] text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#d0964b] transition-colors relative z-10"
          >
            Do it!
          </button>

          {/* Animations */}
          {currentStep >= 2 && currentStep <= 4 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-30">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`foam-${i}`}
                  initial={{ y: 150, x: Math.random() * 200 - 100, scale: 0.5 }}
                  animate={{ y: -50, scale: 1.5 }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                  className="absolute bottom-0 left-1/2 w-16 h-16 bg-white rounded-full blur-md"
                />
              ))}
            </div>
          )}
          
          {currentStep >= 0 && currentStep <= 5 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-50">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={`drop-${i}`}
                  initial={{ y: -50, x: Math.random() * 300 - 150 }}
                  animate={{ y: 200 }}
                  transition={{ duration: 1, repeat: Infinity, delay: Math.random() * 1 }}
                  className="absolute top-0 left-1/2 w-1 h-3 bg-blue-400 rounded-full"
                />
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8">
          <h3 className="text-2xl font-bold mb-2">Hair washed. Excellent. Now touch grass.</h3>
        </motion.div>
      )}
    </div>
  );
}
