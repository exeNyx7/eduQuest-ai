"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RankUpModalProps {
  show: boolean;
  oldRank: string;
  newRank: string;
  xpEarned: number;
  onClose: () => void;
}

const RANK_COLORS = {
  Bronze: "from-orange-700 to-orange-900",
  Silver: "from-gray-400 to-gray-600",
  Gold: "from-yellow-400 to-yellow-600",
  Platinum: "from-gray-300 to-gray-500",
  Diamond: "from-cyan-400 to-blue-600",
};

const RANK_EMOJIS = {
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Diamond: "👑",
};

export default function RankUpModal({ show, oldRank, newRank, xpEarned, onClose }: RankUpModalProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; rotation: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.3,
      }));
      setConfetti(particles);

      // Play celebration sound
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, delay: number) => {
        setTimeout(() => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = freq;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.001, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
          o.start();
          o.stop(ctx.currentTime + 0.52);
        }, delay);
      };

      // Victory fanfare
      playNote(523, 0);    // C
      playNote(659, 100);  // E
      playNote(784, 200);  // G
      playNote(1047, 300); // C (octave)
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          {/* Confetti */}
          {confetti.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: `${particle.x}vw`, y: `${particle.y}vh`, opacity: 1, rotate: particle.rotation }}
              animate={{
                y: "110vh",
                rotate: particle.rotation + 720,
                opacity: 0,
              }}
              transition={{
                duration: 3,
                delay: particle.delay,
                ease: "easeIn",
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: `hsl(${Math.random() * 360}, 100%, 60%)`,
              }}
            />
          ))}

          {/* Modal */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="relative bg-gradient-to-br from-purple-600/95 to-pink-600/95 backdrop-blur-lg border-4 border-yellow-400 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Celebration Header */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="text-8xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300 mb-2">
                RANK UP!
              </h2>
              <p className="text-white text-lg">You've ascended to a new rank!</p>
            </motion.div>

            {/* Rank Transition */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* Old Rank */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`px-6 py-4 rounded-xl border-4 border-white/30 bg-gradient-to-br ${
                  RANK_COLORS[oldRank as keyof typeof RANK_COLORS]
                } shadow-lg`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-1">{RANK_EMOJIS[oldRank as keyof typeof RANK_EMOJIS]}</div>
                  <div className="text-xl font-bold text-white">{oldRank}</div>
                </div>
              </motion.div>

              {/* Arrow */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7 }}
                className="text-4xl text-yellow-300"
              >
                →
              </motion.div>

              {/* New Rank */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className={`px-6 py-4 rounded-xl border-4 border-yellow-400 bg-gradient-to-br ${
                  RANK_COLORS[newRank as keyof typeof RANK_COLORS]
                } shadow-2xl shadow-yellow-400/50`}
              >
                <div className="text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                    className="text-4xl mb-1"
                  >
                    {RANK_EMOJIS[newRank as keyof typeof RANK_EMOJIS]}
                  </motion.div>
                  <div className="text-xl font-bold text-white">{newRank}</div>
                </div>
              </motion.div>
            </div>

            {/* XP Earned */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="bg-purple-900/50 rounded-xl p-4 mb-6 text-center border-2 border-purple-400/30"
            >
              <div className="text-sm text-gray-300 mb-1">XP Earned This Quest</div>
              <div className="text-3xl font-bold text-yellow-300">+{xpEarned} XP</div>
            </motion.div>

            {/* Motivational Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="text-center mb-6"
            >
              <p className="text-white text-lg font-semibold">
                {newRank === "Silver" && "You're shining bright! ✨"}
                {newRank === "Gold" && "Golden performance! 🌟"}
                {newRank === "Platinum" && "You're unstoppable! 🚀"}
                {newRank === "Diamond" && "Legendary status achieved! 👑"}
              </p>
            </motion.div>

            {/* Continue Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              onClick={onClose}
              className="w-full px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xl font-bold rounded-xl shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-200"
            >
              🎮 Continue Quest
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
