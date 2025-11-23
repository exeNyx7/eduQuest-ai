"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  Sparkles,
  Brain,
  BookOpen,
  Zap,
  Trash2,
  Plus,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  content: string;
  type: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: string;
  status: string;
  nextReview: string;
  interval: number;
  repetitions: number;
}

const MAX_FILES = 5;

export default function FlashcardsPage() {
  const { user } = useGame();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // File management
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [inputMode, setInputMode] = useState<"files" | "topic">("topic");

  // Generation options
  const [topicInput, setTopicInput] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [numCards, setNumCards] = useState(10);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([]);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    learning: 0,
    reviewing: 0,
    mastered: 0,
    dueToday: 0,
  });

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchStats();
      fetchSessions();
    }
  }, [user]);

  // Refresh stats when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchStats();
        fetchSessions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/flashcards/stats/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchSessions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/flashcards/sessions/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user || !confirm("Delete all flashcards in this session?")) return;
    
    try {
      const res = await fetch(`/api/flashcards/sessions/delete/${sessionId}?userId=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Deleted session:", data);
        await fetchStats();
        await fetchSessions();
        alert(`Successfully deleted ${data.deletedCount} flashcards!`);
      } else {
        alert("Failed to delete session. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Error deleting session. Please check console for details.");
    }
  };

  const handleFileUpload = async (uploadedFiles: FileList) => {
    const remainingSlots = MAX_FILES - files.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${MAX_FILES} files allowed!`);
      return;
    }

    const filesToAdd = Array.from(uploadedFiles).slice(0, remainingSlots);

    for (const file of filesToAdd) {
      // Accept text, markdown, PDF, and PPTX files
      const allowedTypes = [
        "text/plain",
        "text/markdown",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-powerpoint"
      ];
      const allowedExtensions = [".txt", ".md", ".pdf", ".pptx", ".ppt"];
      const isAllowed = allowedTypes.includes(file.type) || 
                       allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isAllowed) {
        alert(`File ${file.name} is not supported. Only .txt, .md, .pdf, .pptx, and .ppt files are supported.`);
        continue;
      }

      // For text files, read directly. For PDF/PPTX, we'll send as-is and backend will handle
      let content = "";
      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        content = await file.text();
      } else {
        // For PDF/PPTX, read as base64
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(`[BINARY:${file.name}:${base64}]`);
          };
          reader.readAsDataURL(file);
        });
      }
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        content: content,
        type: file.type,
      };

      setFiles((prev) => [...prev, newFile]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const generateFlashcards = async () => {
    if (!user) return;
    
    if (files.length === 0 && !topicInput.trim()) {
      alert("Please upload files or enter a topic!");
      return;
    }

    setIsGenerating(true);

    try {
      // Combine all file contents
      const combinedContent = files.map((f) => f.content).join("\n\n");

      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          content: combinedContent || undefined,
          topic: topicInput.trim() || undefined,
          numCards: numCards,
          difficulty: difficulty,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate flashcards");
      }

      const data = await res.json();
      setGeneratedCards(data.flashcards);

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Refresh stats and sessions
      fetchStats();
      fetchSessions();

      // Clear inputs
      setFiles([]);
      setTopicInput("");
    } catch (error) {
      console.error("Error generating flashcards:", error);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!mounted) return null;

  if (!user) {
    router.push("/signin");
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">AI Flashcards</h1>
                <p className="text-purple-200">Generate smart flashcards with spaced repetition</p>
              </div>
            </div>
            <button
              onClick={() => {
                fetchStats();
                fetchSessions();
              }}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-2"
              title="Refresh data"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20">
            <div className="text-2xl font-black text-white">{stats.total}</div>
            <div className="text-xs text-purple-200">Total</div>
          </div>
          <div className="bg-yellow-500/20 backdrop-blur-lg rounded-xl p-3 border border-yellow-400/30">
            <div className="text-2xl font-black text-yellow-400">{stats.learning}</div>
            <div className="text-xs text-yellow-200">Learning</div>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-3 border border-blue-400/30">
            <div className="text-2xl font-black text-blue-400">{stats.reviewing}</div>
            <div className="text-xs text-blue-200">Reviewing</div>
          </div>
          <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-3 border border-green-400/30">
            <div className="text-2xl font-black text-green-400">{stats.mastered}</div>
            <div className="text-xs text-green-200">Mastered</div>
          </div>
          <div className="bg-orange-500/20 backdrop-blur-lg rounded-xl p-3 border border-orange-400/30">
            <div className="text-2xl font-black text-orange-400">{stats.dueToday}</div>
            <div className="text-xs text-orange-200">Due Today</div>
          </div>
        </motion.div>

        {/* Session Management */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Sessions ({sessions.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/flashcards/history")}
                  className="text-xs px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-purple-300 hover:text-purple-100 hover:bg-white/20 transition-all"
                >
                  History
                </button>
                <button
                  onClick={() => router.push("/flashcards/all")}
                  className="text-xs px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-purple-300 hover:text-purple-100 hover:bg-white/20 transition-all"
                >
                  View All
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:border-purple-400/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-sm font-bold truncate">{session.name}</h3>
                      <p className="text-xs text-purple-200">{session.count} cards</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="p-1 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-purple-300">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => router.push(`/flashcards/review?sessionId=${session.id}`)}
                      className="text-xs px-2 py-1 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg transition-all"
                      title="Study this session"
                    >
                      Study
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Generation Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Tabs */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInputMode("topic")}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    inputMode === "topic"
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-white/10 text-purple-200 hover:bg-white/20"
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Topic
                </button>
                <button
                  onClick={() => setInputMode("files")}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    inputMode === "files"
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-white/10 text-purple-200 hover:bg-white/20"
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Files
                </button>
              </div>

              {/* Topic Input */}
              {inputMode === "topic" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter topic (e.g., Photosynthesis, World War II...)"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              )}

              {/* File Upload Area */}
              {inputMode === "files" && (
                <div className="space-y-3">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                      isDragging
                        ? "border-purple-400 bg-purple-500/20"
                        : "border-purple-400/50 bg-white/5"
                    }`}
                  >
                    <Upload className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                    <p className="text-white font-semibold text-sm mb-1">
                      Drag & drop files
                    </p>
                    <p className="text-purple-200 text-xs mb-3">
                      .txt, .md, .pdf, .pptx ({files.length}/{MAX_FILES})
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.pdf,.pptx,.ppt,text/*,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                      disabled={files.length >= MAX_FILES}
                    />
                    <label
                      htmlFor="file-upload"
                      className={`inline-block px-4 py-1.5 rounded-lg text-sm font-semibold cursor-pointer ${
                        files.length >= MAX_FILES
                          ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                          : "bg-purple-500 text-white hover:bg-purple-600"
                      }`}
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Browse
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* File List */}
            {inputMode === "files" && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Uploaded Files</h3>
              </div>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 space-y-2"
                  >
                    {files.map((file) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10"
                      >
                        <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{file.name}</p>
                          <p className="text-purple-200 text-xs">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </motion.div>
                    ))}
                </motion.div>
              )}
              </div>
            )}

            {/* Generation Options */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">Options</h2>
              </div>

              <div className="space-y-3">
                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                    Difficulty
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                          difficulty === level
                            ? "bg-purple-500 text-white shadow-lg"
                            : "bg-white/10 text-purple-200 hover:bg-white/20"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of Cards */}
                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                    Cards: {numCards}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={numCards}
                    onChange={(e) => setNumCards(parseInt(e.target.value))}
                    className="w-full h-1.5"
                  />
                  <div className="flex justify-between text-xs text-purple-300 mt-0.5">
                    <span>5</span>
                    <span>30</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <motion.button
              onClick={generateFlashcards}
              disabled={isGenerating || (files.length === 0 && !topicInput.trim())}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                isGenerating || (files.length === 0 && !topicInput.trim())
                  ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 hover:shadow-xl"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Flashcards
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Right: Preview/Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {generatedCards.length > 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">
                  ✨ {generatedCards.length} Cards Generated!
                </h2>
                <p className="text-purple-200 mb-4">
                  Your flashcards are ready for review. Start studying to master them!
                </p>
                <button
                  onClick={() => router.push("/flashcards/review")}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:shadow-lg transition-all"
                >
                  Start Review Session
                </button>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
                <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Ready to Create Flashcards?
                </h3>
                <p className="text-purple-200">
                  Upload your study materials or enter a topic to generate smart flashcards
                  with AI-powered spaced repetition.
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push("/flashcards/review")}
                disabled={stats.dueToday === 0}
                className="p-6 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                <Zap className="w-8 h-8 mx-auto mb-2" />
                Review Due
                <div className="text-2xl font-black">{stats.dueToday}</div>
              </button>

              <button
                onClick={() => router.push("/flashcards/all")}
                className="p-6 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold hover:shadow-lg transition-all"
              >
                <BookOpen className="w-8 h-8 mx-auto mb-2" />
                All Cards
                <div className="text-2xl font-black">{stats.total}</div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
