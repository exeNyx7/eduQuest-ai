"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Flame, Shield, Trophy, X, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonus: {
    xp: number;
    freeze_tokens?: number;
    badge?: string;
    message: string;
  };
  loginStreak: number;
  nextBonus?: {
    daysUntil: number;
    milestone: number;
    rewards: {
      xp: number;
      freeze_tokens?: number;
      badge?: string;
    };
  } | null;
}

export default function DailyBonusModal({
  isOpen,
  onClose,
  bonus,
  loginStreak,
  nextBonus,
}: DailyBonusModalProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowContent(false);

      // Fire confetti
      const duration = 2000;
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

        const particleCount = 30 * (timeLeft / duration);

        confetti({
          particleCount,
          startVelocity: 25,
          spread: 360,
          origin: {
            x: randomInRange(0.2, 0.8),
            y: Math.random() - 0.2,
          },
          colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#A78BFA"],
        });
      }, 250);

      // Show content with delay
      setTimeout(() => setShowContent(true), 200);

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
            className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 rounded-2xl p-8 max-w-md w-full border-4 border-yellow-400/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
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
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                  >
                    <Gift className="w-10 h-10 text-white" />
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-black text-white mb-2"
                  >
                    Daily Bonus! 🎁
                  </motion.h2>

                  {/* Streak */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-2 mb-4"
                  >
                    <Flame className="w-6 h-6 text-orange-400" />
                    <span className="text-2xl font-bold text-white">{loginStreak} Day{loginStreak > 1 ? 's' : ''}</span>
                    <span className="text-gray-300">Login Streak</span>
                  </motion.div>

                  {/* Message */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 mb-6 text-lg"
                  >
                    {bonus.message}
                  </motion.p>

                  {/* Rewards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3 mb-6"
                  >
                    {/* XP Reward */}
                    {bonus.xp > 0 && (
                      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border-2 border-green-400/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-green-400" />
                            <span className="text-lg font-medium text-green-300">Bonus XP</span>
                          </div>
                          <span className="text-3xl font-black text-green-400">
                            +{bonus.xp}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Freeze Tokens */}
                    {bonus.freeze_tokens && bonus.freeze_tokens > 0 && (
                      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border-2 border-cyan-400/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-cyan-400" />
                            <span className="text-lg font-medium text-cyan-300">Freeze Token{bonus.freeze_tokens > 1 ? 's' : ''}</span>
                          </div>
                          <span className="text-3xl font-black text-cyan-400">
                            +{bonus.freeze_tokens}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Badge */}
                    {bonus.badge && (
                      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border-2 border-purple-400/30">
                        <div className="flex items-center justify-center gap-3">
                          <Trophy className="w-6 h-6 text-purple-400" />
                          <span className="text-lg font-medium text-purple-300">
                            Badge Unlocked: <span className="font-bold text-yellow-300">{bonus.badge}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Next Bonus Preview */}
                  {nextBonus && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white/10 rounded-xl p-4 mb-6"
                    >
                      <div className="text-sm text-gray-300 mb-2">Next Milestone</div>
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-white font-bold">
                            {nextBonus.daysUntil === 1 ? 'Tomorrow' : `In ${nextBonus.daysUntil} days`}
                          </div>
                          <div className="text-xs text-gray-400">Day {nextBonus.milestone}</div>
                        </div>
                        <div className="flex gap-2 text-sm">
                          {nextBonus.rewards.xp > 0 && (
                            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">
                              +{nextBonus.rewards.xp} XP
                            </span>
                          )}
                          {nextBonus.rewards.freeze_tokens && nextBonus.rewards.freeze_tokens > 0 && (
                            <span className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                              +{nextBonus.rewards.freeze_tokens} 🛡️
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Claim Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold py-4 rounded-xl transition-all shadow-lg"
                  >
                    Awesome! 🎉
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
