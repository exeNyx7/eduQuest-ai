"use client";

import { useEffect, useMemo, useState } from "react";
import LoadingQuest from "@/components/LoadingQuest";
import TutorModal from "@/components/TutorModal";
import CompletionScreen from "@/components/CompletionScreen";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";

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
  const { user, updateStats } = useGame();
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
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorUserAnswer, setTutorUserAnswer] = useState("");
  const [tutorCorrectAnswer, setTutorCorrectAnswer] = useState("");
  const [tutorFallback, setTutorFallback] = useState("");
  const [contentId, setContentId] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("eduquest_quiz");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setQuiz(data.items || []);
        setTopic(data.topic || "Learning Quest");
        setBgUrl(buildUnsplashUrl(data.topic || "learning"));
        setContentId(data.content_id || null);
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

  const current = quiz[questionIndex];

  const cardAnim = useMemo(() => {
    if (feedback === "correct") return "animate-bounce-once";
    if (feedback === "wrong") return "animate-shake";
    return "";
  }, [feedback]);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const onChoose = (opt: string) => {
    if (!current) return;
    setSelected(opt);
    const isCorrect = opt === current.answer;
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      sounds.correct();
      setXp((x) => x + 10);
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

  const submitQuizResults = async () => {
    if (!user) {
      setShowCompletion(true);
      return;
    }

    try {
      const score = Math.round((correctCount / quiz.length) * 100);
      const perfectScore = correctCount === quiz.length;

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
        if (result.newRank !== user.rank) {
          console.log(`[QUIZ] 🎉 Rank up! ${user.rank} → ${result.newRank}`);
          // TODO: Trigger rank-up animation
        }

        console.log(`[QUIZ] ✅ Earned ${result.xpEarned} XP! Total: ${result.newTotalXP}`);
      } else {
        console.error("[QUIZ] Failed to submit results:", response.status);
      }
    } catch (error) {
      console.error("[QUIZ] Error submitting results:", error);
    } finally {
      setShowCompletion(true);
    }
  };

  if (loading) return <LoadingQuest />;

  if (showCompletion) {
    return (
      <CompletionScreen
        xp={xp}
        correctCount={correctCount}
        wrongCount={wrongCount}
        totalQuestions={quiz.length}
        onRetry={() => {
          setQuestionIndex(0);
          setXp(0);
          setCorrectCount(0);
          setWrongCount(0);
          setShowCompletion(false);
        }}
        onNewQuest={() => router.push("/quest")}
      />
    );
  }

  return (
    <main
      className="min-h-screen p-6 md:p-10"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="backdrop-blur-md bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-purple-800/80 min-h-[75vh] rounded-3xl p-6 md:p-10 shadow-2xl border-4 border-yellow-400/30">
        {/* XP & Progress Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-purple-800/60 backdrop-blur-sm border-2 border-yellow-400/50 rounded-xl px-6 py-3 shadow-lg">
            <div className="text-sm text-gray-300">XP Earned</div>
            <div className="text-3xl font-bold text-yellow-400">{xp}</div>
          </div>
          <div className="bg-purple-800/60 backdrop-blur-sm border-2 border-purple-400/50 rounded-xl px-6 py-3 shadow-lg">
            <div className="text-sm text-gray-300">Progress</div>
            <div className="text-2xl font-bold text-pink-300">{questionIndex + 1} / {quiz.length}</div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className={`bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-8 md:p-10 shadow-2xl ${cardAnim}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🛡️</span>
                <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                  Battle Arena
                </h1>
              </div>
              <div className="bg-purple-900/60 px-4 py-2 rounded-xl border-2 border-purple-400/40">
                <span className="text-sm text-gray-300">Topic: </span>
                <span className="text-lg font-bold text-yellow-300">{topic}</span>
              </div>
            </div>

            {/* Question */}
            {current && (
              <div>
                <div className="bg-purple-900/50 rounded-2xl p-6 mb-6 border-2 border-purple-400/30">
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
                    {current.question}
                  </h2>
                </div>

                {/* Options */}
                <div className="grid gap-4">
                  {current.options.map((opt, idx) => (
                    <button
                      key={opt}
                      onClick={() => onChoose(opt)}
                      className={`
                        relative p-6 text-left text-xl font-semibold rounded-xl
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
    </main>
  );
}
