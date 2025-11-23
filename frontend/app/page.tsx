"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useGame();

  useEffect(() => {
    // Redirect to dashboard if user has completed onboarding
    if (!isLoading && user?.profile.goal) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-6xl animate-pulse">⚔️</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center text-white p-6">
      <div className="max-w-2xl w-full">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-10 text-center shadow-2xl">
          <div className="text-7xl mb-4">🎮</div>
          <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
            EduQuest AI
          </h1>
          <p className="text-2xl text-gray-200 mb-2">Transform Study into Adventure</p>
          <p className="text-lg text-gray-300 mb-8">Upload notes. Battle questions. Level up your knowledge!</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button 
              onClick={() => router.push("/auth/signup")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xl font-bold rounded-xl shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-200"
            >
              � Sign Up
            </button>
            <button 
              onClick={() => router.push("/auth/signin")}
              className="w-full sm:w-auto px-8 py-4 bg-purple-600/60 text-white text-xl font-bold rounded-xl border-2 border-purple-400/50 shadow-lg hover:bg-purple-600/80 hover:scale-105 transition-all duration-200"
            >
              ⚔️ Sign In
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push("/quest")}
              className="text-gray-300 hover:text-yellow-300 underline text-sm transition-colors"
            >
              or continue as guest →
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-4 text-center">
            <div className="text-4xl mb-2">🧠</div>
            <div className="text-sm font-semibold text-gray-200">AI-Powered</div>
          </div>
          <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-4 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-sm font-semibold text-gray-200">Instant Quizzes</div>
          </div>
          <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-xl p-4 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-sm font-semibold text-gray-200">Smart Tutor</div>
          </div>
        </div>
      </div>
    </main>
  );
}
