import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const VirtualShowerTemperature: React.FC<Props> = ({ onComplete, onClose }) => {
  const [hot, setHot] = useState(50);
  const [cold, setCold] = useState(50);
  const [achieved, setAchieved] = useState(false);
  const [perfectTimer, setPerfectTimer] = useState<number | null>(null);

  const temp = Math.max(0, Math.min(80, hot * 0.7 - cold * 0.5 + 20));
  const isPerfect = temp >= 37 && temp <= 41;

  useEffect(() => {
    if (isPerfect && !achieved) {
      const timer = window.setTimeout(() => {
        setAchieved(true);
      }, 3000);
      setPerfectTimer(timer);
      return () => clearTimeout(timer);
    } else {
      if (perfectTimer) clearTimeout(perfectTimer);
      setPerfectTimer(null);
    }
  }, [isPerfect, achieved]);

  let tempColor = '';
  if (temp < 15) tempColor = '#70a8e8';
  else if (temp <= 35) tempColor = '#a0c8f0';
  else if (temp <= 41) tempColor = '#7ec87e';
  else if (temp <= 55) tempColor = '#e8c870';
  else tempColor = '#e87070';

  let statusMsg = 'Keep adjusting...';
  let statusColor = 'text-gray-600';
  if (temp > 58) {
    statusMsg = 'AAAAAAAA';
    statusColor = 'text-red-600 font-bold text-2xl';
  } else if (temp < 8) {
    statusMsg = 'WHY';
    statusColor = 'text-blue-600 font-bold text-2xl';
  } else if (isPerfect) {
    statusMsg = 'You have achieved enlightenment. ✨';
    statusColor = 'text-green-600 font-bold text-xl';
  }

  return (
    <div className="cream-surface p-6 rounded-xl relative overflow-hidden text-[#2a1f0f]">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">✕</button>
      <h2 className="text-2xl font-bold mb-6 text-center text-[#e8a855]">The Perfect Shower</h2>
      
      {!achieved ? (
        <div className="flex flex-col items-center gap-8">
          <div className="flex w-full justify-between items-center h-64 px-4">
            <div className="flex flex-col items-center h-full justify-between">
              <span className="font-bold text-red-500 mb-8">HOT</span>
              <input 
                type="range" 
                min="0" max="100" 
                value={hot} 
                onChange={e => setHot(Number(e.target.value))}
                className="w-48 h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                style={{ transform: 'rotate(-90deg)' }}
              />
            </div>

            <motion.div 
              className="w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-lg transition-colors duration-300 border-4 border-white"
              animate={{ backgroundColor: tempColor }}
            >
              <span className="text-4xl font-bold text-white shadow-sm drop-shadow-md">
                {temp.toFixed(1)}°
              </span>
              {isPerfect && !achieved && (
                <motion.div 
                  className="w-3/4 h-2 bg-white/50 rounded-full mt-4 overflow-hidden"
                >
                  <motion.div 
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                  />
                </motion.div>
              )}
            </motion.div>

            <div className="flex flex-col items-center h-full justify-between">
              <span className="font-bold text-blue-500 mb-8">COLD</span>
              <input 
                type="range" 
                min="0" max="100" 
                value={cold} 
                onChange={e => setCold(Number(e.target.value))}
                className="w-48 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                style={{ transform: 'rotate(-90deg)' }}
              />
            </div>
          </div>
          
          <div className={`h-8 text-center transition-all ${statusColor}`}>
            {statusMsg}
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-12"
        >
          <div className="text-3xl font-bold text-green-600 mb-8 text-center">
            PERFECT SHOWER ACHIEVED 🏆
          </div>
          <button 
            onClick={onComplete}
            className="px-6 py-3 bg-[#e8a855] text-white rounded-full font-bold hover:bg-[#d99b4a] shadow-md transition-transform hover:scale-105"
          >
            Dry Off (Finish)
          </button>
        </motion.div>
      )}
    </div>
  );
};
export default VirtualShowerTemperature;
