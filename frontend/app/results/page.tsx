"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import MilestoneModal from "@/components/MilestoneModal";

type QuizAnswer = {
  question: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
};

type QuizResults = {
  topic: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  xpEarned: number;
  answers: QuizAnswer[];
  timestamp: number;
  timeTaken?: number;
  timeBonus?: number;
};

export default function ResultsPage() {
  const router = useRouter();
  const { user } = useGame();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "correct" | "wrong">("all");
  const [milestoneData, setMilestoneData] = useState<{
    milestone: { days: number; freezeTokens: number; bonusXP: number };
    newMultiplier: number;
  } | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("eduquest_quiz_results");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setResults(data);
      } catch (error) {
        console.error("Failed to parse quiz results:", error);
        router.push("/dashboard");
      }
    } else {
      // No results found, redirect to dashboard
      router.push("/dashboard");
    }

    // Check for pending milestone
    const pendingMilestone = localStorage.getItem("eduquest_pending_milestone");
    if (pendingMilestone) {
      try {
        const data = JSON.parse(pendingMilestone);
        setMilestoneData(data);
        localStorage.removeItem("eduquest_pending_milestone");
        
        // Show milestone modal after a short delay
        setTimeout(() => {
          setShowMilestone(true);
        }, 2000);
      } catch (error) {
        console.error("Failed to parse milestone data:", error);
      }
    }
  }, [router]);

  if (!results) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
        <div className="text-4xl animate-pulse">⚔️</div>
      </div>
    );
  }

  const percentage = Math.round((results.correctCount / results.totalQuestions) * 100);
  const grade = percentage >= 90 ? "S" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "D";
  const emoji = percentage >= 80 ? "🏆" : percentage >= 60 ? "⭐" : "📚";

  const filteredAnswers = results.answers.filter((a) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "correct") return a.isCorrect;
    if (selectedFilter === "wrong") return !a.isCorrect;
    return true;
  });

  const handleReEvaluate = () => {
    // Store wrong answers for re-evaluation
    const wrongAnswers = results.answers.filter((a) => !a.isCorrect);
    if (wrongAnswers.length === 0) {
      alert("Perfect score! No questions to re-evaluate.");
      return;
    }

    // Convert to quiz format
    const retryQuiz = {
      topic: `${results.topic} (Retry)`,
      items: wrongAnswers.map((a) => ({
        question: a.question,
        options: a.options,
        answer: a.correctAnswer,
        explanation: a.explanation,
      })),
      content_id: `retry_${Date.now()}`,
    };

    sessionStorage.setItem("eduquest_quiz", JSON.stringify(retryQuiz));
    router.push("/game");
  };

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
            📊 Quiz Results
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-300 hover:text-yellow-300 underline transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-8 shadow-2xl mb-8"
        >
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{emoji}</div>
            <h2 className="text-4xl font-extrabold text-white mb-2">Quest Complete!</h2>
            <p className="text-xl text-gray-300">{results.topic}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-purple-900/50 rounded-xl p-4 text-center border-2 border-purple-400/30">
              <div className="text-3xl font-bold text-yellow-300">{results.xpEarned}</div>
              <div className="text-sm text-gray-300">XP Earned</div>
              {results.timeBonus && results.timeBonus > 0 && (
                <div className="text-xs text-blue-300 mt-1">+{results.timeBonus} speed</div>
              )}
            </div>
            <div className="bg-purple-900/50 rounded-xl p-4 text-center border-2 border-purple-400/30">
              <div className="text-3xl font-bold text-green-400">{percentage}%</div>
              <div className="text-sm text-gray-300">Score</div>
            </div>
            <div className="bg-purple-900/50 rounded-xl p-4 text-center border-2 border-purple-400/30">
              <div className="text-2xl font-bold text-green-300">{results.correctCount}</div>
              <div className="text-sm text-gray-300">Correct</div>
            </div>
            <div className="bg-purple-900/50 rounded-xl p-4 text-center border-2 border-purple-400/30">
              <div className="text-2xl font-bold text-red-300">{results.wrongCount}</div>
              <div className="text-sm text-gray-300">Wrong</div>
            </div>
            {results.timeTaken !== undefined && (
              <div className="bg-purple-900/50 rounded-xl p-4 text-center border-2 border-purple-400/30">
                <div className="text-2xl font-bold text-blue-300">
                  {Math.floor(results.timeTaken / 60)}:{String(results.timeTaken % 60).padStart(2, "0")}
                </div>
                <div className="text-sm text-gray-300">Time Taken</div>
              </div>
            )}
          </div>

          {/* Grade Badge */}
          <div className="mb-6 p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg text-center">
            <div className="text-5xl font-black text-white">{grade}</div>
            <div className="text-sm text-white">Performance Grade</div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-bold rounded-xl shadow-lg hover:scale-105 transition-all duration-200"
            >
              {showDetails ? "📊 Hide Details" : "📋 View Details"}
            </button>
            {results.wrongCount > 0 && (
              <button
                onClick={handleReEvaluate}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-lg font-bold rounded-xl shadow-lg hover:scale-105 transition-all duration-200"
              >
                🔄 Re-Evaluate Wrong Answers
              </button>
            )}
            <button
              onClick={() => router.push("/quest")}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-lg font-bold rounded-xl shadow-lg hover:scale-105 transition-all duration-200"
            >
              🔥 New Quest
            </button>
          </div>
        </motion.div>

        {/* Detailed Breakdown */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-2 border-purple-400/30 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Question Breakdown</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFilter("all")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedFilter === "all"
                      ? "bg-purple-500 text-white"
                      : "bg-purple-900/40 text-gray-300 hover:bg-purple-800/60"
                  }`}
                >
                  All ({results.answers.length})
                </button>
                <button
                  onClick={() => setSelectedFilter("correct")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedFilter === "correct"
                      ? "bg-green-500 text-white"
                      : "bg-purple-900/40 text-gray-300 hover:bg-purple-800/60"
                  }`}
                >
                  ✓ Correct ({results.correctCount})
                </button>
                <button
                  onClick={() => setSelectedFilter("wrong")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedFilter === "wrong"
                      ? "bg-red-500 text-white"
                      : "bg-purple-900/40 text-gray-300 hover:bg-purple-800/60"
                  }`}
                >
                  ✗ Wrong ({results.wrongCount})
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAnswers.map((answer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-5 rounded-xl border-2 ${
                    answer.isCorrect
                      ? "bg-green-900/20 border-green-400/50"
                      : "bg-red-900/20 border-red-400/50"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">
                      {answer.isCorrect ? "✅" : "❌"}
                    </span>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-white mb-2">
                        {answer.question}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-400">Your answer:</span>
                          <span
                            className={`px-3 py-1 rounded-lg font-semibold ${
                              answer.isCorrect
                                ? "bg-green-500/30 text-green-200"
                                : "bg-red-500/30 text-red-200"
                            }`}
                          >
                            {answer.userAnswer}
                          </span>
                        </div>
                        {!answer.isCorrect && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-400">Correct answer:</span>
                            <span className="px-3 py-1 rounded-lg bg-green-500/30 text-green-200 font-semibold">
                              {answer.correctAnswer}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 p-3 bg-purple-900/40 rounded-lg border border-purple-400/30">
                        <p className="text-sm text-gray-300">
                          <span className="font-semibold text-yellow-300">💡 Explanation:</span>{" "}
                          {answer.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Milestone Modal */}
      {milestoneData && (
        <MilestoneModal
          isOpen={showMilestone}
          onClose={() => setShowMilestone(false)}
          milestone={milestoneData.milestone}
          newMultiplier={milestoneData.newMultiplier}
        />
      )}
    </main>
  );
}
