"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserProfile {
  goal: string | null;
  subjects: string[];
  powerLevel: string;
}

interface UserStats {
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  questsCompleted: number;
  correctAnswers: number;
  wrongAnswers: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  profile: UserProfile;
  stats: UserStats;
  rank: string;
  isGuest: boolean;
}

interface GameContextType {
  user: User | null;
  setUser: (user: User) => void;
  updateStats: (stats: Partial<UserStats>) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  refreshUser: (userId: string) => Promise<void>;
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async (userId: string) => {
    if (userId.startsWith("guest_")) {
      console.log("Guest user, no refresh needed.");
      return;
    }
    try {
      console.log(`[GameContext] Refreshing user ${userId}`);
      const res = await fetch(`/api/user/profile/${userId}`);
      if (res.ok) {
        const updatedUserData = await res.json();
        // The backend returns _id, but the frontend uses id.
        const frontendUser = { ...updatedUserData, id: updatedUserData._id };
        delete frontendUser._id;
        setUser(frontendUser);
        console.log("[GameContext] User refreshed from API");
      } else {
        console.error("[GameContext] Failed to refresh user, using localStorage version.");
        // If API fails, we stick with localStorage but log it.
        const savedUser = localStorage.getItem("eduquest_user");
        if (savedUser) {
          setUserState(JSON.parse(savedUser));
        }
      }
    } catch (error) {
      console.error("[GameContext] Error refreshing user:", error);
    }
  };

  // Initialize user from localStorage on mount
  useEffect(() => {
    const savedUserString = localStorage.getItem("eduquest_user");
    if (savedUserString) {
      const savedUser = JSON.parse(savedUserString);
      setUserState(savedUser);
      if (!savedUser.isGuest) {
        refreshUser(savedUser.id);
      }
    } else {
      // Create guest user with DiceBear avatar
      const guestId = `guest_${Date.now()}`;
      const guestUser: User = {
        id: guestId,
        name: "Guest Adventurer",
        email: "",
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`,
        profile: {
          goal: null,
          subjects: [],
          powerLevel: "Novice",
        },
        stats: {
          totalXP: 0,
          currentStreak: 0,
          longestStreak: 0,
          questsCompleted: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
        },
        rank: "Bronze",
        isGuest: true,
      };
      setUserState(guestUser);
      localStorage.setItem("eduquest_user", JSON.stringify(guestUser));
    }
    setIsLoading(false);
  }, []);

  const setUser = (newUser: User) => {
    setUserState(newUser);
    localStorage.setItem("eduquest_user", JSON.stringify(newUser));
  };

  const updateStats = (newStats: Partial<UserStats>) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      stats: { ...user.stats, ...newStats },
    };
    setUser(updatedUser);
  };

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      profile: { ...user.profile, ...newProfile },
    };
    setUser(updatedUser);
  };

  return (
    <GameContext.Provider value={{ user, setUser, updateStats, updateProfile, refreshUser, isLoading }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
