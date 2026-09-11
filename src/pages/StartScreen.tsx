import { motion } from 'framer-motion';
import type { CameraMode } from '../hooks/useHandTracking';

interface Props {
  onStartCamera: () => void;
  onStartDemo: () => void;
  mode: CameraMode;
  errorMessage: string;
}

export default function StartScreen({ onStartCamera, onStartDemo, mode, errorMessage }: Props) {
  const isLoading = mode === 'loading';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 35%, #1c140e 0%, #070605 100%)' }}
    >
      {/* Ambient background glow orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.3, 0.12] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-24 left-1/4 w-[520px] h-[520px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,168,85,0.2) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.22, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-24 right-1/4 w-[480px] h-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* AR Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest mb-6 shadow-sm"
          style={{ background: 'rgba(232,168,85,0.12)', border: '1px solid rgba(232,168,85,0.3)', color: '#e8a855' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          FULL-SCREEN AR CAMERA EXPERIENCE
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-display font-black text-6xl md:text-8xl text-white mb-3 tracking-tight"
          style={{ textShadow: '0 4px 40px rgba(232,168,85,0.28)' }}
        >
          USELESS<br />
          <span style={{ color: '#e8a855' }}>REALITY</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-amber-200/90 text-lg md:text-2xl font-serif italic mb-2"
        >
          “Do absolutely normal things. But in augmented reality.”
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-white/60 text-sm md:text-base font-medium mb-3"
        >
          You are not controlling an avatar. Your real body is the interface.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-white/40 text-xs md:text-sm max-w-lg mx-auto mb-8 leading-relaxed"
        >
          Brush your real teeth with digital foam, stand under a floating shower over your actual head, slap real-time mosquitoes buzzing around your room, and wash dishes in your own hands.
        </motion.p>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="glass-card p-5 mb-8 grid grid-cols-3 gap-3 text-center"
        >
          {[
            { emoji: '🪞', label: '100% You', desc: 'No avatars or 3D characters' },
            { emoji: '⚡', label: 'Local AR Vision', desc: 'Face & hand tracking in browser' },
            { emoji: '✨', label: '12 AR Activities', desc: 'Everyday life augmented' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center">
              <div className="text-2xl mb-1">{item.emoji}</div>
              <p className="text-white text-xs font-semibold">{item.label}</p>
              <p className="text-white/40 text-[11px] mt-0.5">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Error notification */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-3 rounded-2xl text-xs text-red-300 border border-red-500/30"
            style={{ background: 'rgba(220,38,38,0.15)' }}
          >
            CAMERA REQUIRED: {errorMessage}. Try Demo Mode below!
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="flex flex-col sm:flex-row gap-3.5 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(232,168,85,0.45)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartCamera}
            disabled={isLoading}
            className="btn-primary text-base md:text-lg font-bold flex items-center justify-center gap-2.5 px-8 py-3.5"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Initializing AR Vision...</span>
              </>
            ) : (
              <>
                <span>📷</span>
                <span>START CAMERA</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartDemo}
            className="btn-secondary text-sm md:text-base font-semibold px-6 py-3.5 text-white/80 hover:text-white"
          >
            🖱️ No camera? Try Demo Mode
          </motion.button>
        </motion.div>

        {/* Privacy Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 flex flex-col items-center gap-1 text-white/35 text-xs"
        >
          <p className="flex items-center gap-1.5 font-medium">
            <span>🔒</span>
            <span>Camera processing happens locally. Nothing is recorded.</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
