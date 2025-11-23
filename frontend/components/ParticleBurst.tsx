"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ParticleBurstProps {
  show: boolean;
  onComplete?: () => void;
  particleCount?: number;
  milestone?: number;
}

export default function ParticleBurst({ 
  show, 
  onComplete, 
  particleCount = 30,
  milestone 
}: ParticleBurstProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = 150 + Math.random() * 100;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 8 + Math.random() * 12;
    const rotation = Math.random() * 360;
    const color = [
      "#fbbf24", // yellow
      "#f97316", // orange
      "#ec4899", // pink
      "#8b5cf6", // purple
      "#06b6d4", // cyan
    ][Math.floor(Math.random() * 5)];

    return { x, y, size, rotation, color, delay: Math.random() * 0.2 };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Milestone text */}
      {milestone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.3, 1.2, 1],
            y: [0, -50, -50, -80]
          }}
          transition={{ 
            duration: 2.5,
            times: [0, 0.2, 0.6, 1]
          }}
          className="absolute text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500"
          style={{
            textShadow: "0 0 20px rgba(251, 191, 36, 0.5)",
          }}
        >
          🎉 {milestone} XP! 🎉
        </motion.div>
      )}

      {/* Particles */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: [1, 1, 0],
            scale: [0, 1, 0.5],
            rotate: particle.rotation,
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
            delay: particle.delay,
          }}
          className="absolute"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: "50%",
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
        />
      ))}

      {/* Center burst */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: [0, 3, 0],
          opacity: [1, 0.5, 0]
        }}
        transition={{ duration: 1 }}
        className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 blur-2xl"
      />

      {/* Ring wave */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: [0, 4],
          opacity: [1, 0]
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute w-32 h-32 rounded-full border-4 border-yellow-400"
      />
    </div>
  );
}

// Hook to trigger particle burst on XP milestones
export function useXPMilestone(currentXP: number) {
  const [showBurst, setShowBurst] = useState(false);
  const [milestone, setMilestone] = useState<number | undefined>(undefined);

  useEffect(() => {
    const milestones = [100, 250, 500, 1000, 2500, 5000, 10000];
    const reachedMilestone = milestones.find(m => {
      const previousXP = currentXP - 10; // Assuming 10 XP gain
      return previousXP < m && currentXP >= m;
    });

    if (reachedMilestone) {
      setMilestone(reachedMilestone);
      setShowBurst(true);
    }
  }, [currentXP]);

  const resetBurst = () => {
    setShowBurst(false);
    setMilestone(undefined);
  };

  return { showBurst, milestone, resetBurst };
}
