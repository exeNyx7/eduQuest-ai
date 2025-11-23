"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface DailyQuest {
  id: number;
  title: string;
  description: string;
  progress: number;
  target: number;
  xp: number;
  icon: string;
  completed: boolean;
}

interface DailyQuestsWidgetProps {
  userId: string;
}

// Helper function to update quest progress after quiz completion
export async function updateQuestProgress(userId: string, correctAnswers: number, totalQuestions: number, perfectScore: boolean) {
  try {
    const response = await fetch(`http://localhost:8000/api/user/daily-quests/complete-quiz?user_id=${userId}&correct_answers=${correctAnswers}&total_questions=${totalQuestions}&perfect_score=${perfectScore}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to update daily quest progress');
    }

    const result = await response.json();
    
    // Dispatch event to update UI
    window.dispatchEvent(new CustomEvent('questProgressUpdated'));
    
    return result;
  } catch (error) {
    console.error('Error updating daily quest progress:', error);
    return null;
  }
}

export default function DailyQuestsWidget({ userId }: DailyQuestsWidgetProps) {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilMidnight());

  useEffect(() => {
    fetchDailyQuests();
    
    // Listen for quest updates
    const handleQuestUpdate = () => {
      fetchDailyQuests();
    };
    
    window.addEventListener('questProgressUpdated', handleQuestUpdate);
    return () => window.removeEventListener('questProgressUpdated', handleQuestUpdate);
  }, [userId]);

  useEffect(() => {
    // Update timer every second
    const interval = setInterval(() => {
      setTimeRemaining(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchDailyQuests = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/user/daily-quests/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load daily quests');
      }
      
      const data = await response.json();
      setQuests(data.quests || []);
    } catch (error) {
      console.error('Error loading daily quests:', error);
      // Fallback to empty quests on error
      setQuests([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-purple-500/20 rounded mb-4 w-48"></div>
        <div className="space-y-3">
          <div className="h-20 bg-purple-500/10 rounded"></div>
          <div className="h-20 bg-purple-500/10 rounded"></div>
          <div className="h-20 bg-purple-500/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">📅</span>
          Daily Quests
        </h2>
        <div className="text-sm text-gray-300 bg-purple-800/40 px-3 py-1 rounded-full">
          Resets in {timeRemaining}
        </div>
      </div>

      <div className="space-y-3">
        {quests.map((quest, idx) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-gradient-to-r ${
              quest.completed
                ? "from-green-600/30 to-emerald-600/30 border-green-400/50"
                : "from-purple-700/30 to-indigo-700/30 border-purple-400/30"
            } border-2 rounded-xl p-4 hover:scale-105 transition-transform`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white">{quest.title}</h3>
                  {quest.completed && <span className="text-xl">✅</span>}
                </div>
                <p className="text-sm text-gray-300">{quest.description}</p>
              </div>
              <div className="bg-yellow-500/20 border border-yellow-400/40 rounded-lg px-3 py-1 ml-3">
                <div className="text-xs text-yellow-300 font-semibold">
                  +{quest.xp} XP
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>Progress</span>
                <span>
                  {quest.progress} / {quest.target}
                </span>
              </div>
              <div className="bg-gray-700/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(quest.progress / quest.target) * 100}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
                  className={`h-full ${
                    quest.completed
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : "bg-gradient-to-r from-yellow-400 to-orange-500"
                  }`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {quests.every((q) => q.completed) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-xl p-4 text-center"
        >
          <div className="text-4xl mb-2">🎉</div>
          <div className="text-lg font-bold text-green-300">All Quests Complete!</div>
          <div className="text-sm text-gray-300">Come back tomorrow for new challenges</div>
        </motion.div>
      )}
    </div>
  );
}

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours}h ${minutes}m ${seconds}s`;
}
