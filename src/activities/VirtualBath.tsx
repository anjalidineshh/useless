import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { onComplete: () => void; onClose: () => void; }

export default function VirtualBath({ onComplete, onClose }: Props) {
  const [tapOn, setTapOn] = useState(false);
  const [waterLevel, setWaterLevel] = useState(0);
  const [temp, setTemp] = useState(37);
  const [bubbles, setBubbles] = useState(false);
  const [soap, setSoap] = useState(false);
  const [draining, setDraining] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');

  const handleTap = () => {
    if (!draining) setTapOn(t => !t);
  };

  const handleTemp = (v: number) => {
    setTemp(v);
    if (v >= 60) setMessage('"Congratulations. You have invented lava."');
    else if (v <= 15) setMessage('"This is no longer a bath. This is character development."');
    else setMessage('');
  };

  const handleFill = () => {
    if (tapOn && waterLevel < 90 && !draining) {
      setWaterLevel(w => Math.min(90, w + 5));
    }
  };

  const handleDrain = () => {
    setDraining(true);
    setTapOn(false);
    const t = setInterval(() => {
      setWaterLevel(w => {
        if (w <= 0) { clearInterval(t); setDraining(false); return 0; }
        return w - 5;
      });
    }, 150);
  };

  const handleFinish = () => {
    setDone(true);
    setTimeout(() => onComplete(), 2000);
  };

  const tempColor = temp < 20 ? '#70a8e8' : temp < 35 ? '#a0c8f0' : temp < 50 ? '#e8c870' : '#e87070';
  const waterColor = temp < 20 ? 'rgba(100,180,230,0.7)' : temp < 35 ? 'rgba(64,164,223,0.7)' : temp < 50 ? 'rgba(64,164,150,0.7)' : 'rgba(200,80,80,0.6)';

  return (
    <div className="cream-surface p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#2a1f0f]">🛁 Virtual Bath</h2>
          <p className="text-[#2a1f0f]/50 text-sm">For absolutely no reason.</p>
        </div>
        <button onClick={onClose} className="text-[#2a1f0f]/40 hover:text-[#2a1f0f] text-xl">✕</button>
      </div>

      {/* Bathtub illustration */}
      <div className="relative mx-auto mb-6" style={{ width: '100%', maxWidth: 400, height: 200 }}>
        {/* Tub body */}
        <div className="absolute bottom-0 left-4 right-4 rounded-b-3xl overflow-hidden border-4 border-[#c0b8a8]"
          style={{ height: 160, background: '#e8e0d0' }}>
          {/* Water */}
          <motion.div
            animate={{ height: `${waterLevel}%` }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0"
            style={{ background: waterColor }}
          >
            {/* Wave */}
            <div className="absolute top-0 left-0 right-0 h-3 opacity-50"
              style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '50% 50% 0 0' }} />
            {/* Bubbles */}
            {bubbles && Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/60"
                style={{
                  width: 8 + Math.random() * 12,
                  height: 8 + Math.random() * 12,
                  left: `${10 + i * 10}%`,
                  bottom: `${10 + (i % 3) * 20}%`,
                }}
                animate={{ y: [0, -(20 + Math.random() * 30)], opacity: [0.8, 0] }}
                transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
            {/* Soap */}
            {soap && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-8 rounded-full bg-white/40" />
            )}
          </motion.div>

          {/* Draining swirl */}
          {draining && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full"
            />
          )}
        </div>

        {/* Tap */}
        <div className="absolute top-0 right-12 flex flex-col items-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleTap}
            className="w-8 h-12 rounded-b-full cursor-pointer"
            style={{ background: tapOn ? '#e8a855' : '#a0a8b0', transition: 'background 0.3s' }}
          />
          {tapOn && (
            <motion.div
              animate={{ scaleY: [0, 1] }}
              transition={{ duration: 0.1, repeat: Infinity }}
              className="w-1 h-6 rounded-full"
              style={{ background: waterColor }}
            />
          )}
        </div>

        {/* Water level indicator */}
        <div className="absolute right-0 top-4 bottom-0 flex items-center">
          <div className="text-xs text-[#2a1f0f]/60 font-bold">
            {Math.round(waterLevel)}%
          </div>
        </div>
      </div>

      {/* Fill button */}
      {tapOn && !draining && waterLevel < 90 && (
        <div className="text-center mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFill}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            Let water in (+5%)
          </motion.button>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-4">
        {/* Temperature */}
        <div>
          <div className="flex justify-between text-xs text-[#2a1f0f]/60 mb-1">
            <span>❄️ COLD</span>
            <span style={{ color: tempColor }} className="font-bold">{temp}°C</span>
            <span>🔥 HOT</span>
          </div>
          <input
            type="range" min={5} max={70} value={temp}
            onChange={e => handleTemp(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Buttons row */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleTap}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tapOn ? 'bg-amber-warm text-[#1a1410]' : 'bg-[#2a1f0f]/10 text-[#2a1f0f]'}`}
          >
            {tapOn ? '🚰 Tap ON' : '🚰 Tap OFF'}
          </button>
          <button
            onClick={() => setBubbles(b => !b)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${bubbles ? 'bg-blue-200 text-blue-800' : 'bg-[#2a1f0f]/10 text-[#2a1f0f]'}`}
          >
            🫧 Bubbles {bubbles ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setSoap(s => !s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${soap ? 'bg-purple-200 text-purple-800' : 'bg-[#2a1f0f]/10 text-[#2a1f0f]'}`}
          >
            🧼 Soap
          </button>
          <button
            onClick={handleDrain}
            disabled={waterLevel === 0 || draining}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-700 disabled:opacity-40"
          >
            🔄 Drain
          </button>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center font-display italic text-[#c47a1e] text-sm"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Finish */}
        {!done ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFinish}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: '#e8a855' }}
          >
            Finish Bath → +8 Uselessness
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-4"
          >
            <p className="font-display text-xl text-green-700 font-bold">Bath completed.</p>
            <p className="text-[#2a1f0f]/60 text-sm">+8 Uselessness earned.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
