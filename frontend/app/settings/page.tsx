"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import { useSound } from "@/utils/soundManager";

export default function SettingsPage() {
  const { user } = useGame();
  const router = useRouter();
  const sound = useSound();

  const [soundEnabled, setSoundEnabled] = useState(sound.settings.enabled);
  const [volume, setVolume] = useState(sound.settings.volume);
  const [soundPack, setSoundPackState] = useState(sound.settings.soundPack);

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
    }
  }, [user, router]);

  const handleSoundToggle = () => {
    const newState = sound.toggle();
    setSoundEnabled(newState);
    
    // Play confirmation sound if enabling
    if (newState) {
      setTimeout(() => sound.play("success"), 100);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    sound.setVolume(newVolume);
    
    // Play test sound
    sound.play("pop");
  };

  const handleSoundPackChange = (pack: "default" | "retro" | "minimal") => {
    setSoundPackState(pack);
    sound.setSoundPack(pack);
    sound.play("success");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => {
              sound.play("click");
              router.push("/dashboard");
            }}
            onMouseEnter={() => sound.play("hover")}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-4"
          >
            <span className="text-2xl">←</span>
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-2 border-purple-400/40 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-4">
              <span className="text-6xl">⚙️</span>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-300 text-lg">
                  Customize your EduQuest experience
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Sound Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-purple-900/40 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">🔊</span>
              Sound Effects
            </h2>

            {/* Sound Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Enable Sound Effects</h3>
                  <p className="text-sm text-gray-400">
                    Play sounds on hover, clicks, and achievements
                  </p>
                </div>
                <button
                  onClick={handleSoundToggle}
                  className={`relative w-16 h-8 rounded-full transition-colors ${
                    soundEnabled ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                    animate={{ left: soundEnabled ? "36px" : "4px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            {/* Volume Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Volume</h3>
                <span className="text-cyan-400 font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                disabled={!soundEnabled}
                className="w-full h-2 bg-purple-800/60 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: soundEnabled
                    ? `linear-gradient(to right, #a855f7 0%, #a855f7 ${volume * 100}%, #4c1d95 ${volume * 100}%, #4c1d95 100%)`
                    : undefined,
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Sound Pack Selection */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Sound Pack</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["default", "retro", "minimal"] as const).map((pack) => (
                  <button
                    key={pack}
                    onClick={() => handleSoundPackChange(pack)}
                    onMouseEnter={() => sound.play("hover")}
                    disabled={!soundEnabled}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      soundPack === pack
                        ? "bg-purple-600/40 border-purple-400 shadow-lg"
                        : "bg-purple-800/20 border-purple-600/30 hover:border-purple-500/50"
                    } ${!soundEnabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="text-3xl mb-2">
                      {pack === "default" && "🎵"}
                      {pack === "retro" && "🕹️"}
                      {pack === "minimal" && "🔔"}
                    </div>
                    <div className="text-white font-semibold capitalize">{pack}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {pack === "default" && "Balanced & pleasant"}
                      {pack === "retro" && "8-bit arcade style"}
                      {pack === "minimal" && "Subtle & clean"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Test Sound Button */}
            <div className="mt-6 pt-6 border-t border-purple-700/50">
              <button
                onClick={() => {
                  sound.play("achievement");
                  setTimeout(() => sound.play("xp-gain"), 200);
                  setTimeout(() => sound.play("success"), 400);
                }}
                onMouseEnter={() => sound.play("hover")}
                disabled={!soundEnabled}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                🎧 Test Sounds
              </button>
            </div>
          </motion.div>

          {/* Display Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-900/40 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">🎨</span>
              Display
            </h2>

            <div className="space-y-4">
              {/* Animations Toggle */}
              <div className="flex items-center justify-between p-4 bg-purple-800/20 rounded-xl">
                <div>
                  <h3 className="text-lg font-semibold text-white">Animations</h3>
                  <p className="text-sm text-gray-400">
                    Enable smooth transitions and effects
                  </p>
                </div>
                <button className="relative w-16 h-8 rounded-full bg-green-500">
                  <div className="absolute top-1 left-9 w-6 h-6 bg-white rounded-full shadow-lg" />
                </button>
              </div>

              {/* Particles Toggle */}
              <div className="flex items-center justify-between p-4 bg-purple-800/20 rounded-xl">
                <div>
                  <h3 className="text-lg font-semibold text-white">Particle Effects</h3>
                  <p className="text-sm text-gray-400">
                    Show confetti and particle bursts
                  </p>
                </div>
                <button className="relative w-16 h-8 rounded-full bg-green-500">
                  <div className="absolute top-1 left-9 w-6 h-6 bg-white rounded-full shadow-lg" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Notifications Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-purple-900/40 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">🔔</span>
              Notifications
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-800/20 rounded-xl">
                <div>
                  <h3 className="text-lg font-semibold text-white">Achievement Alerts</h3>
                  <p className="text-sm text-gray-400">
                    Show popups when you unlock achievements
                  </p>
                </div>
                <button className="relative w-16 h-8 rounded-full bg-green-500">
                  <div className="absolute top-1 left-9 w-6 h-6 bg-white rounded-full shadow-lg" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-800/20 rounded-xl">
                <div>
                  <h3 className="text-lg font-semibold text-white">Quest Reminders</h3>
                  <p className="text-sm text-gray-400">
                    Remind you about incomplete daily quests
                  </p>
                </div>
                <button className="relative w-16 h-8 rounded-full bg-green-500">
                  <div className="absolute top-1 left-9 w-6 h-6 bg-white rounded-full shadow-lg" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Account Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-purple-900/40 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">👤</span>
              Account
            </h2>

            <div className="space-y-4">
              <button
                onClick={() => router.push("/profile?edit=true")}
                onMouseEnter={() => sound.play("hover")}
                className="w-full p-4 bg-purple-800/20 rounded-xl text-left hover:bg-purple-700/30 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
                <p className="text-sm text-gray-400">
                  Update your name, avatar, and goal
                </p>
              </button>

              <button
                onClick={() => router.push("/auth/forgot-password")}
                onMouseEnter={() => sound.play("hover")}
                className="w-full p-4 bg-purple-800/20 rounded-xl text-left hover:bg-purple-700/30 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white">Change Password</h3>
                <p className="text-sm text-gray-400">
                  Update your account password
                </p>
              </button>

              <button
                onClick={() => {
                  sound.play("error");
                  if (confirm("Are you sure you want to clear all local data?")) {
                    localStorage.clear();
                    router.push("/");
                    window.location.reload();
                  }
                }}
                onMouseEnter={() => sound.play("hover")}
                className="w-full p-4 bg-red-900/20 border border-red-600/30 rounded-xl text-left hover:bg-red-800/30 transition-colors"
              >
                <h3 className="text-lg font-semibold text-red-400">Clear Local Data</h3>
                <p className="text-sm text-gray-400">
                  Remove all cached data (logout)
                </p>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
