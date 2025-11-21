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
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("eduquest_user");
    if (savedUser) {
      setUserState(JSON.parse(savedUser));
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
    <GameContext.Provider value={{ user, setUser, updateStats, updateProfile, isLoading }}>
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
