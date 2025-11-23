"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

interface AchievementToastProps {
  achievements: Achievement[];
  onComplete: () => void;
}

export default function AchievementToast({
  achievements,
  onComplete,
}: AchievementToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievements.length === 0) return;

    // Show first achievement
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
      
      // After fade out, move to next achievement or complete
      setTimeout(() => {
        if (currentIndex < achievements.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          onComplete();
        }
      }, 300);
    }, 3000); // Show each achievement for 3 seconds

    return () => clearTimeout(timer);
  }, [currentIndex, achievements.length, onComplete]);

  if (achievements.length === 0) return null;

  const achievement = achievements[currentIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-20 right-4 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 p-1 rounded-lg shadow-2xl">
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-4xl flex-shrink-0 animate-bounce">
                  {achievement.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 font-bold text-sm uppercase tracking-wider">
                      Achievement Unlocked!
                    </span>
                    <span className="text-green-400 text-xs font-semibold">
                      +{achievement.xpReward} XP
                    </span>
                  </div>
                  
                  <h3 className="text-white font-bold text-lg mb-1">
                    {achievement.name}
                  </h3>
                  
                  <p className="text-gray-300 text-sm">
                    {achievement.description}
                  </p>
                </div>
              </div>

              {/* Progress indicator for multiple achievements */}
              {achievements.length > 1 && (
                <div className="flex gap-1 mt-3">
                  {achievements.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        idx <= currentIndex ? "bg-yellow-400" : "bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sparkle effects */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
            className="absolute -top-2 -right-2 text-2xl"
          >
            ✨
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1, delay: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
            className="absolute -bottom-2 -left-2 text-xl"
          >
            ⭐
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
