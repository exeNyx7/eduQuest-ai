"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";

export default function SignUpPage() {
  const router = useRouter();
  const { setUser } = useGame();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    age: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 13) {
      setError("You must be at least 13 years old");
      setLoading(false);
      return;
    }

    try {
      // Call backend to create user
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            age,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Registration failed");
      }

      const userData = await response.json();
      console.log("[SIGNUP] User created:", userData);

      // Set user in context (convert to local format)
      const newUser = {
        id: userData._id || userData.id,
        name: userData.name,
        email: userData.email,
        image: userData.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`,
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
      
      // Redirect to onboarding or dashboard
      router.push("/onboarding");
    } catch (err: any) {
      console.error("[SIGNUP] Error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-8 shadow-2xl">
          <div className="text-6xl mb-4 text-center">🎮</div>
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 text-center">
            Create Account
          </h1>
          <p className="text-center text-gray-200 mb-6">
            Begin your learning adventure
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl bg-white/95 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                placeholder="johndoe"
                className="w-full px-4 py-3 rounded-xl bg-white/95 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/95 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="18"
                min="13"
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
              <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
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
              {loading ? "Creating Account..." : "🚀 Create Account"}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Already have an account?{" "}
              <a
                href="/auth/signin"
                className="text-yellow-300 hover:text-yellow-200 font-semibold underline"
              >
                Sign In
              </a>
            </p>
          </div>

          {/* Guest Mode */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-400"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-purple-900/50 text-gray-300">Or</span>
            </div>
          </div>

          <a
            href="/quest"
            className="block w-full px-8 py-3 bg-purple-800/40 text-gray-200 text-base font-semibold rounded-xl border-2 border-purple-400/30 hover:bg-purple-700/60 transition-all duration-200 text-center"
          >
            👤 Continue as Guest
          </a>
        </div>
      </div>
    </main>
  );
}
