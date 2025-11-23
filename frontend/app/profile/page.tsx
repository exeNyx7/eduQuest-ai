"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import AchievementsPanel from "@/components/AchievementsPanel";

const GOALS = ["SAT", "GRE", "STEM", "General Knowledge", "Language Learning", "Coding"];
const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Literature",
  "Computer Science",
  "Economics",
  "Psychology",
];

const POWER_LEVELS = ["Novice", "Apprentice", "Adept", "Expert", "Master", "Legend"];

const getPowerLevelEmoji = (level: string) => {
  switch (level) {
    case "Novice": return "🌱";
    case "Apprentice": return "📖";
    case "Adept": return "⚡";
    case "Expert": return "🔥";
    case "Master": return "💫";
    case "Legend": return "👑";
    default: return "⭐";
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, setUser } = useGame();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [powerLevel, setPowerLevel] = useState("Novice");
  const [avatarSeed, setAvatarSeed] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setGoal(user.profile.goal);
      setSubjects(user.profile.subjects);
      setPowerLevel(user.profile.powerLevel);
      setAvatarSeed(user.image.split("seed=")[1] || user.name);
    }
  }, [user]);

  // Check URL parameter for edit mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("edit") === "true") {
      setEditing(true);
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-4xl animate-pulse">⚔️</div>
      </div>
    );
  }

  const handleSave = () => {
    updateProfile({ goal, subjects, powerLevel });
    if (user) {
      setUser({
        ...user,
        name,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
      });
    }
    setEditing(false);
  };

  const toggleSubject = (subject: string) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
            ⚙️ Profile
          </h1>
          <div className="flex items-center gap-4">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-lg font-bold rounded-xl shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-200"
              >
                ✏️ Edit Profile
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-300 hover:text-yellow-300 underline transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-8 shadow-2xl">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                alt="Avatar"
                className="w-32 h-32 rounded-full border-4 border-yellow-400 shadow-lg"
              />
              {editing && (
                <button
                  onClick={() => setAvatarSeed(Math.random().toString(36).slice(2))}
                  className="absolute bottom-0 right-0 bg-yellow-400 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center font-bold hover:bg-yellow-300 transition-colors shadow-lg"
                >
                  🎲
                </button>
              )}
            </div>
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-4 px-4 py-2 rounded-xl bg-white/95 text-gray-900 text-center text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
              />
            ) : (
              <h2 className="mt-4 text-3xl font-bold text-white">{user.name}</h2>
            )}
            <p className="text-gray-300">{user.isGuest ? "Guest Account" : user.email}</p>
          </div>

          {/* Stats Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-purple-900/50 rounded-xl p-4 text-center border-2 border-purple-400/30">
              <div className="text-3xl font-bold text-yellow-300">{user.stats.totalXP}</div>
              <div className="text-sm text-gray-300">Total XP</div>
            </div>
            <div className="bg-purple-900/50 rounded-xl p-4 text-center border-2 border-purple-400/30">
              <div className="text-3xl font-bold text-green-300">{user.rank}</div>
              <div className="text-sm text-gray-300">Rank</div>
            </div>
            <div className="bg-purple-900/50 rounded-xl p-4 text-center border-2 border-purple-400/30">
              <div className="text-3xl font-bold text-blue-300">{user.stats.currentStreak}</div>
              <div className="text-sm text-gray-300">Streak</div>
            </div>
            <div className="bg-purple-900/50 rounded-xl p-4 text-center border-2 border-purple-400/30">
              <div className="text-3xl font-bold text-pink-300">{user.stats.questsCompleted}</div>
              <div className="text-sm text-gray-300">Quests</div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            {/* Goal */}
            <div>
              <label className="block text-lg font-semibold text-gray-200 mb-2">🎯 Learning Goal</label>
              {editing ? (
                <select
                  value={goal || ""}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-900/80 to-indigo-900/80 text-white font-semibold border-2 border-yellow-400/50 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 focus:border-yellow-400 cursor-pointer hover:border-yellow-300 transition-all"
                  style={{ 
                    backgroundImage: 'linear-gradient(135deg, rgba(88, 28, 135, 0.8) 0%, rgba(49, 46, 129, 0.8) 100%)'
                  }}
                >
                  <option value="" className="bg-purple-900 text-white">Select a goal...</option>
                  {GOALS.map((g) => (
                    <option key={g} value={g.toLowerCase()} className="bg-purple-900 text-white py-2">
                      {g}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 rounded-xl bg-purple-900/50 text-white text-lg border-2 border-purple-400/30">
                  {goal || "Not set"}
                </div>
              )}
            </div>

            {/* Power Level */}
            <div>
              <label className="block text-lg font-semibold text-gray-200 mb-2">⚡ Power Level</label>
              {editing ? (
                <select
                  value={powerLevel}
                  onChange={(e) => setPowerLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-900/80 to-indigo-900/80 text-white font-semibold border-2 border-green-400/50 focus:outline-none focus:ring-4 focus:ring-green-400/50 focus:border-green-400 cursor-pointer hover:border-green-300 transition-all"
                  style={{ 
                    backgroundImage: 'linear-gradient(135deg, rgba(88, 28, 135, 0.8) 0%, rgba(49, 46, 129, 0.8) 100%)'
                  }}
                >
                  {POWER_LEVELS.map((level) => (
                    <option key={level} value={level} className="bg-purple-900 text-white py-2">
                      {getPowerLevelEmoji(level)} {level}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 rounded-xl bg-purple-900/50 text-white text-lg border-2 border-purple-400/30">
                  {powerLevel}
                </div>
              )}
            </div>

            {/* Subjects */}
            <div>
              <label className="block text-lg font-semibold text-gray-200 mb-2">📚 Subjects of Interest</label>
              {editing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        subjects.includes(subject)
                          ? "bg-yellow-400 text-gray-900"
                          : "bg-purple-800/40 text-gray-300 hover:bg-purple-700/60"
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <span
                        key={subject}
                        className="px-4 py-2 rounded-xl bg-yellow-400 text-gray-900 text-sm font-semibold"
                      >
                        {subject}
                      </span>
                    ))
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-purple-900/50 text-gray-400 text-lg border-2 border-purple-400/30">
                      No subjects selected
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleSave}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xl font-bold rounded-xl shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-200"
              >
                💾 Save Changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  // Reset to original values
                  if (user) {
                    setName(user.name);
                    setGoal(user.profile.goal);
                    setSubjects(user.profile.subjects);
                    setPowerLevel(user.profile.powerLevel);
                    setAvatarSeed(user.image.split("seed=")[1] || user.name);
                  }
                }}
                className="flex-1 px-8 py-4 bg-purple-800/60 text-white text-xl font-bold rounded-xl border-2 border-purple-400/50 hover:bg-purple-700/80 transition-all duration-200"
              >
                ❌ Cancel
              </button>
            </div>
          )}

          {/* Guest Upgrade */}
          {user.isGuest && (
            <div className="mt-6 p-4 bg-blue-500/20 border-2 border-blue-400 rounded-xl text-center">
              <p className="text-blue-200 mb-3">
                👤 You're using a guest account. Sign up to save your progress permanently!
              </p>
              <button
                onClick={() => router.push("/auth/signup")}
                className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 transition-colors"
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Achievements Section */}
        {!user.isGuest && (
          <div className="mt-8">
            <AchievementsPanel userId={user.id} />
          </div>
        )}
      </div>
    </main>
  );
}
