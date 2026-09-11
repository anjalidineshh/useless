import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useEffect, useState } from 'react';

interface Props {
  onRestart?: () => void;
}

export default function FinalScreen({ onRestart }: Props) {
  const { activityStats, getTimeElapsed, resetGame } = useGameStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(getTimeElapsed());
  }, [getTimeElapsed]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const stats = [
    { label: 'Virtual baths', value: Math.max(1, activityStats['baths'] || 0), emoji: '🛁' },
    { label: 'Virtual teeth brushed', value: Math.max(1, activityStats['teeth'] || 0), emoji: '🦷' },
    { label: 'Virtual dishes washed', value: Math.max(5, activityStats['dishes'] || 0), emoji: '🍽️' },
    { label: 'Virtual clothes washed', value: Math.max(3, activityStats['clothes'] || 0), emoji: '👕' },
    { label: 'Mosquitoes killed', value: Math.max(5, activityStats['mosquitoes'] || 0), emoji: '🦟' },
    { label: 'Tea made', value: Math.max(1, activityStats['tea'] || 0), emoji: '☕' },
  ];

  const handleReset = () => {
    resetGame();
    if (onRestart) {
      onRestart();
    }
  };

  const handleShare = () => {
    const text = `I spent ${formatTime(elapsed)} playing "USELESS REALITY" and achieved 0% real-world productivity. 100% USELESS AR! 🏆`;
    if (navigator.share) {
      navigator.share({ title: 'USELESS REALITY', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard! Share your absolute uselessness.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #241810 0%, #0d0a08 100%)' }}
    >
      {/* Floating Confetti Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 36 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{
              background: ['#e8a855', '#7ec87e', '#e87070', '#70a8e8', '#facc15', '#c084fc'][i % 6],
              left: `${Math.random() * 100}%`,
              top: '-15px',
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, (Math.random() - 0.5) * 220],
              rotate: [0, 720],
              opacity: [1, 0.7, 0],
            }}
            transition={{
              duration: 2.5 + Math.random() * 3,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: 'easeIn',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Giant Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 120, delay: 0.15 }}
          className="text-7xl md:text-8xl mb-4"
        >
          🏆
        </motion.div>

        {/* Master Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <p className="text-amber-300 font-mono tracking-widest text-xs uppercase mb-2">
            100% USELESSNESS ACHIEVED
          </p>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black text-white mb-3 tracking-tight">
            YOU HAVE MASTERED <br />
            <span style={{ color: '#e8a855' }}>ABSOLUTE USELESSNESS.</span>
          </h1>
          <p className="text-white/50 text-sm md:text-base max-w-lg mx-auto mb-8">
            You physically moved your body in front of an advanced computer vision model to accomplish precisely nothing.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card p-6 mb-6 grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              className="text-center p-2 rounded-xl bg-black/20"
            >
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <div className="text-white font-mono font-bold text-xl">{stat.value}</div>
              <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Final Productivity Metric */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, type: 'spring' }}
          className="mb-8 p-6 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(232,168,85,0.18) 0%, rgba(20,15,10,0.85) 100%)',
            border: '1px solid rgba(232,168,85,0.35)',
            boxShadow: '0 8px 32px rgba(232,168,85,0.1)',
          }}
        >
          <p className="text-white/50 text-xs tracking-widest uppercase mb-1">
            Real-world productivity achieved:
          </p>
          <p className="font-mono text-5xl font-black text-amber-400">0%</p>
          <p className="text-white/45 text-xs mt-3 italic">
            “Do absolutely normal things. But in augmented reality.”
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="flex flex-col sm:flex-row gap-3.5 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReset}
            className="btn-primary font-bold px-8 py-3.5"
            style={{ background: '#e8a855', color: '#1a1410' }}
          >
            🔄 WASTE ANOTHER DAY
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleShare}
            className="btn-secondary px-6 py-3.5 text-white/80 hover:text-white"
          >
            📢 SHARE MY USELESSNESS
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
