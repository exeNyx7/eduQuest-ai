"use client";
import { useState } from "react";
import LoadingQuest from "@/components/LoadingQuest";
import { useRouter } from "next/navigation";

export default function QuestPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
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
    if (!text.trim()) {
      setError("Please paste some notes first.");
      return;
    }
    setLoading(true);
    try {
      // Step 1: Upload content to get content_id
      const uploadResp = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "demo-user", text }),
      });
      if (!uploadResp.ok) throw new Error("Upload failed: " + uploadResp.status);
      const uploadData = await uploadResp.json();
      const contentId = uploadData.content_id;

      // Step 2: Generate quiz from the uploaded content
      const quizResp = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text_context: text }),
      });
      if (!quizResp.ok) throw new Error("Quiz generation failed: " + quizResp.status);
      const quizData = await quizResp.json();

      // Store quiz + content_id for Game Arena and Tutor
      sessionStorage.setItem("eduquest_quiz", JSON.stringify({ ...quizData, content_id: contentId }));
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
            Upload your study notes and let AI transform them into an epic challenge!
          </p>
          
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
          
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={submit}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xl font-bold rounded-xl shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-200"
            >
              🔥 Forge My Quest
            </button>
            <a href="/" className="text-gray-300 hover:text-yellow-300 underline transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
