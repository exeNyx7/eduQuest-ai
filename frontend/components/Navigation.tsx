"use client";

import { useRouter, usePathname } from "next/navigation";
import { useGame } from "@/contexts/GameContext";
import { useState, useEffect, useRef } from "react";

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useGame();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide navigation on auth pages and homepage
  if (!user || pathname === "/" || pathname?.startsWith("/auth") || pathname?.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-purple-900/80 backdrop-blur-lg border-b-2 border-purple-400/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors"
          >
            <span className="text-2xl">🎮</span>
            <span className="text-xl font-bold">EduQuest</span>
          </button>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            {!user.isGuest && (
              <>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-gray-300 hover:text-yellow-300 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  🏠 Dashboard
                </button>
                <button
                  onClick={() => router.push("/arena")}
                  className="text-gray-300 hover:text-yellow-300 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  🏆 Arena
                </button>
              </>
            )}
            
            <button
              onClick={() => router.push("/quest")}
              className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-2 rounded-lg font-bold hover:scale-105 transition-all text-sm shadow-lg"
            >
              ⚔️ New Quest
            </button>

            {user.isGuest ? (
              <button
                onClick={() => router.push("/auth/signup")}
                className="text-gray-300 hover:text-yellow-300 px-3 py-2 rounded-lg transition-colors text-sm font-medium border border-yellow-400/50"
              >
                📝 Sign Up
              </button>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-purple-400/30 relative" ref={dropdownRef}>
                {/* Avatar - Click to go to profile */}
                <button
                  onClick={() => router.push("/profile")}
                  className="hover:opacity-80 transition-opacity"
                  title="View Profile"
                >
                  <img
                    src={user.image}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border-2 border-yellow-400 hover:border-yellow-300"
                  />
                </button>

                {/* Name - Click to toggle dropdown */}
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="hidden sm:flex items-center gap-1 hover:text-yellow-300 transition-colors"
                >
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                    <div className="text-xs text-yellow-300">{user.stats.totalXP} XP</div>
                  </div>
                  <span className="text-gray-400 text-xs ml-1">
                    {showDropdown ? "▲" : "▼"}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-purple-900/95 backdrop-blur-lg border-2 border-purple-400/50 rounded-xl shadow-2xl overflow-hidden z-50">
                    <button
                      onClick={() => {
                        router.push("/profile");
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-purple-700/60 transition-colors flex items-center gap-2"
                    >
                      <span>👤</span>
                      <span>View Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push("/quests");
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-purple-700/60 transition-colors flex items-center gap-2 border-t border-purple-700/50"
                    >
                      <span>🎯</span>
                      <span>My Quests</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push("/settings");
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-purple-700/60 transition-colors flex items-center gap-2 border-t border-purple-700/50"
                    >
                      <span>⚙️</span>
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem("eduquest_user");
                        localStorage.removeItem("eduquest_onboarding_done");
                        router.push("/");
                        window.location.reload();
                      }}
                      className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/30 transition-colors flex items-center gap-2 border-t border-purple-700/50"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
