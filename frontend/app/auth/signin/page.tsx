"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";

export default function SignIn() {
  const router = useRouter();
  const { setUser } = useGame();
  const [formData, setFormData] = useState({
    identifier: "", // username or email
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.identifier || !formData.password) {
      setError("Please enter your username/email and password");
      setLoading(false);
      return;
    }

    try {
      // Call backend to authenticate
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: formData.identifier,
            password: formData.password,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Login failed");
      }

      const userData = await response.json();
      console.log("[SIGNIN] User logged in:", userData);

      // Set user in context
      const newUser = {
        id: userData._id || userData.id,
        name: userData.name,
        email: userData.email,
        image: userData.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
        profile: userData.profile || {
          goal: null,
          subjects: [],
          powerLevel: "Novice",
        },
        stats: userData.stats || {
          totalXP: 0,
          currentStreak: 0,
          longestStreak: 0,
          questsCompleted: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
        },
        rank: userData.rank || "Bronze",
        isGuest: false,
      };

      setUser(newUser);

      // Redirect to dashboard or onboarding
      if (userData.profile?.goal) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      console.error("[SIGNIN] Error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-10 shadow-2xl">
          <div className="text-7xl mb-4 text-center">⚔️</div>
          <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 text-center">
            Welcome Back
          </h1>
          <p className="text-xl text-gray-200 mb-8 text-center">
            Sign in to continue your quest
          </p>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {/* Username or Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Username or Email
              </label>
              <input
                type="text"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                placeholder="johndoe or john@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/95 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/95 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-400 rounded-xl p-3">
                <p className="text-red-200 text-sm">⚠️ {error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-lg font-bold rounded-xl shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "🚀 Sign In"}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="text-center mb-4">
            <a
              href="/auth/forgot-password"
              className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
            >
              Forgot your password?
            </a>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mb-6">
            <p className="text-gray-300">
              Don't have an account?{" "}
              <a
                href="/auth/signup"
                className="text-yellow-300 hover:text-yellow-200 font-semibold underline"
              >
                Sign Up
              </a>
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-400"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-purple-900/50 text-gray-300">Or</span>
            </div>
          </div>

          {/* Guest Mode */}
          <button
            onClick={() => window.location.href = "/quest"}
            className="w-full px-8 py-3 bg-purple-800/40 text-gray-200 text-base font-semibold rounded-xl border-2 border-purple-400/30 hover:bg-purple-700/60 transition-all duration-200"
          >
            👤 Continue as Guest
            <span className="block text-xs text-gray-400 mt-1">(Limited features)</span>
          </button>
        </div>
      </div>
    </main>
  );
}
