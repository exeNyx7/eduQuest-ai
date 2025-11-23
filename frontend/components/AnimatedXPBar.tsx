"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedXPBarProps {
  currentXP: number;
  nextRankXP: number;
  rank: string;
  previousXP?: number;
}

const getRankColor = (rank: string) => {
  switch (rank.toLowerCase()) {
    case "bronze": return "from-orange-700 to-orange-500";
    case "silver": return "from-gray-400 to-gray-200";
    case "gold": return "from-yellow-600 to-yellow-400";
    case "platinum": return "from-cyan-400 to-blue-300";
    case "diamond": return "from-blue-400 to-purple-400";
    default: return "from-gray-600 to-gray-400";
  }
};

const getRankEmoji = (rank: string) => {
  switch (rank.toLowerCase()) {
    case "bronze": return "🥉";
    case "silver": return "🥈";
    case "gold": return "🥇";
    case "platinum": return "💎";
    case "diamond": return "👑";
    default: return "⭐";
  }
};

export default function AnimatedXPBar({ currentXP, nextRankXP, rank, previousXP }: AnimatedXPBarProps) {
  const [displayXP, setDisplayXP] = useState(previousXP || currentXP);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    // Animate XP counter
    if (previousXP !== undefined && previousXP !== currentXP) {
      const duration = 1500; // 1.5 seconds
      const steps = 60;
      const increment = (currentXP - previousXP) / steps;
      let current = previousXP;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= currentXP) {
          setDisplayXP(currentXP);
          clearInterval(interval);
          setShowSparkles(true);
          setTimeout(() => setShowSparkles(false), 2000);
        } else {
          setDisplayXP(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    } else {
      setDisplayXP(currentXP);
    }
  }, [currentXP, previousXP]);

  const percentage = Math.min((currentXP / nextRankXP) * 100, 100);

  return (
    <div className="relative">
      {/* Rank Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{getRankEmoji(rank)}</span>
          <div>
            <div className="text-sm text-gray-400">Current Rank</div>
            <div className="text-2xl font-bold text-white">{rank}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">XP Progress</div>
          <motion.div 
            className="text-2xl font-bold text-yellow-400"
            key={displayXP}
            initial={{ scale: 1 }}
            animate={{ scale: previousXP !== currentXP ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {Math.floor(displayXP).toLocaleString()} / {nextRankXP.toLocaleString()}
          </motion.div>
        </div>
      </div>

      {/* XP Bar Container */}
      <div className="relative h-8 bg-gray-800/50 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-inner">
        {/* Background glow */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${getRankColor(rank)} opacity-20 blur-xl`}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Progress bar */}
        <motion.div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getRankColor(rank)} shadow-lg`}
          initial={{ width: previousXP ? `${(previousXP / nextRankXP) * 100}%` : `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 1.5,
            ease: [0.16, 1, 0.3, 1], // Custom spring easing
          }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Percentage text */}
        <div className="relative h-full flex items-center justify-center">
          <span className="text-white font-bold text-sm drop-shadow-lg">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Sparkle particles */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 1,
                scale: 0,
                x: "50%",
                y: "50%",
              }}
              animate={{
                opacity: [1, 0],
                scale: [0, 1.5],
                x: `${50 + Math.cos((i / 12) * Math.PI * 2) * 100}%`,
                y: `${50 + Math.sin((i / 12) * Math.PI * 2) * 100}%`,
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
                delay: i * 0.05,
              }}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                boxShadow: "0 0 10px #fbbf24",
              }}
            />
          ))}
        </div>
      )}

      {/* Milestone indicator */}
      {percentage >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center text-green-400 font-bold text-sm"
        >
          🎉 Ready to rank up!
        </motion.div>
      )}
    </div>
  );
}
