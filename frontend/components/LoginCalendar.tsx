"use client";

import { useState, useEffect } from "react";
import { Calendar, Check, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface LoginCalendarProps {
  userId: string;
  loginStreak: number;
}

interface DayStatus {
  date: Date;
  status: "logged-in" | "missed" | "future" | "today";
}

export default function LoginCalendar({ userId, loginStreak }: LoginCalendarProps) {
  const [calendarDays, setCalendarDays] = useState<DayStatus[]>([]);

  useEffect(() => {
    generateCalendar();
  }, [loginStreak]);

  const generateCalendar = () => {
    const today = new Date();
    const days: DayStatus[] = [];

    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      let status: "logged-in" | "missed" | "future" | "today";

      if (i === 0) {
        status = "today";
      } else if (i < loginStreak) {
        status = "logged-in";
      } else {
        status = "missed";
      }

      days.push({ date, status });
    }

    setCalendarDays(days);
  };

  const getDayColor = (status: string) => {
    switch (status) {
      case "today":
        return "bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300";
      case "logged-in":
        return "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400";
      case "missed":
        return "bg-gray-700/50 border-gray-600";
      default:
        return "bg-gray-800 border-gray-700";
    }
  };

  const getDayIcon = (status: string) => {
    switch (status) {
      case "today":
        return <Flame className="w-4 h-4 text-white" />;
      case "logged-in":
        return <Check className="w-4 h-4 text-white" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-purple-800/40 backdrop-blur-sm border-2 border-purple-400/30 rounded-2xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Login Calendar</h3>
          <p className="text-sm text-gray-300">Last 30 days</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-10 gap-1.5 max-w-md mx-auto">
        {calendarDays.map((day, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.02 }}
            className={`w-7 h-7 rounded-sm border flex items-center justify-center transition-all hover:scale-110 cursor-pointer ${getDayColor(
              day.status
            )}`}
            title={`${day.date.toLocaleDateString()} - ${day.status === "today" ? "Today" : day.status === "logged-in" ? "Logged in" : "Missed"}`}
          >
            <span className="text-xs">{getDayIcon(day.status)}</span>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-yellow-400 to-orange-500 border border-yellow-300"></div>
          <span className="text-gray-300">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-green-500 to-emerald-600 border border-green-400"></div>
          <span className="text-gray-300">Logged In</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-700/50 border border-gray-600"></div>
          <span className="text-gray-300">Missed</span>
        </div>
      </div>

      {/* Streak Info */}
      <div className="mt-6 pt-6 border-t border-purple-400/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-300">Current Streak</span>
          </div>
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            {loginStreak} {loginStreak === 1 ? 'Day' : 'Days'}
          </div>
        </div>
      </div>
    </div>
  );
}
