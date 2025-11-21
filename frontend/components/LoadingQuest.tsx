"use client";

import { useEffect, useState } from "react";

const phrases = [
  "🔮 Summoning the Knowledge Guardian...",
  "⚔️ Crafting your Epic Quest...",
  "📜 Forging the Quiz Scrolls...",
  "🧙‍♂️ Awakening the Wisdom Wizard...",
  "✨ Enchanting the Questions...",
];

export default function LoadingQuest() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % phrases.length), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-12 text-center shadow-2xl max-w-md w-full">
        {/* Animated Icon */}
        <div className="text-8xl mb-6 animate-bounce">
          {index % 2 === 0 ? "�" : "✨"}
        </div>
        
        {/* Loading Text */}
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300 mb-4 animate-pulse">
          {phrases[index]}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-purple-900/50 rounded-full h-3 mb-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 animate-pulse rounded-full" style={{ width: '70%' }}></div>
        </div>
        
        <div className="text-lg text-gray-200">
          Preparing your learning adventure...
        </div>
      </div>
    </div>
  );
}
