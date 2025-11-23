"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
  isUnlocked: boolean;
}

interface AchievementsPanelProps {
  userId: string;
}

export default function AchievementsPanel({ userId }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  useEffect(() => {
    fetchAchievements();
    
    // Listen for achievement updates
    const handleAchievementUpdate = () => {
      fetchAchievements();
    };
    
    window.addEventListener('achievementsUpdated', handleAchievementUpdate);
    return () => window.removeEventListener('achievementsUpdated', handleAchievementUpdate);
  }, [userId]);

  const fetchAchievements = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/achievements/${userId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("[ACHIEVEMENTS] Error fetching achievements:", error);
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === "earned") return achievement.isUnlocked;
    if (filter === "locked") return !achievement.isUnlocked;
    return true;
  });

  const earnedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-purple-500/20 rounded mb-4 w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-purple-500/10 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
            <span className="text-4xl">🏆</span>
            Achievements
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-300">
              {earnedCount} of {totalCount} unlocked
            </span>
            <div className="bg-purple-800/40 px-3 py-1 rounded-full">
              <span className="text-yellow-400 font-bold">{completionPercentage}%</span>
              <span className="text-gray-300 ml-1">Complete</span>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === "all"
                ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900"
                : "bg-purple-800/40 text-gray-300 hover:bg-purple-700/60"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter("earned")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === "earned"
                ? "bg-gradient-to-r from-green-400 to-emerald-400 text-gray-900"
                : "bg-purple-800/40 text-gray-300 hover:bg-purple-700/60"
            }`}
          >
            Earned ({earnedCount})
          </button>
          <button
            onClick={() => setFilter("locked")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === "locked"
                ? "bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900"
                : "bg-purple-800/40 text-gray-300 hover:bg-purple-700/60"
            }`}
          >
            Locked ({totalCount - earnedCount})
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="relative h-3 bg-purple-900/50 rounded-full overflow-hidden border border-purple-400/30">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-lg">No achievements in this category</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement, idx) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative rounded-xl p-4 border-2 transition-all hover:scale-105 ${
                achievement.isUnlocked
                  ? "bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-400/50 cursor-pointer"
                  : "bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-600/30 opacity-60"
              }`}
            >
              {/* Unlock indicator */}
              {achievement.isUnlocked && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                    <span>✓</span>
                    <span>Unlocked</span>
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`text-5xl ${
                    achievement.isUnlocked ? "animate-bounce" : "grayscale opacity-50"
                  }`}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`font-bold text-lg ${
                        achievement.isUnlocked ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {achievement.name}
                    </h3>
                  </div>
                  <div className="bg-yellow-500/20 border border-yellow-400/40 rounded px-2 py-0.5 inline-block">
                    <span className="text-xs text-yellow-300 font-semibold">
                      +{achievement.xpReward} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p
                className={`text-sm mb-2 ${
                  achievement.isUnlocked ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {achievement.description}
              </p>

              {/* Unlock date */}
              {achievement.isUnlocked && achievement.unlockedAt && (
                <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
                  Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}

              {/* Lock icon for locked achievements */}
              {!achievement.isUnlocked && (
                <div className="absolute bottom-2 right-2 text-2xl opacity-30">🔒</div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {achievements.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-purple-800/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{earnedCount}</div>
            <div className="text-sm text-gray-400">Unlocked</div>
          </div>
          <div className="bg-purple-800/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-400">{totalCount - earnedCount}</div>
            <div className="text-sm text-gray-400">Locked</div>
          </div>
          <div className="bg-purple-800/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {achievements.filter((a) => a.isUnlocked).reduce((sum, a) => sum + a.xpReward, 0)}
            </div>
            <div className="text-sm text-gray-400">XP Earned</div>
          </div>
          <div className="bg-purple-800/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{completionPercentage}%</div>
            <div className="text-sm text-gray-400">Complete</div>
          </div>
        </div>
      )}
    </div>
  );
}
