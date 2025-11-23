"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  totalXP: number;
  rankTier: string;
  goal?: string;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number | null;
  userPercentile: number | null;
  totalPlayers: number;
}

const RANK_COLORS = {
  Bronze: "#CD7F32",
  Silver: "#C0C0C0",
  Gold: "#FFD700",
  Platinum: "#E5E4E2",
  Diamond: "#B9F2FF",
};

const RANK_EMOJIS = {
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Diamond: "💠",
};

export default function ArenaPage() {
  const { user } = useGame();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [filter, setFilter] = useState<string>("global");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, user]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");

    try {
      const goal = filter === "global" ? "" : filter;
      const userId = user?.id || "";
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/leaderboard?goal=${goal}&limit=100&user_id=${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data: LeaderboardData = await response.json();
      setLeaderboard(data);
      console.log("[ARENA] Leaderboard loaded:", data);
    } catch (err: any) {
      console.error("[ARENA] Error:", err);
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-12 text-center shadow-2xl">
          <div className="text-6xl mb-4 animate-bounce">⚔️</div>
          <h2 className="text-2xl font-bold text-white">Loading Arena...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-7xl mb-4">🏆</div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 mb-2">
            The Arena
          </h1>
          <p className="text-xl text-gray-200">Compete with warriors across the realm</p>
        </motion.div>

        {/* User Stats Card */}
        {user && leaderboard?.userRank && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-lg border-4 border-yellow-400/50 rounded-2xl p-6 mb-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-16 h-16 rounded-full border-4 border-yellow-400"
                />
                <div>
                  <h3 className="text-2xl font-bold text-white">{user.name}</h3>
                  <p className="text-gray-300">Your Rank: #{leaderboard.userRank}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-400">
                  {user.stats.totalXP} XP
                </div>
                <div className="text-lg text-gray-200">
                  Top {leaderboard.userPercentile?.toFixed(1)}%
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["global", "SAT", "GRE", "STEM", "General"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                filter === tab
                  ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 scale-105"
                  : "bg-purple-800/40 text-gray-200 hover:bg-purple-700/60"
              }`}
            >
              {tab === "global" ? "🌍 Global" : `📚 ${tab}`}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border-2 border-red-400 rounded-xl p-4 mb-6">
            <p className="text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {leaderboard && leaderboard.entries.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-4 border-purple-400/30 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b-2 border-purple-400/30">
              <h2 className="text-2xl font-bold text-white">
                Top {leaderboard.entries.length} Warriors
              </h2>
              <p className="text-gray-300">
                Total Players: {leaderboard.totalPlayers.toLocaleString()}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-purple-900/50 text-gray-300 text-sm">
                    <th className="px-6 py-4 text-left">Rank</th>
                    <th className="px-6 py-4 text-left">Player</th>
                    <th className="px-6 py-4 text-left">Tier</th>
                    <th className="px-6 py-4 text-right">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.map((entry, index) => {
                    const isCurrentUser = user && entry.userId === user.id;
                    const isTopThree = entry.rank <= 3;

                    return (
                      <motion.tr
                        key={entry.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`border-b border-purple-400/20 transition-colors ${
                          isCurrentUser
                            ? "bg-yellow-400/20 border-yellow-400/50"
                            : "hover:bg-purple-700/30"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isTopThree ? (
                              <span className="text-3xl">
                                {entry.rank === 1
                                  ? "🥇"
                                  : entry.rank === 2
                                  ? "🥈"
                                  : "🥉"}
                              </span>
                            ) : (
                              <span className="text-xl font-bold text-gray-300">
                                #{entry.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={entry.avatar}
                              alt={entry.username}
                              className={`w-12 h-12 rounded-full border-2 ${
                                isCurrentUser ? "border-yellow-400" : "border-purple-400"
                              }`}
                            />
                            <div>
                              <div className="font-bold text-white">
                                {entry.username}
                                {isCurrentUser && (
                                  <span className="ml-2 text-yellow-400">(You)</span>
                                )}
                              </div>
                              {entry.goal && (
                                <div className="text-sm text-gray-400">{entry.goal}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {RANK_EMOJIS[entry.rankTier as keyof typeof RANK_EMOJIS]}
                            </span>
                            <span
                              className="font-bold"
                              style={{
                                color:
                                  RANK_COLORS[entry.rankTier as keyof typeof RANK_COLORS],
                              }}
                            >
                              {entry.rankTier}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-2xl font-bold text-yellow-400">
                            {entry.totalXP.toLocaleString()}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-8 text-center">
            <p className="text-xl text-gray-300">
              No warriors in this category yet. Be the first!
            </p>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="inline-block px-8 py-4 bg-purple-800/40 text-gray-200 text-lg font-semibold rounded-xl border-2 border-purple-400/30 hover:bg-purple-700/60 transition-all duration-200"
          >
            ← Back to Mission Control
          </a>
        </div>
      </div>
    </main>
  );
}
