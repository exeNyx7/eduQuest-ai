"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";
import DailyQuestsWidget from "@/components/DailyQuestsWidget";
import WeeklyQuestsWidget from "@/components/WeeklyQuestsWidget";
import { motion } from "framer-motion";

export default function QuestsPage() {
  const { user } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-4"
          >
            <span className="text-2xl">←</span>
            <span>Back to Dashboard</span>
          </button>
          
          <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-2 border-purple-400/40 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">🎯</span>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Your Quests</h1>
                <p className="text-gray-300 text-lg">
                  Complete quests to earn bonus XP and climb the leaderboard!
                </p>
              </div>
            </div>

            {/* Quest Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">📅</div>
                <div className="text-2xl font-bold text-cyan-400">Daily</div>
                <div className="text-sm text-gray-300">Resets every midnight</div>
              </div>
              
              <div className="bg-indigo-800/40 backdrop-blur-sm border-2 border-indigo-400/30 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">📆</div>
                <div className="text-2xl font-bold text-blue-400">Weekly</div>
                <div className="text-sm text-gray-300">Resets every Monday</div>
              </div>
              
              <div className="bg-pink-800/40 backdrop-blur-sm border-2 border-pink-400/30 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">💎</div>
                <div className="text-2xl font-bold text-yellow-400">Bonus XP</div>
                <div className="text-sm text-gray-300">Complete all for rewards</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily Quests Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">📅</span>
            <h2 className="text-3xl font-bold text-white">Daily Quests</h2>
          </div>
          <DailyQuestsWidget userId={user.id} />
        </motion.div>

        {/* Weekly Quests Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">📆</span>
            <h2 className="text-3xl font-bold text-white">Weekly Quests</h2>
          </div>
          <WeeklyQuestsWidget userId={user.id} />
        </motion.div>

        {/* Quest Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 backdrop-blur-lg border-2 border-cyan-400/30 rounded-2xl p-6"
        >
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">💡</span>
            Quest Tips
          </h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-xl">🎯</span>
              <span><strong className="text-white">Daily Quests:</strong> Quick challenges that reset every day. Perfect for building consistent study habits!</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">🏃</span>
              <span><strong className="text-white">Weekly Quests:</strong> Bigger challenges with larger XP rewards. Plan your week to complete all three!</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">💎</span>
              <span><strong className="text-white">Bonus Rewards:</strong> Complete all weekly quests to unlock a massive 200 XP bonus!</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">🔥</span>
              <span><strong className="text-white">Streak Tips:</strong> Log in every day and complete at least one quiz to maintain your streak.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">⭐</span>
              <span><strong className="text-white">Perfect Scores:</strong> Aim for 100% to complete daily quests faster and earn bonus XP!</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
