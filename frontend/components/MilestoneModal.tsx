"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Shield, Zap, X } from "lucide-react";
import confetti from "canvas-confetti";

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: {
    days: number;
    freezeTokens: number;
    bonusXP: number;
  };
  newMultiplier?: number;
}

export default function MilestoneModal({
  isOpen,
  onClose,
  milestone,
  newMultiplier,
}: MilestoneModalProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowContent(false);
      
      // Fire confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.1, 0.3),
            y: Math.random() - 0.2,
          },
          colors: ["#FF6B35", "#F7931E", "#FDC830", "#F37335", "#FF512F"],
        });

        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.7, 0.9),
            y: Math.random() - 0.2,
          },
          colors: ["#FF6B35", "#F7931E", "#FDC830", "#F37335", "#FF512F"],
        });
      }, 250);

      // Show content with delay
      setTimeout(() => setShowContent(true), 300);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full border-2 border-orange-500/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  {/* Trophy icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center"
                  >
                    <Trophy className="w-10 h-10 text-white" />
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 mb-2"
                  >
                    Streak Milestone!
                  </motion.h2>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-2 mb-6"
                  >
                    <Flame className="w-8 h-8 text-orange-500" />
                    <span className="text-5xl font-black text-white">{milestone.days}</span>
                    <span className="text-2xl text-gray-400 font-medium">Days</span>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-300 mb-8"
                  >
                    Incredible dedication! You've maintained your streak for {milestone.days} consecutive days!
                  </motion.p>

                  {/* Rewards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3 mb-8"
                  >
                    <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-400" />
                          <span className="text-sm font-medium text-blue-300">Streak Freeze Tokens</span>
                        </div>
                        <span className="text-2xl font-black text-blue-400">
                          +{milestone.freezeTokens}
                        </span>
                      </div>
                      <p className="text-xs text-blue-300/70 text-left">
                        Protect your streak from being lost if you miss a day
                      </p>
                    </div>

                    <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-green-400" />
                          <span className="text-sm font-medium text-green-300">Bonus XP</span>
                        </div>
                        <span className="text-2xl font-black text-green-400">
                          +{milestone.bonusXP.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-green-300/70 text-left">
                        Instantly added to your total XP
                      </p>
                    </div>

                    {newMultiplier && newMultiplier > 1 && (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, type: "spring" }}
                        className="bg-purple-500/20 rounded-xl p-4 border border-purple-500/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-purple-400" />
                            <span className="text-sm font-medium text-purple-300">XP Multiplier</span>
                          </div>
                          <span className="text-2xl font-black text-purple-400">
                            {newMultiplier}x
                          </span>
                        </div>
                        <p className="text-xs text-purple-300/70 text-left">
                          All XP earned is now multiplied by {newMultiplier}!
                        </p>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Close button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                  >
                    Continue Learning
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
