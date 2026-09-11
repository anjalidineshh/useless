import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useState } from 'react';

const letters = "THE MOST USELESS DAY".split('');

export default function LandingPage() {
  const navigate = useNavigate();
  const { startTimer } = useGameStore();
  const [showWhy, setShowWhy] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleEnter = () => {
    setLeaving(true);
    startTimer();
    setTimeout(() => navigate('/apartment'), 800);
  };

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a1410 0%, #2a1e14 40%, #1a1410 100%)' }}
    >
      {/* Ambient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,168,85,0.15) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,168,85,0.1) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,168,85,0.05) 0%, transparent 60%)' }}
        />
      </div>

      {/* Floating emoji decorations */}
      {['🛁','☕','🦟','🧹','🍽️','👕','🚿'].map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-10 select-none pointer-events-none"
          style={{
            left: `${10 + i * 13}%`,
            top: `${15 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        {/* Title */}
        <div className="mb-6 overflow-hidden">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap justify-center gap-x-4"
          >
            {/* THE */}
            <span className="font-display text-cream-muted text-xl md:text-2xl tracking-[0.4em] uppercase mb-2 w-full block opacity-60">
              ✦ presenting ✦
            </span>
          </motion.div>

          <div className="flex flex-wrap justify-center">
            {letters.map((letter, i) => (
              <motion.span
                key={i}
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.3 + i * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="font-display font-black text-5xl md:text-8xl leading-none"
                style={{
                  color: letter === ' ' ? 'transparent' : '#f0ebe0',
                  width: letter === ' ' ? '0.3em' : 'auto',
                  textShadow: '0 4px 30px rgba(232,168,85,0.3)',
                }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="glass-card px-8 py-6 mb-6 max-w-xl"
        >
          <p className="font-display italic text-xl md:text-2xl text-amber-warm mb-2">
            "Experience everyday life. Digitally. For absolutely no reason."
          </p>
          <p className="text-white/50 text-sm font-light tracking-wide">
            12 everyday activities you never needed a computer for.
          </p>
        </motion.div>

        {/* Sub-description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="mb-10 text-white/40 text-sm tracking-widest uppercase leading-loose"
        >
          <span>No productivity</span>
          <span className="mx-3 text-amber-warm/40">·</span>
          <span>No life improvement</span>
          <span className="mx-3 text-amber-warm/40">·</span>
          <span>No meaningful purpose</span>
          <br />
          <span className="text-amber-warm/60 font-medium">Just vibes.</span>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 8px 40px rgba(232,168,85,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleEnter}
            className="btn-primary text-lg font-bold tracking-wide"
            style={{ background: '#e8a855', color: '#1a1410', border: 'none' }}
          >
            ENTER MY USELESS LIFE →
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowWhy(!showWhy)}
            className="btn-secondary text-sm tracking-wide"
          >
            WHY DOES THIS EXIST?
          </motion.button>
        </motion.div>

        {/* Why modal */}
        {showWhy && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card px-8 py-6 mt-6 max-w-md text-left"
          >
            <p className="font-display text-lg text-amber-warm mb-3">Honestly?</p>
            <p className="text-white/70 text-sm leading-relaxed">
              It doesn't. There is no reason. Someone built an absurdly over-engineered
              interactive simulation of doing your laundry. You are now participating in it.
              <br /><br />
              We regret nothing.
            </p>
            <p className="text-white/30 text-xs mt-4 italic">
              * No dishes were actually cleaned in the making of this website.
            </p>
          </motion.div>
        )}

        {/* Bottom small text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-8 text-white/20 text-xs tracking-widest"
        >
          ENGINEERED FOR ABSOLUTELY NO REASON · EST. TODAY
        </motion.p>
      </div>
    </motion.div>
  );
}
