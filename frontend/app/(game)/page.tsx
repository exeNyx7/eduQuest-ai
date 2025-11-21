"use client";

import { useEffect, useMemo, useState } from "react";
import LoadingQuest from "@/components/LoadingQuest";
import TutorModal from "@/components/TutorModal";

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
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("Learning Quest");
  const [bgUrl, setBgUrl] = useState<string>(buildUnsplashUrl(topic));

  const [questionIndex, setQuestionIndex] = useState(0);
  const [quiz, setQuiz] = useState<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }[]>([]);

  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showTutor, setShowTutor] = useState(false);
  const [tutorText, setTutorText] = useState("");

  useEffect(() => {
    // Simulate backend call to generate-quiz; integrate real API later
    const demoQuiz = [
      {
        question: "What is the capital of France?",
        options: ["Berlin", "Madrid", "Paris", "Rome"],
        answer: "Paris",
        explanation: "Paris is the capital and most populous city of France.",
      },
      {
        question: "Which gas do plants primarily absorb?",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        answer: "Carbon Dioxide",
        explanation: "Plants absorb CO2 during photosynthesis to produce glucose.",
      },
    ];
    setQuiz(demoQuiz);
    const kw = "general knowledge";
    setTopic(kw);
    setBgUrl(buildUnsplashUrl(kw));
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const current = quiz[questionIndex];

  const cardAnim = useMemo(() => {
    if (feedback === "correct") return "animate-bounce-once";
    if (feedback === "wrong") return "animate-shake";
    return "";
  }, [feedback]);

  const onChoose = (opt: string) => {
    if (!current) return;
    setSelected(opt);
    const isCorrect = opt === current.answer;
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) sounds.correct(); else sounds.wrong();
    if (!isCorrect) {
      setTutorText(current.explanation);
      setShowTutor(true);
    }
    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      if (isCorrect && questionIndex < quiz.length - 1) {
        setQuestionIndex((i) => i + 1);
      }
    }, 600);
  };

  if (loading) return <LoadingQuest />;

  return (
    <main
      className="min-h-screen p-6 md:p-10"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="backdrop-blur-sm bg-black/30 min-h-[60vh] rounded-2xl p-4 md:p-8 shadow-2xl">
        <div className="max-w-3xl mx-auto">
          <div className={`glass p-6 md:p-8 ${cardAnim}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow">Game Arena</h1>
              <span className="ml-auto text-sm text-white/80">Topic: {topic}</span>
            </div>

            {current && (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 drop-shadow">
                  {current.question}
                </h2>
                <div className="grid gap-3">
                  {current.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => onChoose(opt)}
                      className={`option ${
                        selected === opt
                          ? "ring-4 ring-quest.yellow"
                          : ""
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TutorModal open={showTutor} onClose={() => setShowTutor(false)} text={tutorText} />
    </main>
  );
}
