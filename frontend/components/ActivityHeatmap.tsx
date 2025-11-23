"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ActivityDay {
  date: Date;
  count: number;
  level: number; // 0-4 intensity level
}

interface ActivityHeatmapProps {
  userId: string;
}

export default function ActivityHeatmap({ userId }: ActivityHeatmapProps) {
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);

  useEffect(() => {
    generateActivityData();
    
    // Listen for activity updates
    const handleActivityUpdate = () => {
      generateActivityData();
    };
    
    window.addEventListener('activityUpdated', handleActivityUpdate);
    return () => window.removeEventListener('activityUpdated', handleActivityUpdate);
  }, [userId]);

  const generateActivityData = () => {
    // Generate last 12 weeks of data (84 days)
    const days: ActivityDay[] = [];
    const today = new Date();
    
    // Get activity from localStorage (temporary until backend integration)
    const storedActivity = localStorage.getItem(`activity_${userId}`);
    const activityMap = storedActivity ? JSON.parse(storedActivity) : {};

    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const count = activityMap[dateKey] || 0;
      const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4;

      days.push({ date, count, level });
    }

    setActivityData(days);
  };

  const getColorClass = (level: number) => {
    switch (level) {
      case 0: return "bg-purple-900/30 border-purple-700/50";
      case 1: return "bg-green-900/60 border-green-700/70";
      case 2: return "bg-green-700/70 border-green-600/80";
      case 3: return "bg-green-500/80 border-green-400/90";
      case 4: return "bg-green-400 border-green-300";
      default: return "bg-purple-900/30 border-purple-700/50";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getMonthLabels = () => {
    const months: string[] = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthName);
    }
    
    return months;
  };

  // Group days into weeks
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < activityData.length; i += 7) {
    weeks.push(activityData.slice(i, i + 7));
  }

  const totalActiveDays = activityData.filter(d => d.count > 0).length;
  const maxStreak = calculateMaxStreak(activityData);
  const currentStreak = calculateCurrentStreak(activityData);

  return (
    <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">📊</span>
          Activity History
        </h2>
        <div className="flex gap-4 text-sm">
          <div className="bg-purple-800/40 px-3 py-1 rounded-full">
            <span className="text-gray-300">Active Days: </span>
            <span className="text-green-400 font-bold">{totalActiveDays}</span>
          </div>
          <div className="bg-purple-800/40 px-3 py-1 rounded-full">
            <span className="text-gray-300">Max Streak: </span>
            <span className="text-yellow-400 font-bold">{maxStreak} 🔥</span>
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-1 mb-2 text-xs text-gray-400">
        {getMonthLabels().map((month, idx) => (
          <div key={idx} className="w-14 text-center">
            {idx % 3 === 0 ? month : ''}
          </div>
        ))}
      </div>

      {/* Heatmap grid - Full width with scrolling */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-2 text-xs text-gray-400 mr-2">
            <div className="h-5"></div>
            <div className="h-5">Mon</div>
            <div className="h-5"></div>
            <div className="h-5">Wed</div>
            <div className="h-5"></div>
            <div className="h-5">Fri</div>
            <div className="h-5"></div>
          </div>

          {/* Activity squares */}
          <div className="flex gap-2">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-2">
                {week.map((day, dayIdx) => (
                  <motion.div
                    key={`${weekIdx}-${dayIdx}`}
                    whileHover={{ scale: 1.15 }}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-5 h-5 rounded-sm border ${getColorClass(day.level)} cursor-pointer transition-all`}
                    title={`${formatDate(day.date)}: ${day.count} activities`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-purple-800/60 border border-purple-400/50 rounded-lg p-3 text-sm"
        >
          <div className="text-white font-semibold">{formatDate(hoveredDay.date)}</div>
          <div className="text-gray-300">
            {hoveredDay.count === 0 ? (
              "No activity"
            ) : (
              <>
                <span className="text-green-400 font-bold">{hoveredDay.count}</span> {hoveredDay.count === 1 ? 'quiz' : 'quizzes'} completed
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`w-4 h-4 rounded-sm border ${getColorClass(level)}`}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function calculateMaxStreak(days: ActivityDay[]): number {
  let maxStreak = 0;
  let currentStreak = 0;

  for (const day of days) {
    if (day.count > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

function calculateCurrentStreak(days: ActivityDay[]): number {
  let streak = 0;
  
  // Count backwards from today
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
