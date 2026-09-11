import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useEffect, useState } from 'react';

export default function FinalScreen() {
  const navigate = useNavigate();
  const { activityStats, getTimeElapsed, resetGame } = useGameStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(getTimeElapsed());
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const stats = [
    { label: 'Baths taken', value: 1, emoji: '🛁' },
    { label: 'Dishes cleaned', value: (activityStats['dishes'] || 0) + 6, emoji: '🍽️' },
    { label: 'Tea cups prepared', value: activityStats['tea'] || 1, emoji: '☕' },
    { label: 'Mosquitoes destroyed', value: activityStats['mosquitoes'] || 0, emoji: '🦟' },
    { label: 'Clothes washed', value: (activityStats['clothes'] || 0) + 7, emoji: '👕' },
    { label: 'Time wasted', value: formatTime(elapsed), emoji: '⏱️' },
  ];

  const handleReset = () => {
    resetGame();
    navigate('/');
  };

  const handleShare = () => {
    const text = `I just completed "The Most Useless Day" — 12 completely pointless digital activities. ${formatTime(elapsed)} of my life, gone. 100% USELESS. 🏆`;
    if (navigator.share) {
      navigator.share({ title: 'The Most Useless Day', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard! Share your uselessness.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at center, #2a1e14 0%, #1a1410 100%)' }}
    >
      {/* Confetti particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: ['#e8a855', '#7ec87e', '#e87070', '#70a8e8', '#e870e8'][i % 5],
              left: `${Math.random() * 100}%`,
              top: '-10px',
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, (Math.random() - 0.5) * 200],
              rotate: [0, 720],
              opacity: [1, 0.6, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: 'easeIn',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
          className="text-8xl mb-6"
        >
          🏆
        </motion.div>

        {/* Main heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h1 className="font-display text-6xl md:text-8xl font-black text-white mb-2">
            YOU DID IT.
          </h1>
          <p className="text-white/50 text-lg mb-8">
            You completed 12 completely unnecessary digital activities.
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-6 mb-6 grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl mb-1">{stat.emoji}</div>
              <div className="text-white font-bold text-lg">{stat.value}</div>
              <div className="text-white/40 text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Final score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, type: 'spring' }}
          className="mb-8 p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(232,168,85,0.2) 0%, rgba(232,168,85,0.05) 100%)',
            border: '1px solid rgba(232,168,85,0.4)',
            borderRadius: '20px',
          }}
        >
          <p className="text-white/50 text-sm tracking-widest uppercase mb-2">YOUR FINAL SCORE</p>
          <p className="font-display text-5xl font-black text-amber-warm">100% USELESS</p>
          <p className="text-white/40 text-sm mt-4 italic leading-relaxed">
            "Humanity has advanced technologically.<br />
            You used that technology to digitally wash a plate."
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReset}
            className="btn-primary"
            style={{ background: '#e8a855', color: '#1a1410' }}
          >
            START AGAIN
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleShare}
            className="btn-secondary"
          >
            SHARE MY USELESSNESS 📢
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
