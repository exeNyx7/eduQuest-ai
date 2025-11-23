"use client";
import { useState } from "react";
import LoadingQuest from "@/components/LoadingQuest";
import { useRouter } from "next/navigation";

export default function QuestPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(10); // minutes
  const router = useRouter();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setText(ev.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      setError("Please drop a .txt file");
    }
  };

  const submit = async () => {
    setError(null);
    if (!text.trim() && !topicName.trim()) {
      setError("Please provide study notes OR enter a topic name.");
      return;
    }
    setLoading(true);
    try {
      // Determine the content to use
      const contentText = text.trim() || `Generate a ${difficulty} quiz about ${topicName}`;
      
      // Step 1: Upload content to get content_id
      const uploadResp = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "demo-user", text: contentText }),
      });
      if (!uploadResp.ok) throw new Error("Upload failed: " + uploadResp.status);
      const uploadData = await uploadResp.json();
      const contentId = uploadData.content_id;

      // Step 2: Generate quiz with custom parameters
      const quizResp = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text_context: contentText,
          num_questions: numQuestions,
          difficulty: difficulty
        }),
      });
      if (!quizResp.ok) throw new Error("Quiz generation failed: " + quizResp.status);
      const quizData = await quizResp.json();

      // Store quiz + content_id + topic + timer settings for Game Arena and Tutor
      const finalTopic = topicName.trim() || "Learning Quest";
      sessionStorage.setItem("eduquest_quiz", JSON.stringify({ 
        ...quizData, 
        content_id: contentId,
        topic: finalTopic,
        timerEnabled,
        timerDuration: timerEnabled ? timerDuration * 60 : null, // Convert to seconds
      }));
      router.push("/game");
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  if (loading) return <LoadingQuest />;

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-3xl w-full">
        <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-5xl">📜</span>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
              Prepare Your Quest
            </h1>
          </div>
          
          <p className="text-gray-200 mb-4 text-lg">
            Upload your study notes OR enter a topic name to generate a quiz!
          </p>

          {/* Quiz Customization Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Topic Name Input */}
            <div className="bg-purple-900/40 backdrop-blur-sm border-2 border-purple-400/50 rounded-xl p-4">
              <label className="text-sm text-gray-300 mb-2 block">📚 Topic Name</label>
              <input
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g., World War II"
                className="w-full px-4 py-2 rounded-lg bg-white/95 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Number of Questions */}
            <div className="bg-purple-900/40 backdrop-blur-sm border-2 border-purple-400/50 rounded-xl p-4">
              <label className="text-sm text-gray-300 mb-2 block">🎯 Questions</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg bg-white/95 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            {/* Difficulty Level */}
            <div className="bg-purple-900/40 backdrop-blur-sm border-2 border-purple-400/50 rounded-xl p-4">
              <label className="text-sm text-gray-300 mb-2 block">⚡ Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="w-full px-4 py-2 rounded-lg bg-white/95 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="easy">🌱 Easy</option>
                <option value="medium">⚔️ Medium</option>
                <option value="hard">🔥 Hard</option>
              </select>
            </div>
          </div>

          {/* Timer Settings */}
          <div className="bg-purple-900/40 backdrop-blur-sm border-2 border-purple-400/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-300 font-semibold">⏱️ Quiz Timer</label>
              <button
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timerEnabled
                    ? "bg-green-500 text-white"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                {timerEnabled ? "✓ Enabled" : "Disabled"}
              </button>
            </div>
            {timerEnabled && (
              <div className="mt-3">
                <label className="text-xs text-gray-400 mb-2 block">Time Limit (minutes)</label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-white text-2xl font-bold mt-2">
                  {timerDuration} {timerDuration === 1 ? "minute" : "minutes"}
                </div>
                <p className="text-xs text-yellow-300 mt-2 text-center">
                  ⚡ Faster completion = Bonus XP!
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-0.5 bg-purple-400/30"></div>
            <span className="text-gray-400 text-sm">OR paste your notes below</span>
            <div className="flex-1 h-0.5 bg-purple-400/30"></div>
          </div>
          
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`relative border-4 border-dashed rounded-2xl p-2 transition-all duration-300 ${
              dragOver 
                ? "border-yellow-400 bg-yellow-400/20 scale-105" 
                : "border-purple-400/40 bg-purple-900/20"
            }`}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="📝 Paste your study notes here, or drag & drop a .txt file...&#10;&#10;Example: 'Photosynthesis is the process by which plants convert light energy into chemical energy...'"
              className="w-full h-64 p-6 rounded-xl bg-white/95 text-gray-900 text-lg resize-none shadow-inner placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
            />
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border-2 border-red-400 rounded-xl">
              <p className="text-red-200 font-semibold">⚠️ {error}</p>
            </div>
          )}
          
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={submit}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xl font-bold rounded-xl shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-200"
            >
              🔥 Forge My Quest
            </button>
            <div className="flex gap-4 items-center">
              <a href="/" className="text-gray-300 hover:text-yellow-300 underline transition-colors text-sm">
                ← Home
              </a>
              <a href="/auth/signup" className="text-gray-300 hover:text-yellow-300 underline transition-colors text-sm">
                Sign Up to Save Progress
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
