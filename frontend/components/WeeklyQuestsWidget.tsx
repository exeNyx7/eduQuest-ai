"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WeeklyQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xp: number;
  completed: boolean;
}

interface WeeklyQuestsWidgetProps {
  userId: string;
}

// Icon mapping
const questIcons: { [key: string]: string } = {
  quiz_marathon: "🏃",
  perfect_scholar: "📚",
  streak_master: "🔥",
};

export default function WeeklyQuestsWidget({ userId }: WeeklyQuestsWidgetProps) {
  const [quests, setQuests] = useState<WeeklyQuest[]>([]);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyQuests();
    const interval = setInterval(updateResetTimer, 1000);
    
    // Listen for weekly quest updates
    const handleUpdate = () => loadWeeklyQuests();
    window.addEventListener('weeklyQuestsUpdated', handleUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('weeklyQuestsUpdated', handleUpdate);
    };
  }, [userId]);

  const loadWeeklyQuests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/user/weekly-quests/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load weekly quests');
      }
      
      const data = await response.json();
      setQuests(data.quests || []);
    } catch (error) {
      console.error('Error loading weekly quests:', error);
      // Fallback to empty quests on error
      setQuests([]);
    } finally {
      setLoading(false);
    }
  };

  const updateResetTimer = () => {
    const now = new Date();
    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);

    const diff = nextMonday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeUntilReset(`${days}d ${hours}h ${minutes}m ${seconds}s`);
  };

  const totalXPAvailable = quests.reduce((sum, q) => sum + q.xp, 0) + 200; // Include bonus
  const earnedXP = quests.filter(q => q.completed).reduce((sum, q) => sum + q.xp, 0);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-lg border-2 border-indigo-400/40 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-400 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-lg border-2 border-indigo-400/40 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">📅</span>
            Weekly Quests
          </h2>
          <p className="text-gray-300 text-sm mt-1">Bigger challenges, greater rewards!</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Resets in</div>
          <div className="text-lg font-bold text-cyan-400">{timeUntilReset}</div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="mb-4 bg-indigo-900/40 rounded-xl p-3 border border-indigo-400/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300 text-sm">Weekly XP</span>
          <span className="text-yellow-400 font-bold">
            {earnedXP} / {totalXPAvailable} XP
          </span>
        </div>
        <div className="h-2 bg-indigo-900/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${(earnedXP / totalXPAvailable) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Quests */}
      <div className="space-y-3">
        {quests.map((quest, index) => {
          const progress = Math.min((quest.progress / quest.target) * 100, 100);
          
          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-gradient-to-r ${
                quest.completed
                  ? "from-green-600/40 to-emerald-600/40 border-green-400/50"
                  : "from-indigo-600/30 to-purple-600/30 border-indigo-400/40"
              } backdrop-blur-sm border-2 rounded-xl p-4 overflow-hidden`}
            >
              {/* Background Progress */}
              <div
                className="absolute inset-0 bg-white/5"
                style={{ width: `${progress}%` }}
              />

              {/* Content */}
              <div className="relative flex items-start gap-3">
                <div className="text-4xl flex-shrink-0">{questIcons[quest.id] || "⭐"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-bold text-lg truncate">
                      {quest.title}
                    </h3>
                    {quest.completed && (
                      <span className="text-green-400 text-2xl ml-2">✓</span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{quest.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className={quest.completed ? "text-green-400" : "text-cyan-400"}>
                        {quest.progress}
                      </span>
                      <span className="text-gray-400"> / {quest.target}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                      <span className="text-yellow-400 font-bold">+{quest.xp}</span>
                      <span className="text-yellow-400 text-xs">XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bonus Info */}
      <div className="mt-4 p-3 bg-purple-900/30 rounded-lg border border-purple-400/30">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="text-xl">💎</span>
          <span>Complete all weekly quests for a <strong className="text-cyan-400">bonus 200 XP</strong>!</span>
        </div>
      </div>
    </div>
  );
}

// Export function to update weekly quest progress
export async function updateWeeklyQuestProgress(userId: string, quizScore: number, currentStreak: number) {
  try {
    const response = await fetch('http://localhost:8000/api/user/weekly-quests/progress', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId, // Changed from userId to match backend schema
        quizScore,
        currentStreak,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update weekly quest progress');
    }

    const result = await response.json();
    
    // Dispatch event to update UI
    window.dispatchEvent(new CustomEvent('weeklyQuestsUpdated'));
    
    return result;
  } catch (error) {
    console.error('Error updating weekly quest progress:', error);
    return null;
  }
}
