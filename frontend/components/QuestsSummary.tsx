"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Quest {
  id: string | number;
  title: string;
  progress: number;
  target: number;
  completed: boolean;
}

interface QuestsSummaryProps {
  userId: string;
}

export default function QuestsSummary({ userId }: QuestsSummaryProps) {
  const router = useRouter();
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestsSummary();

    // Listen for quest updates from both widgets
    const handleUpdate = () => {
      console.log("[QuestsSummary] Quest update event received, refetching...");
      fetchQuestsSummary();
    };
    
    window.addEventListener("questProgressUpdated", handleUpdate);
    window.addEventListener("weeklyQuestsUpdated", handleUpdate);

    return () => {
      window.removeEventListener("questProgressUpdated", handleUpdate);
      window.removeEventListener("weeklyQuestsUpdated", handleUpdate);
    };
  }, [userId]);

  const fetchQuestsSummary = async () => {
    try {
      setLoading(true);

      // Fetch daily quests
      const dailyResponse = await fetch(
        `http://localhost:8000/api/user/daily-quests/${userId}`
      );
      if (dailyResponse.ok) {
        const dailyData = await dailyResponse.json();
        setDailyQuests(dailyData.quests || []);
      }

      // Fetch weekly quests
      const weeklyResponse = await fetch(
        `http://localhost:8000/api/user/weekly-quests/${userId}`
      );
      if (weeklyResponse.ok) {
        const weeklyData = await weeklyResponse.json();
        setWeeklyQuests(weeklyData.quests || []);
      }
    } catch (error) {
      console.error("Error fetching quests summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const dailyCompleted = dailyQuests.filter((q) => q.completed).length;
  const weeklyCompleted = weeklyQuests.filter((q) => q.completed).length;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 shadow-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-purple-500/20 rounded w-32 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-purple-500/10 rounded"></div>
            <div className="h-4 bg-purple-500/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
      onClick={() => router.push("/quests")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">🎯</span>
          Quests
        </h2>
        <button
          className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm flex items-center gap-1 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            router.push("/quests");
          }}
        >
          View All
          <span className="text-lg">→</span>
        </button>
      </div>

      {/* Quest Progress Summary */}
      <div className="space-y-3">
        {/* Daily Quests */}
        <div className="bg-purple-800/30 backdrop-blur-sm border border-purple-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="text-white font-semibold">Daily Quests</span>
            </div>
            <span className="text-cyan-400 font-bold">
              {dailyCompleted}/{dailyQuests.length}
            </span>
          </div>
          <div className="h-2 bg-purple-900/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
              initial={{ width: 0 }}
              animate={{
                width: `${dailyQuests.length > 0 ? (dailyCompleted / dailyQuests.length) * 100 : 0}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Weekly Quests */}
        <div className="bg-indigo-800/30 backdrop-blur-sm border border-indigo-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📆</span>
              <span className="text-white font-semibold">Weekly Quests</span>
            </div>
            <span className="text-blue-400 font-bold">
              {weeklyCompleted}/{weeklyQuests.length}
            </span>
          </div>
          <div className="h-2 bg-indigo-900/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
              initial={{ width: 0 }}
              animate={{
                width: `${weeklyQuests.length > 0 ? (weeklyCompleted / weeklyQuests.length) * 100 : 0}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Click hint */}
      <div className="mt-4 text-center text-gray-400 text-sm">
        Click to view details and earn bonus XP
      </div>
    </motion.div>
  );
}
