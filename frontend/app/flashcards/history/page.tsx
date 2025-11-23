"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import {
  Brain,
  History,
  Clock,
  TrendingUp,
  X,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from "lucide-react";

interface ReviewEntry {
  flashcardId: string;
  front: string;
  back: string;
  timestamp: string;
  quality: number;
  interval: number;
  easeFactor: number;
}

interface HistoryStats {
  totalReviews: number;
  averageQuality: number;
  qualityDistribution: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
}

export default function FlashcardHistoryPage() {
  const { user } = useGame();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    totalReviews: 0,
    averageQuality: 0,
    qualityDistribution: { again: 0, hard: 0, good: 0, easy: 0 },
  });

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/flashcards/history/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingColor = (quality: number) => {
    switch (quality) {
      case 1:
        return "bg-red-500/20 text-red-300 border-red-400/30";
      case 2:
        return "bg-orange-500/20 text-orange-300 border-orange-400/30";
      case 3:
        return "bg-blue-500/20 text-blue-300 border-blue-400/30";
      case 4:
        return "bg-green-500/20 text-green-300 border-green-400/30";
      default:
        return "bg-white/10 text-white border-white/20";
    }
  };

  const getRatingLabel = (quality: number) => {
    switch (quality) {
      case 1:
        return "Again";
      case 2:
        return "Hard";
      case 3:
        return "Good";
      case 4:
        return "Easy";
      default:
        return "Unknown";
    }
  };

  if (!mounted || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <History className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">Review History</h1>
              <p className="text-purple-200">Track your learning progress over time</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-black text-white">{stats.totalReviews}</div>
            <div className="text-sm text-purple-200">Total Reviews</div>
          </div>
          <div className="bg-red-500/20 backdrop-blur-lg rounded-xl p-4 border border-red-400/30">
            <X className="w-6 h-6 text-red-400 mb-1" />
            <div className="text-2xl font-black text-red-300">{stats.qualityDistribution.again}</div>
            <div className="text-sm text-red-200">Again</div>
          </div>
          <div className="bg-orange-500/20 backdrop-blur-lg rounded-xl p-4 border border-orange-400/30">
            <ThumbsDown className="w-6 h-6 text-orange-400 mb-1" />
            <div className="text-2xl font-black text-orange-300">{stats.qualityDistribution.hard}</div>
            <div className="text-sm text-orange-200">Hard</div>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-400/30">
            <ThumbsUp className="w-6 h-6 text-blue-400 mb-1" />
            <div className="text-2xl font-black text-blue-300">{stats.qualityDistribution.good}</div>
            <div className="text-sm text-blue-200">Good</div>
          </div>
          <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-4 border border-green-400/30">
            <Zap className="w-6 h-6 text-green-400 mb-1" />
            <div className="text-2xl font-black text-green-300">{stats.qualityDistribution.easy}</div>
            <div className="text-sm text-green-200">Easy</div>
          </div>
        </motion.div>

        {/* Average Quality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-400/30 mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-purple-300" />
            <h2 className="text-xl font-bold text-white">Average Quality Score</h2>
          </div>
          <div className="text-5xl font-black text-white">{stats.averageQuality}</div>
          <div className="text-sm text-purple-200 mt-1">out of 4.0</div>
        </motion.div>

        {/* Review Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Reviews
          </h2>

          {isLoading ? (
            <div className="text-center py-12 text-purple-200">Loading...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-xl text-white font-bold mb-2">No reviews yet</p>
              <p className="text-purple-200 mb-6">
                Start reviewing flashcards to build your history
              </p>
              <button
                onClick={() => router.push("/flashcards")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg transition-all"
              >
                Go to Flashcards
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {reviews.map((review, index) => (
                <motion.div
                  key={`${review.flashcardId}-${review.timestamp}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-400/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold mb-1 line-clamp-2">
                        {review.front}
                      </p>
                      <p className="text-sm text-purple-200 mb-2 line-clamp-1">
                        {review.back}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-purple-300">
                        <Clock className="w-3 h-3" />
                        {new Date(review.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRatingColor(
                          review.quality
                        )}`}
                      >
                        {getRatingLabel(review.quality)}
                      </span>
                      <span className="text-xs text-purple-300">
                        Next: {review.interval} day{review.interval !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => router.push("/flashcards")}
            className="px-8 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all"
          >
            ← Back to Flashcards
          </button>
        </motion.div>
      </div>
    </div>
  );
}
