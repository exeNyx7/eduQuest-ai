"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  RotateCcw,
  Check,
  X,
  Zap,
  ThumbsDown,
  ThumbsUp,
  Award,
  Clock,
  Lightbulb,
} from "lucide-react";
import confetti from "canvas-confetti";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty: string;
  status: string;
  nextReview: string;
  interval: number;
  repetitions: number;
  tags?: string[];
  bookmarked?: boolean;
}

export default function FlashcardReviewPage() {
  const { user } = useGame();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  // Session stats
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchDueCards();
    }
  }, [user]);

  // Timer for session tracking
  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length) {
      const timer = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cards.length, currentIndex]);

  const fetchDueCards = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Check if there's a sessionId in the URL
      const searchParams = new URLSearchParams(window.location.search);
      const sessionId = searchParams.get('sessionId');
      
      let url = `/api/flashcards/due/${user.id}`;
      if (sessionId) {
        url = `/api/flashcards/session/${sessionId}/cards`;
        console.log('[REVIEW] Fetching session cards:', sessionId);
      } else {
        console.log('[REVIEW] Fetching due cards for user:', user.id);
      }
      
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        console.log('[REVIEW] ✅ Fetched cards:', data.flashcards?.length || 0);
        console.log('[REVIEW] First card FULL DATA:', JSON.stringify(data.flashcards?.[0], null, 2));
        
        // Validate cards have back field
        const cardsWithoutBack = data.flashcards.filter((c: any) => !c.back || c.back === '' || c.back === null || c.back === undefined);
        if (cardsWithoutBack.length > 0) {
          console.error('[REVIEW] ❌ CRITICAL: Cards missing back field:', cardsWithoutBack.length);
          console.error('[REVIEW] Sample card without back:', JSON.stringify(cardsWithoutBack[0], null, 2));
          alert(`⚠️ ${cardsWithoutBack.length} flashcards are missing answers! Please regenerate your flashcards.`);
        } else {
          console.log('[REVIEW] ✅ All cards have back field!');
          console.log('[REVIEW] Sample back content:', data.flashcards[0]?.back?.substring(0, 100));
        }
        
        setCards(data.flashcards);
      } else {
        console.error('[REVIEW] ❌ Failed to fetch cards:', res.status);
      }
    } catch (error) {
      console.error("Error fetching due cards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (rating: "again" | "hard" | "good" | "easy") => {
    if (isReviewing || !currentCard) return;

    console.log(`[FLASHCARDS] Reviewing card ${currentCard.id} with rating: ${rating}`);
    setIsReviewing(true);

    try {
      const res = await fetch(`/api/flashcards/${currentCard.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      console.log(`[FLASHCARDS] Review response status: ${res.status}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log(`[FLASHCARDS] Review response:`, data);
        
        // Update session stats
        setSessionStats((prev) => ({
          ...prev,
          [rating]: prev[rating] + 1,
        }));

        // Move to next card
        const nextIndex = currentIndex + 1;
        console.log(`[FLASHCARDS] Moving to card ${nextIndex}/${cards.length}`);
        
        if (nextIndex >= cards.length) {
          // Session complete!
          console.log(`[FLASHCARDS] Session complete!`);
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
          });
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            router.push("/flashcards");
          }, 3000);
        } else {
          setCurrentIndex(nextIndex);
          setIsFlipped(false);
          setShowHint(false);
        }
      } else {
        const errorData = await res.json();
        console.error(`[FLASHCARDS] Review failed:`, errorData);
      }
    } catch (error) {
      console.error("[FLASHCARDS] Error reviewing card:", error);
    } finally {
      setIsReviewing(false);
    }
  };

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const isComplete = currentIndex >= cards.length;

  if (!mounted) return null;

  if (!user) {
    router.push("/signin");
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">
                  {currentCard?.sessionName || "Review Session"}
                </h1>
                {!isComplete && (
                  <p className="text-purple-200">
                    Card {currentIndex + 1} of {cards.length}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              {!isComplete && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                  <Clock className="w-5 h-5 text-purple-300" />
                  <span className="text-white font-mono font-bold">
                    {Math.floor(sessionTime / 60)}:{String(sessionTime % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              
              <button
                onClick={() => router.push("/flashcards")}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {!isComplete && (
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
          )}
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold">Loading flashcards...</p>
          </div>
        ) : isComplete ? (
          /* Completion Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
              <Award className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
              <h2 className="text-4xl font-black text-white mb-2">
                🎉 Session Complete!
              </h2>
              <p className="text-xl text-purple-200 mb-2">
                You reviewed {cards.length} flashcards
              </p>
              <p className="text-lg text-purple-300 mb-8 flex items-center gap-2 justify-center">
                <Clock className="w-5 h-5" />
                Time: {Math.floor(sessionTime / 60)}:{String(sessionTime % 60).padStart(2, '0')}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-red-500/20 rounded-xl p-4 border border-red-400/30">
                  <X className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-white">{sessionStats.again}</div>
                  <div className="text-sm text-red-200">Again</div>
                </div>
                <div className="bg-orange-500/20 rounded-xl p-4 border border-orange-400/30">
                  <ThumbsDown className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-white">{sessionStats.hard}</div>
                  <div className="text-sm text-orange-200">Hard</div>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
                  <ThumbsUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-white">{sessionStats.good}</div>
                  <div className="text-sm text-blue-200">Good</div>
                </div>
                <div className="bg-green-500/20 rounded-xl p-4 border border-green-400/30">
                  <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-white">{sessionStats.easy}</div>
                  <div className="text-sm text-green-200">Easy</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push("/flashcards")}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg transition-all"
                >
                  Back to Flashcards
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-8 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        ) : cards.length === 0 ? (
          /* No Cards */
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20">
              <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Cards Due!</h2>
              <p className="text-purple-200 mb-6">
                Great job! You're all caught up. Come back later for more reviews.
              </p>
              <button
                onClick={() => router.push("/flashcards")}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg transition-all"
              >
                Back to Flashcards
              </button>
            </div>
          </div>
        ) : (
          /* Flashcard Display */
          <>
            <div className="relative perspective-1000 mb-8" style={{ minHeight: "400px" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCard.id}
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="cursor-pointer"
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, type: "spring" }}
                      className="relative w-full bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 min-h-[400px] flex items-center justify-center"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Front Side */}
                      <div
                        className={`absolute inset-0 p-12 flex flex-col items-center justify-center ${
                          isFlipped ? "invisible" : "visible"
                        }`}
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="text-sm font-semibold text-purple-300 mb-4">
                          QUESTION
                        </div>
                        <p className="text-3xl font-bold text-white text-center mb-8">
                          {currentCard.front}
                        </p>
                        <div className="text-sm text-purple-200">
                          Click to reveal answer
                        </div>
                      </div>

                      {/* Back Side */}
                      <div
                        className={`absolute inset-0 p-12 flex flex-col items-center justify-center ${
                          isFlipped ? "visible" : "invisible"
                        }`}
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)"
                        }}
                      >
                        <div className="text-sm font-semibold text-green-300 mb-4">
                          ANSWER
                        </div>
                        <p className="text-2xl font-semibold text-white text-center mb-4 whitespace-pre-wrap">
                          {currentCard.back || "[NO ANSWER - Please regenerate flashcards]"}
                        </p>
                        {!currentCard.back && (
                          <div className="text-red-400 text-sm mt-2">
                            ⚠️ This card is missing answer data
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full font-semibold ${
                              currentCard.difficulty === "easy"
                                ? "bg-green-500/20 text-green-300"
                                : currentCard.difficulty === "medium"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {currentCard.difficulty}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Hint Button & Display */}
            {!isFlipped && currentCard.hint && (
              <div className="text-center">
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/30 transition-all font-semibold flex items-center gap-2 mx-auto"
                  >
                    <Lightbulb className="w-5 h-5" />
                    Show Hint
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <Lightbulb className="w-5 h-5 text-yellow-300" />
                      <span className="text-sm font-semibold text-yellow-300">HINT</span>
                    </div>
                    <p className="text-white text-center">{currentCard.hint}</p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Rating Buttons */}
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                <button
                  onClick={() => handleReview("again")}
                  disabled={isReviewing}
                  className="p-4 rounded-xl bg-red-500/20 border-2 border-red-400/50 hover:bg-red-500/30 transition-all disabled:opacity-50"
                >
                  <X className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-white font-bold">Again</div>
                  <div className="text-xs text-red-200">{"< 1 day"}</div>
                </button>

                <button
                  onClick={() => handleReview("hard")}
                  disabled={isReviewing}
                  className="p-4 rounded-xl bg-orange-500/20 border-2 border-orange-400/50 hover:bg-orange-500/30 transition-all disabled:opacity-50"
                >
                  <ThumbsDown className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-white font-bold">Hard</div>
                  <div className="text-xs text-orange-200">{"< 3 days"}</div>
                </button>

                <button
                  onClick={() => handleReview("good")}
                  disabled={isReviewing}
                  className="p-4 rounded-xl bg-blue-500/20 border-2 border-blue-400/50 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                >
                  <ThumbsUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-white font-bold">Good</div>
                  <div className="text-xs text-blue-200">{"~1 week"}</div>
                </button>

                <button
                  onClick={() => handleReview("easy")}
                  disabled={isReviewing}
                  className="p-4 rounded-xl bg-green-500/20 border-2 border-green-400/50 hover:bg-green-500/30 transition-all disabled:opacity-50"
                >
                  <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-white font-bold">Easy</div>
                  <div className="text-xs text-green-200">{"> 2 weeks"}</div>
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
