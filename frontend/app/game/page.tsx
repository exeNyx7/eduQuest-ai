"use client";

import { useEffect, useMemo, useState } from "react";
import LoadingQuest from "@/components/LoadingQuest";
import TutorModal from "@/components/TutorModal";
import RoughWorkModal from "@/components/RoughWorkModal";
import AchievementToast from "@/components/AchievementToast";
import FloatingXP from "@/components/FloatingXP";
import ParticleBurst, { useXPMilestone } from "@/components/ParticleBurst";
import { updateQuestProgress } from "@/components/DailyQuestsWidget";
import { updateWeeklyQuestProgress } from "@/components/WeeklyQuestsWidget";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";

type QuizAnswer = {
  question: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
};

// Simple tones without external assets
function useSounds() {
  const play = (freq: number) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    o.start();
    o.stop(ctx.currentTime + 0.32);
  };
  return {
    correct: () => play(880),
    wrong: () => play(200),
  };
}

function buildUnsplashUrl(keyword: string) {
  const k = encodeURIComponent(keyword || "learning");
  return `https://source.unsplash.com/1600x900/?${k}`; // free, no API key
}

export default function GameArenaPage() {
  const sounds = useSounds();
  const router = useRouter();
  const { user, updateStats, setUser } = useGame();
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("Learning Quest");
  const [bgUrl, setBgUrl] = useState<string>(buildUnsplashUrl(topic));

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [quiz, setQuiz] = useState<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }[]>([]);

  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showTutor, setShowTutor] = useState(false);
  const [showRoughWork, setShowRoughWork] = useState(false);
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorUserAnswer, setTutorUserAnswer] = useState("");
  const [tutorCorrectAnswer, setTutorCorrectAnswer] = useState("");
  const [tutorFallback, setTutorFallback] = useState("");
  const [contentId, setContentId] = useState<string | null>(null);
  
  // Timer states
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [timerPaused, setTimerPaused] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(Date.now());

  useEffect(() => {
    const stored = sessionStorage.getItem("eduquest_quiz");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setQuiz(data.items || []);
        setTopic(data.topic || "Learning Quest");
        setBgUrl(buildUnsplashUrl(data.topic || "learning"));
        setContentId(data.content_id || null);
        
        // Set up timer if enabled
        if (data.timerEnabled && data.timerDuration) {
          setTimerEnabled(true);
          setTimeRemaining(data.timerDuration);
        }
        
        setQuizStartTime(Date.now());
      } catch {
        // fallback demo
        setQuiz([
          {
            question: "Fallback: Capital of France?",
            options: ["Berlin", "Madrid", "Paris", "Rome"],
            answer: "Paris",
            explanation: "Paris is the capital and most populous city of France.",
          },
        ]);
      }
    } else {
      // No data yet, redirect to quest page or use demo
      setQuiz([
        {
          question: "Demo: Capital of France?",
          options: ["Berlin", "Madrid", "Paris", "Rome"],
          answer: "Paris",
          explanation: "Paris is the capital and most populous city of France.",
        },
      ]);
    }
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);
  
  const [xp, setXp] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [currentXPGain, setCurrentXPGain] = useState(10);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  
  // XP milestone detection
  const { showBurst, milestone, resetBurst } = useXPMilestone(user?.stats.totalXP || 0);

  const current = quiz[questionIndex];

  const cardAnim = useMemo(() => {
    if (feedback === "correct") return "animate-bounce-once";
    if (feedback === "wrong") return "animate-shake";
    return "";
  }, [feedback]);
  
  // Timer countdown effect
  useEffect(() => {
    if (!timerEnabled || timerPaused || timeRemaining <= 0 || showCompletion) return;
    
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up! Auto-submit quiz
          setTimeout(() => submitQuizResults(), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerEnabled, timerPaused, timeRemaining, showCompletion]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing or modal is open
      if (showTutor || showRoughWork || showCompletion) return;
      
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      
      // W key for rough work
      if (e.key.toLowerCase() === "w") {
        e.preventDefault();
        setShowRoughWork(true);
      }
      
      // H key for hint
      if (e.key.toLowerCase() === "h" && !selected) {
        e.preventDefault();
        openHintModal();
      }
      
      // Number keys for options (1-4)
      if (["1", "2", "3", "4"].includes(e.key) && !selected && current) {
        const index = parseInt(e.key) - 1;
        if (current.options[index]) {
          e.preventDefault();
          onChoose(current.options[index]);
        }
      }
      
      // Space to pause/resume timer
      if (e.key === " " && timerEnabled) {
        e.preventDefault();
        setTimerPaused(!timerPaused);
      }
    };
    
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showTutor, showRoughWork, showCompletion, selected, current, timerEnabled, timerPaused]);

  const onChoose = (opt: string) => {
    if (!current || selected) return; // Prevent multiple selections
    setSelected(opt);
    const isCorrect = opt === current.answer;
    setFeedback(isCorrect ? "correct" : "wrong");
    
    // Track answer
    setQuizAnswers((prev) => [
      ...prev,
      {
        question: current.question,
        options: current.options,
        userAnswer: opt,
        correctAnswer: current.answer,
        explanation: current.explanation,
        isCorrect,
      },
    ]);
    
    if (isCorrect) {
      sounds.correct();
      
      // Calculate XP with bonuses (streak, perfect score, etc.)
      let xpGain = 10; // Base XP
      
      // Show floating XP animation
      setCurrentXPGain(xpGain);
      setShowXPAnimation(true);
      
      setXp((x) => x + xpGain);
      setCorrectCount((c) => c + 1);
    } else {
      sounds.wrong();
      setWrongCount((w) => w + 1);
    }
    if (!isCorrect) {
      setTutorQuestion(current.question);
      setTutorUserAnswer(opt);
      setTutorCorrectAnswer(current.answer);
      setTutorFallback(current.explanation);
      setShowTutor(true);
    }
    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      if (isCorrect && questionIndex < quiz.length - 1) {
        setQuestionIndex((i: number) => i + 1);
      } else if (questionIndex === quiz.length - 1) {
        // Quiz completed - submit to backend
        setTimeout(() => submitQuizResults(), 800);
      }
    }, 600);
  };

  const openHintModal = () => {
    if (!current) return;
    setTutorQuestion(current.question);
    setTutorUserAnswer(""); // No answer selected yet
    setTutorCorrectAnswer(current.answer);
    setTutorFallback(current.explanation);
    setShowTutor(true);
  };

  const submitQuizResults = async () => {
    if (!user) {
      setShowCompletion(true);
      return;
    }

    // Calculate time taken and bonus before try block
    const score = Math.round((correctCount / quiz.length) * 100);
    const perfectScore = correctCount === quiz.length;
    
    let timeBonus = 0;
    let timeTaken = 0;
    
    if (timerEnabled) {
      const quizDuration = parseInt(sessionStorage.getItem("eduquest_quiz") || "{}")
        ? JSON.parse(sessionStorage.getItem("eduquest_quiz") || "{}").timerDuration || 0
        : 0;
      timeTaken = Math.max(0, quizDuration - timeRemaining);
      
      // Time bonus: 0-50 XP based on speed
      // Faster = more bonus (if finished in less than 50% of time, max bonus)
      if (quizDuration > 0) {
        const timeUsedPercentage = timeTaken / quizDuration;
        if (timeUsedPercentage < 0.5) {
          timeBonus = 50; // Super fast!
        } else if (timeUsedPercentage < 0.7) {
          timeBonus = 30; // Fast
        } else if (timeUsedPercentage < 0.9) {
          timeBonus = 10; // Decent speed
        }
        console.log(`[QUIZ] ⏱️ Time bonus: +${timeBonus} XP (used ${Math.round(timeUsedPercentage * 100)}% of time)`);
      }
    } else {
      timeTaken = Math.round((Date.now() - quizStartTime) / 1000);
    }

    try {

      console.log("[QUIZ] Submitting results to backend...");
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/submit-quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            quizId: contentId || `quiz_${Date.now()}`,
            score,
            totalQuestions: quiz.length,
            correctAnswers: correctCount,
            wrongAnswers: wrongCount,
            perfectScore,
            timeBonus,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("[QUIZ] Backend response:", result);

        // Update local user stats
        updateStats({
          totalXP: result.newTotalXP,
          correctAnswers: user.stats.correctAnswers + correctCount,
          wrongAnswers: user.stats.wrongAnswers + wrongCount,
          questsCompleted: user.stats.questsCompleted + 1,
        });

        // Update user rank if changed
        if (result.rankedUp) {
          console.log(`[QUIZ] 🎉 Rank up! ${user.rank} → ${result.newRank}`);
          
          // Store rank-up data in localStorage to show on dashboard
          const rankUpData = {
            oldRank: user.rank,
            newRank: result.newRank,
            xpEarned: result.xpEarned,
            timestamp: Date.now(),
          };
          localStorage.setItem('eduquest_pending_rankup', JSON.stringify(rankUpData));
          
          // Update rank in user context properly
          const updatedUser = {
            ...user,
            rank: result.newRank,
            stats: { ...user.stats, totalXP: result.newTotalXP }
          };
          setUser(updatedUser);
        }

        // Show achievement notifications
        if (result.achievementsUnlocked && result.achievementsUnlocked.length > 0) {
          console.log(`[QUIZ] 🏆 Unlocked ${result.achievementsUnlocked.length} achievements!`);
          setNewAchievements(result.achievementsUnlocked);
          // Notify achievements panel to refresh
          window.dispatchEvent(new CustomEvent('achievementsUpdated'));
        }

        // Store streak milestone if reached
        if (result.streakMilestone) {
          console.log(`[QUIZ] 🔥 Streak milestone reached: ${result.streakMilestone.days} days!`);
          localStorage.setItem('eduquest_pending_milestone', JSON.stringify({
            milestone: result.streakMilestone,
            newMultiplier: result.streakMultiplier,
            timestamp: Date.now(),
          }));
        }

        console.log(`[QUIZ] ✅ Earned ${result.xpEarned} XP! Total: ${result.newTotalXP} (${result.streakMultiplier}x multiplier)`);
        
        // Track activity for heatmap
        const today = new Date().toISOString().split('T')[0];
        const activityKey = `activity_${user.id}`;
        const storedActivity = localStorage.getItem(activityKey);
        const activityMap = storedActivity ? JSON.parse(storedActivity) : {};
        activityMap[today] = (activityMap[today] || 0) + 1;
        localStorage.setItem(activityKey, JSON.stringify(activityMap));
        window.dispatchEvent(new CustomEvent('activityUpdated'));
        
        // Update daily quest progress
        const isPerfectScore = correctCount === quiz.length;
        updateQuestProgress(user.id, correctCount, quiz.length, isPerfectScore);
        console.log(`[QUIZ] 📅 Daily quest progress updated`);
        
        // Update weekly quest progress
        updateWeeklyQuestProgress(user.id, score, user.stats.currentStreak);
        console.log(`[QUIZ] 📆 Weekly quest progress updated`);
        
        // Store results in sessionStorage and redirect to results page
        const quizResults = {
          topic,
          totalQuestions: quiz.length,
          correctCount,
          wrongCount,
          xpEarned: result.xpEarned,
          answers: quizAnswers,
          timestamp: Date.now(),
          timeTaken: timerEnabled ? timeTaken : Math.round((Date.now() - quizStartTime) / 1000),
          timeBonus,
        };
        sessionStorage.setItem("eduquest_quiz_results", JSON.stringify(quizResults));
        
        // Short delay to show animations then redirect
        setTimeout(() => {
          router.push("/results");
        }, 1500);
      } else {
        console.error("[QUIZ] Failed to submit results:", response.status);
        // Still redirect to results page to show the quiz summary
        const quizResults = {
          topic,
          totalQuestions: quiz.length,
          correctCount,
          wrongCount,
          xpEarned: 0, // No XP if backend failed
          answers: quizAnswers,
          timestamp: Date.now(),
          timeTaken: timerEnabled ? timeTaken : Math.round((Date.now() - quizStartTime) / 1000),
          timeBonus,
        };
        sessionStorage.setItem("eduquest_quiz_results", JSON.stringify(quizResults));
        router.push("/results");
      }
    } catch (error) {
      console.error("[QUIZ] Error submitting results:", error);
      // Still redirect to results page to show the quiz summary
      const quizResults = {
        topic,
        totalQuestions: quiz.length,
        correctCount,
        wrongCount,
        xpEarned: 0, // No XP if error occurred
        answers: quizAnswers,
        timestamp: Date.now(),
        timeTaken: timerEnabled ? timeTaken : Math.round((Date.now() - quizStartTime) / 1000),
        timeBonus,
      };
      sessionStorage.setItem("eduquest_quiz_results", JSON.stringify(quizResults));
      router.push("/results");
    }
  };

  if (loading) return <LoadingQuest />;

  if (showCompletion) {
    // Fallback completion screen for guest users
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
        <div className="glass max-w-2xl w-full p-8 text-white text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-extrabold mb-2">Quest Complete!</h1>
          <p className="text-white/80 mb-6">Results saved! Redirecting...</p>
          <button
            onClick={() => router.push("/quest")}
            className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xl font-bold rounded-xl shadow-lg hover:scale-105 transition-all duration-200"
          >
            🔥 New Quest
          </button>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen p-4 md:p-6 flex items-center justify-center"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="backdrop-blur-md bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-purple-800/80 w-full max-w-5xl rounded-3xl p-6 md:p-8 shadow-2xl border-4 border-yellow-400/30">
        {/* XP, Progress Bar & Timer */}
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="bg-purple-800/60 backdrop-blur-sm border-2 border-yellow-400/50 rounded-xl px-4 py-2 shadow-lg">
            <div className="text-xs text-gray-300">XP Earned</div>
            <div className="text-2xl font-bold text-yellow-400">{xp}</div>
          </div>
          
          {timerEnabled && (
            <div className={`bg-purple-800/60 backdrop-blur-sm border-2 rounded-xl px-4 py-2 shadow-lg flex-1 max-w-xs ${
              timeRemaining <= 30 ? "border-red-400/70 animate-pulse" : "border-blue-400/50"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-300">Time Left</div>
                  <div className={`text-2xl font-bold ${
                    timeRemaining <= 30 ? "text-red-400" : "text-blue-400"
                  }`}>
                    {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
                  </div>
                </div>
                <button
                  onClick={() => setTimerPaused(!timerPaused)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    timerPaused
                      ? "bg-green-500 text-white hover:bg-green-400"
                      : "bg-orange-500 text-white hover:bg-orange-400"
                  }`}
                >
                  {timerPaused ? "▶️ Resume" : "⏸️ Pause"}
                </button>
              </div>
              {timeRemaining <= 30 && (
                <div className="text-xs text-red-300 mt-1 text-center font-semibold">
                  ⚠️ Hurry up!
                </div>
              )}
            </div>
          )}
          
          <div className="bg-purple-800/60 backdrop-blur-sm border-2 border-purple-400/50 rounded-xl px-4 py-2 shadow-lg">
            <div className="text-xs text-gray-300">Progress</div>
            <div className="text-xl font-bold text-pink-300">{questionIndex + 1} / {quiz.length}</div>
          </div>
        </div>

          <div className={`bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-6 md:p-8 shadow-2xl ${cardAnim}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🛡️</span>
                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                  Battle Arena
                </h1>
              </div>
              <div className="bg-purple-900/60 px-3 py-1 rounded-xl border-2 border-purple-400/40">
                <span className="text-xs text-gray-300">Topic: </span>
                <span className="text-sm font-bold text-yellow-300">{topic}</span>
              </div>
            </div>

            {/* Question */}
            {current && (
              <div>
                <div className="bg-purple-900/50 rounded-2xl p-4 mb-3 border-2 border-purple-400/30">
                  <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                    {current.question}
                  </h2>
                </div>

                {/* Action Buttons */}
                <div className="mb-4 flex justify-center gap-3">
                  <button
                    onClick={openHintModal}
                    disabled={!!selected}
                    className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold rounded-lg shadow-lg transition-all duration-200 ${
                      selected 
                        ? "opacity-50 cursor-not-allowed" 
                        : "hover:shadow-blue-400/50 hover:scale-105"
                    }`}
                  >
                    💡 Need a Hint?
                  </button>
                  <button
                    onClick={() => setShowRoughWork(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg shadow-lg hover:shadow-purple-400/50 hover:scale-105 transition-all duration-200"
                  >
                    📝 Rough Work
                  </button>
                </div>

                {/* Options */}
                <div className="grid gap-3">
                  {current.options.map((opt, idx) => (
                    <button
                      key={opt}
                      onClick={() => onChoose(opt)}
                      className={`
                        relative p-4 text-left text-lg font-semibold rounded-xl
                        transition-all duration-200 transform hover:scale-102
                        ${selected === opt
                          ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 shadow-lg shadow-yellow-400/50 scale-105"
                          : "bg-purple-800/40 text-white hover:bg-purple-700/60 border-2 border-purple-400/30"
                        }
                      `}
                    >
                      <span className="inline-block w-8 h-8 rounded-full bg-purple-900/50 text-center leading-8 mr-3 text-sm">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
      </div>

      <TutorModal 
        open={showTutor} 
        onClose={() => setShowTutor(false)} 
        question={tutorQuestion}
        userAnswer={tutorUserAnswer}
        correctAnswer={tutorCorrectAnswer}
        contentId={contentId}
        fallbackText={tutorFallback}
      />

      <AchievementToast
        achievements={newAchievements}
        onComplete={() => setNewAchievements([])}
      />

      <FloatingXP
        xp={currentXPGain}
        show={showXPAnimation}
        onComplete={() => setShowXPAnimation(false)}
      />

      <ParticleBurst
        show={showBurst}
        milestone={milestone}
        onComplete={resetBurst}
        particleCount={40}
      />

      <RoughWorkModal
        isOpen={showRoughWork}
        onClose={() => setShowRoughWork(false)}
      />
    </main>
  );
}
