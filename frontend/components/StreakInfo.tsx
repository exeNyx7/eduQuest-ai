"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Shield, Zap, Gift, TrendingUp } from "lucide-react";

interface StreakInfoProps {
  userId: string;
  compact?: boolean;
}

interface StreakData {
  currentStreak: number;
  freezeTokens: number;
  freezeActive: boolean;
  multiplier: number;
  nextMilestone: {
    days: number;
    rewards: {
      freezeTokens: number;
      bonusXP: number;
    };
  } | null;
  milestonesReached: number[];
}

export default function StreakInfo({ userId, compact = false }: StreakInfoProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingFreeze, setUsingFreeze] = useState(false);

  const fetchStreakInfo = async () => {
    try {
      const res = await fetch(`/api/user/streak/info/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch streak info");
      const data = await res.json();
      setStreakData(data);
    } catch (error) {
      console.error("Error fetching streak info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStreakInfo();
    }
  }, [userId]);

  const handleUseFreeze = async () => {
    if (!streakData || streakData.freezeTokens === 0 || streakData.freezeActive) return;

    setUsingFreeze(true);
    try {
      const res = await fetch(`/api/user/streak/use-freeze/${userId}`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to use freeze");
      }

      const result = await res.json();
      
      // Refresh streak data
      await fetchStreakInfo();
      
      // Show success message
      alert(result.message);
    } catch (error) {
      console.error("Error using freeze:", error);
      alert(error instanceof Error ? error.message : "Failed to use streak freeze");
    } finally {
      setUsingFreeze(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-purple-700/50 rounded w-32 mb-2"></div>
        <div className="h-4 bg-purple-700/50 rounded w-24"></div>
      </div>
    );
  }

  if (!streakData) return null;

  const progressToNext = streakData.nextMilestone
    ? (streakData.currentStreak / streakData.nextMilestone.days) * 100
    : 100;

  // Compact view for header/navbar
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-purple-600/40 backdrop-blur-sm border-2 border-purple-400/50 rounded-lg px-3 py-2">
        {/* Streak */}
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-white">{streakData.currentStreak}</span>
        </div>

        {/* Multiplier */}
        {streakData.multiplier > 1 && (
          <div className="flex items-center gap-1 bg-pink-500/30 rounded px-2 py-0.5 border border-pink-400/30">
            <Zap className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-xs font-bold text-pink-300">{streakData.multiplier}x</span>
          </div>
        )}

        {/* Freeze tokens */}
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">{streakData.freezeTokens}</span>
        </div>

        {streakData.freezeActive && (
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" title="Freeze Active" />
        )}
      </div>
    );
  }

  // Full view for dashboard
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-2xl p-6 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border-2 border-yellow-400/30">
            <Flame className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Daily Streak</h3>
            <p className="text-sm text-gray-300">Keep learning every day!</p>
          </div>
        </div>
        
        {/* Current streak badge */}
        <div className="text-right">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
            {streakData.currentStreak}
          </div>
          <div className="text-xs text-gray-300 uppercase tracking-wide">Days</div>
        </div>
      </div>

      {/* Multiplier indicator */}
      {streakData.multiplier > 1 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 mb-4 border border-purple-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-pink-400" />
              <span className="text-sm font-medium text-pink-300">XP Multiplier Active</span>
            </div>
            <div className="text-2xl font-black text-pink-400">
              {streakData.multiplier}x
            </div>
          </div>
          <p className="text-xs text-pink-300/80 mt-1">
            You're earning {streakData.multiplier}x XP on all activities!
          </p>
        </motion.div>
      )}

      {/* Progress to next milestone */}
      {streakData.nextMilestone && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Next Milestone</span>
            <span className="text-sm font-medium text-white">
              {streakData.currentStreak} / {streakData.nextMilestone.days} days
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-purple-900/50 rounded-full overflow-hidden border border-purple-500/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-yellow-400 to-pink-500"
            />
          </div>

          {/* Milestone rewards */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-300">
            <div className="flex items-center gap-1">
              <Gift className="w-3.5 h-3.5 text-yellow-400" />
              <span>+{streakData.nextMilestone.rewards.bonusXP} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>+{streakData.nextMilestone.rewards.freezeTokens} Freeze Token{streakData.nextMilestone.rewards.freezeTokens > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Freeze tokens */}
      <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-medium text-white">Streak Freeze</span>
            {streakData.freezeActive && (
              <span className="px-2 py-0.5 bg-cyan-500/30 text-cyan-300 text-xs rounded-full font-medium border border-cyan-400/30">
                Active
              </span>
            )}
          </div>
          <div className="text-lg font-bold text-white">
            {streakData.freezeTokens}
          </div>
        </div>

        <p className="text-xs text-gray-300 mb-3">
          Use a freeze token to protect your streak for 24 hours if you miss a day.
        </p>

        <button
          onClick={handleUseFreeze}
          disabled={streakData.freezeTokens === 0 || streakData.freezeActive || usingFreeze}
          className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${
            streakData.freezeTokens > 0 && !streakData.freezeActive
              ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg"
              : "bg-purple-900/50 text-gray-500 cursor-not-allowed border border-purple-500/20"
          }`}
        >
          {usingFreeze ? (
            "Activating..."
          ) : streakData.freezeActive ? (
            "Freeze Active"
          ) : streakData.freezeTokens === 0 ? (
            "No Tokens Available"
          ) : (
            "Use Freeze Token"
          )}
        </button>
      </div>

      {/* Milestones reached */}
      {streakData.milestonesReached.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
              Milestones Reached
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {streakData.milestonesReached.sort((a, b) => b - a).map((milestone) => (
              <div
                key={milestone}
                className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-pink-500/20 text-yellow-300 text-xs rounded-lg font-medium border border-yellow-400/30"
              >
                {milestone} days
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
