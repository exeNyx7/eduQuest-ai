"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import QuestsSummary from "@/components/QuestsSummary";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import AchievementsPanel from "@/components/AchievementsPanel";
import AnimatedXPBar from "@/components/AnimatedXPBar";
import RankUpModal from "@/components/RankUpModal";
import StreakInfo from "@/components/StreakInfo";
import DailyBonusModal from "@/components/DailyBonusModal";
import LoginCalendar from "@/components/LoginCalendar";

const RANK_COLORS = {
  Bronze: "from-orange-700 to-orange-900",
  Silver: "from-gray-400 to-gray-600",
  Gold: "from-yellow-400 to-yellow-600",
  Platinum: "from-gray-300 to-gray-500",
  Diamond: "from-cyan-400 to-blue-600",
};

const RANK_THRESHOLDS = {
  Bronze: { min: 0, max: 500 },
  Silver: { min: 501, max: 1500 },
  Gold: { min: 1501, max: 3000 },
  Platinum: { min: 3001, max: 7500 },
  Diamond: { min: 7501, max: 999999 },
};

function getRankProgress(xp: number, rank: string) {
  const threshold = RANK_THRESHOLDS[rank as keyof typeof RANK_THRESHOLDS];
  if (!threshold) return 0;
  
  const progress = ((xp - threshold.min) / (threshold.max - threshold.min)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

function getNextRank(rank: string) {
  const ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const currentIndex = ranks.indexOf(rank);
  return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : "Diamond";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, updateStats } = useGame();
  const [mounted, setMounted] = useState(false);
  const [showRankUp, setShowRankUp] = useState(false);
  const [rankUpData, setRankUpData] = useState<{ oldRank: string; newRank: string; xpEarned: number } | null>(null);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [dailyBonusData, setDailyBonusData] = useState<any>(null);
  const [loginStreak, setLoginStreak] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // Check for pending rank-up notification
    const pendingRankUp = localStorage.getItem('eduquest_pending_rankup');
    if (pendingRankUp) {
      const data = JSON.parse(pendingRankUp);
      setRankUpData(data);
      setShowRankUp(true);
      localStorage.removeItem('eduquest_pending_rankup');
    }
  }, []);

  // Check daily login bonus
  useEffect(() => {
    const checkDailyBonus = async () => {
      if (!user) return;

      try {
        const res = await fetch(`/api/user/daily-bonus/check/${user.id}`);
        if (!res.ok) throw new Error("Failed to check daily bonus");

        const data = await res.json();
        console.log("[DAILY BONUS] Check result:", data);

        setLoginStreak(data.loginStreak || 0);

        if (data.claimable) {
          // Auto-claim the bonus
          const claimRes = await fetch(`/api/user/daily-bonus/claim/${user.id}`, {
            method: "POST",
          });

          if (claimRes.ok) {
            const claimData = await claimRes.json();
            console.log("[DAILY BONUS] Claimed:", claimData);

            // Update user stats
            if (updateStats && claimData.newTotalXP) {
              updateStats({
                totalXP: claimData.newTotalXP,
              });
            }

            // Show modal
            setDailyBonusData(claimData);
            setTimeout(() => {
              setShowDailyBonus(true);
            }, 1000); // Delay to show after rank up modal if present
          }
        }
      } catch (error) {
        console.error("Error checking daily bonus:", error);
      }
    };

    if (mounted && user) {
      checkDailyBonus();
    }
  }, [mounted, user]);

  useEffect(() => {
    // Only redirect to onboarding if NEW user (no goal set) AND hasn't completed onboarding yet
    const hasCompletedOnboarding = localStorage.getItem("eduquest_onboarding_done");
    if (mounted && user && !user.profile.goal && !hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [mounted, user, router]);

  if (isLoading || !mounted || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-4xl animate-pulse">⚔️</div>
      </div>
    );
  }

  const xpProgress = getRankProgress(user.stats.totalXP, user.rank);
  const nextRank = getNextRank(user.rank);
  const nextRankXP = RANK_THRESHOLDS[nextRank as keyof typeof RANK_THRESHOLDS]?.min || 999999;
  const xpToNextRank = nextRankXP - user.stats.totalXP;

  const accuracy =
    user.stats.correctAnswers + user.stats.wrongAnswers > 0
      ? Math.round((user.stats.correctAnswers / (user.stats.correctAnswers + user.stats.wrongAnswers)) * 100)
      : 0;

  return (
    <main className="min-h-screen p-6">
      {/* HUD - Heads Up Display */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar & Name */}
            <div className="flex items-center gap-4">
              <img
                src={user.image}
                alt="Avatar"
                className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                <p className="text-gray-300">{user.profile.powerLevel}</p>
              </div>
            </div>

            {/* Rank Badge */}
            <div className="flex-shrink-0">
              <div
                className={`px-6 py-3 rounded-xl border-4 border-white/30 bg-gradient-to-br ${
                  RANK_COLORS[user.rank as keyof typeof RANK_COLORS]
                } shadow-lg`}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{user.rank}</div>
                  <div className="text-xs text-white/80">Rank</div>
                </div>
              </div>
            </div>

            {/* XP Bar - Animated */}
            <div className="flex-1 w-full">
              <AnimatedXPBar
                currentXP={user.stats.totalXP}
                nextRankXP={nextRankXP}
                rank={user.rank}
              />
            </div>

            {/* Streak */}
            <div className="bg-orange-600/40 backdrop-blur-sm border-2 border-orange-400/50 rounded-xl px-6 py-3">
              <div className="text-center">
                <div className="text-3xl">🔥</div>
                <div className="text-2xl font-bold text-white">{user.stats.currentStreak}</div>
                <div className="text-xs text-gray-300">Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold text-green-400">{user.stats.questsCompleted}</div>
            <div className="text-sm text-gray-300">Quests</div>
          </div>

          <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-3xl font-bold text-blue-400">{accuracy}%</div>
            <div className="text-sm text-gray-300">Accuracy</div>
          </div>

          <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">✨</div>
            <div className="text-3xl font-bold text-yellow-400">{user.stats.correctAnswers}</div>
            <div className="text-sm text-gray-300">Correct</div>
          </div>

          <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">📚</div>
            <div className="text-3xl font-bold text-purple-400">{user.stats.longestStreak}</div>
            <div className="text-sm text-gray-300">Longest Streak</div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Start Quest */}
          <div
            onClick={() => router.push("/quest")}
            className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-8 cursor-pointer hover:scale-105 transition-all shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">📜</div>
              <div>
                <h2 className="text-3xl font-bold text-white">Start New Quest</h2>
                <p className="text-gray-200">Upload notes and battle questions</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-green-400 font-bold text-xl">+10 XP per question</span>
            </div>
          </div>

          {/* Arena (Leaderboard) */}
          <div
            onClick={() => router.push("/arena")}
            className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-lg border-4 border-purple-400/50 rounded-3xl p-8 cursor-pointer hover:scale-105 transition-all shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">🏆</div>
              <div>
                <h2 className="text-3xl font-bold text-white">Enter the Arena</h2>
                <p className="text-gray-200">Compete on the leaderboards</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-purple-300 font-bold text-xl">View Rankings</span>
            </div>
          </div>
        </div>

        {/* Streak Info & Milestones */}
        <div className="mb-8">
          <StreakInfo userId={user.id} />
        </div>

        {/* Login Calendar */}
        <div className="mb-8">
          <LoginCalendar userId={user.id} loginStreak={loginStreak} />
        </div>

        {/* Quests Summary */}
        <div className="mb-8">
          <QuestsSummary userId={user.id} />
        </div>

        {/* Activity Heatmap */}
        <div className="mb-8">
          <ActivityHeatmap userId={user.id} />
        </div>


      </div>

      {/* Rank Up Modal */}
      {rankUpData && (
        <RankUpModal
          show={showRankUp}
          oldRank={rankUpData.oldRank}
          newRank={rankUpData.newRank}
          xpEarned={rankUpData.xpEarned}
          onClose={() => setShowRankUp(false)}
        />
      )}

      {/* Daily Bonus Modal */}
      {dailyBonusData && (
        <DailyBonusModal
          isOpen={showDailyBonus}
          onClose={() => setShowDailyBonus(false)}
          bonus={dailyBonusData.bonus}
          loginStreak={dailyBonusData.loginStreak}
          nextBonus={dailyBonusData.bonus.nextBonus}
        />
      )}
    </main>
  );
}
