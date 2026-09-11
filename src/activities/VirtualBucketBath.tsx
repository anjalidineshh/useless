import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const VirtualBucketBath: React.FC<{ onComplete: () => void; onClose: () => void }> = ({ onComplete, onClose }) => {
  const [bucketLevel, setBucketLevel] = useState(0);
  const [mugLevel, setMugLevel] = useState(0);
  const [poured, setPoured] = useState(0);
  const [spilled, setSpilled] = useState(0);
  const [step, setStep] = useState<'fill' | 'pick' | 'scoop' | 'pour' | 'done'>('fill');
  const [message, setMessage] = useState('');

  const handleAction = () => {
    setMessage('');
    if (step === 'fill') {
      setBucketLevel(100);
      setStep('pick');
    } else if (step === 'pick') {
      setStep('scoop');
    } else if (step === 'scoop') {
      if (bucketLevel >= 10) {
        setMugLevel(80);
        setBucketLevel(bucketLevel - 10);
        setStep('pour');
      } else {
        setMessage('Bucket empty!');
      }
    } else if (step === 'pour') {
      if (mugLevel > 0) {
        setMugLevel(0);
        const newPoured = poured + 1;
        setPoured(newPoured);
        if (newPoured >= 5) {
          setStep('done');
          setMessage('Bath complete!');
        } else {
          setStep('scoop');
        }
      } else {
        const newSpilled = spilled + 1;
        setSpilled(newSpilled);
        setMessage('Spilled again!');
      }
    }
  };

  return (
    <div className="cream-surface p-6 text-[#2a1f0f] relative max-w-md mx-auto rounded-lg shadow-md bg-[#fdfbf7]">
      <button onClick={onClose} className="absolute top-2 right-2 text-sm text-gray-500 hover:text-gray-800">Close</button>
      <h2 className="text-xl font-bold mb-4">Virtual Bucket Bath</h2>
      
      <div className="flex items-end justify-center space-x-8 mb-6 h-48">
        <div className="relative w-32 h-40 border-4 border-gray-400 rounded-b-lg border-t-0 flex items-end justify-center overflow-hidden">
          <motion.div 
            className="w-full bg-blue-400 opacity-80"
            animate={{ height: `${bucketLevel}%` }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute top-2 text-sm font-semibold">{bucketLevel}%</div>
        </div>

        <div className="relative w-16 h-20 border-2 border-gray-500 rounded-b-md border-t-0 flex items-end justify-center overflow-hidden">
           <motion.div 
            className="w-full bg-blue-400 opacity-80"
            animate={{ height: `${mugLevel}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="mb-4 text-center h-8">
        {message && <p className="text-red-500 font-semibold">{message}</p>}
        {spilled >= 3 && <p className="italic text-gray-600">Excellent technique.</p>}
      </div>

      <div className="flex flex-col items-center space-y-4">
        {step !== 'done' ? (
          <button 
            onClick={handleAction}
            className="px-6 py-2 bg-[#e8a855] text-white rounded font-bold hover:bg-[#d89845] transition-colors"
          >
            {step === 'fill' && 'Fill Bucket'}
            {step === 'pick' && 'Pick up Mug'}
            {step === 'scoop' && 'Scoop Water'}
            {step === 'pour' && 'Pour Water'}
          </button>
        ) : (
          <button 
            onClick={onComplete}
            className="px-6 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600 transition-colors"
          >
            Finish
          </button>
        )}
      </div>
      <div className="mt-4 text-sm text-center">
        Poured: {poured}/5
      </div>
    </div>
  );
};

export default VirtualBucketBath;
