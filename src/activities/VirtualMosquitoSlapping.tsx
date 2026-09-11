import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const VirtualMosquitoSlapping: React.FC<Props> = ({ onComplete, onClose }) => {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [killed, setKilled] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [hiding, setHiding] = useState(false);
  const [localAch, setLocalAch] = useState<string | null>(null);
  const [slapAnim, setSlapAnim] = useState<{ show: boolean; x: number; y: number; id: number }>({ show: false, x: 0, y: 0, id: 0 });

  const posRef = useRef(pos);
  const speedRef = useRef(speed);
  
  useEffect(() => {
    posRef.current = pos;
    speedRef.current = speed;
  }, [pos, speed]);

  useEffect(() => {
    if (hiding) {
      const hideTimer = setTimeout(() => {
        setHiding(false);
      }, 3000);
      return () => clearTimeout(hideTimer);
    }

    const intervalMs = Math.max(200, 800 / speedRef.current);
    
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        setHiding(true);
        return;
      }
      
      const pX = posRef.current.x;
      const pY = posRef.current.y;
      const s = speedRef.current;
      
      const clamp = (min: number, max: number, val: number) => Math.max(min, Math.min(max, val));
      const nx = clamp(5, 90, pX + (Math.random() - 0.5) * 30 * s);
      const ny = clamp(5, 90, pY + (Math.random() - 0.5) * 30 * s);
      setPos({ x: nx, y: ny });
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [hiding, speed]);

  useEffect(() => {
    let ach = null;
    if (killed === 1) ach = '🪸 FIRST BLOOD!';
    if (killed === 10) ach = '🎯 MOSQUITO HUNTER!';
    if (killed === 25) ach = '💥 ABSOLUTE MENACE!';
    if (killed === 50) ach = '😤 SLEEP DESTROYER!';
    
    if (ach) {
      setLocalAch(ach);
      const timer = setTimeout(() => setLocalAch(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [killed]);

  const handleSlap = (e: React.MouseEvent) => {
    if (hiding) return;
    e.stopPropagation();
    
    setKilled(prev => prev + 1);
    setSpeed(prev => prev + 0.15);
    setSlapAnim({ show: true, x: pos.x, y: pos.y, id: Date.now() });
    setPos({ x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 });
  };

  return (
    <div className="bg-[#1a1a2e] p-6 rounded-xl relative overflow-hidden text-white font-sans w-full shadow-xl">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white z-50">✕</button>
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h2 className="text-xl font-bold text-gray-300">MOSQUITOES DEFEATED: {killed}</h2>
        {killed >= 5 && (
          <button 
            onClick={onComplete}
            className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded text-sm font-bold transition-colors"
          >
            I Give Up
          </button>
        )}
      </div>

      <AnimatePresence>
        {localAch && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-full font-bold z-20 shadow-lg border border-yellow-400"
          >
            {localAch}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full h-[300px] bg-black/40 rounded border border-[#2a2a4a] relative overflow-hidden cursor-crosshair">
        {hiding ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 italic">
            It is somewhere in your room.
          </div>
        ) : (
          <motion.div
            className="absolute text-2xl z-20 cursor-pointer drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            transition={{ type: 'tween', duration: Math.max(0.1, 0.8/speed) }}
            onClick={handleSlap}
          >
            🪰
          </motion.div>
        )}

        <AnimatePresence>
          {slapAnim.show && (
            <motion.div
              key={slapAnim.id}
              initial={{ opacity: 1, scale: 0.5 }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute text-red-500 font-bold text-xl z-10 pointer-events-none drop-shadow-md"
              style={{ left: `${slapAnim.x}%`, top: `${slapAnim.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              SLAP! 👋
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default VirtualMosquitoSlapping;
