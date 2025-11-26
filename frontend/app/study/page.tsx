"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  MessageSquare,
  Sparkles,
  BookOpen,
  Trash2,
  FileType,
  Clock,
  Brain,
  Zap,
  Send,
  Loader2,
  ScrollText,
  Eye,
} from "lucide-react";

interface Scroll {
  scroll_id: string;
  filename: string;
  file_type: string;
  topic: string | null;
  upload_date: string;
  content_id: string;
  chunks: number;
  preview: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function StudyPage() {
  const { user } = useGame();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Scrolls state
  const [scrolls, setScrolls] = useState<Scroll[]>([]);
  const [selectedScroll, setSelectedScroll] = useState<Scroll | null>(null);
  const [isLoadingScrolls, setIsLoadingScrolls] = useState(true);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadText, setUploadText] = useState("");
  const [uploadFilename, setUploadFilename] = useState("");
  const [uploadTopic, setUploadTopic] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"text" | "file">("file"); // Default to file mode

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  // Summary state
  const [summary, setSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Mode: 'chat' or 'summary'
  const [mode, setMode] = useState<"chat" | "summary">("chat");

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchScrolls();
    }
  }, [user]);

  const fetchScrolls = async () => {
    if (!user) return;
    setIsLoadingScrolls(true);
    try {
      console.log("[STUDY] Fetching scrolls for user:", user.id);
      console.log("[STUDY] User object:", JSON.stringify(user, null, 2));
      const res = await fetch(`/api/study/user/${user.id}`);
      console.log("[STUDY] Response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("[STUDY] Received data:", JSON.stringify(data, null, 2));
        console.log("[STUDY] Scrolls array:", data.scrolls);
        console.log("[STUDY] Scrolls count:", data.scrolls?.length || 0);
        
        if (data.scrolls && data.scrolls.length > 0) {
          console.log("[STUDY] ✅ Scrolls loaded successfully!");
          console.log("[STUDY] First scroll:", data.scrolls[0]);
        } else {
          console.warn("[STUDY] ⚠️ No scrolls in response!");
        }
        
        setScrolls(data.scrolls || []);
      } else {
        const errorData = await res.json();
        console.error("[STUDY] ❌ Failed to fetch scrolls:", errorData);
        setScrolls([]);
        alert(`Error: ${errorData.detail || 'Could not fetch your scrolls. The arcane energies are weak today.'}`);
      }
    } catch (error) {
      console.error("[STUDY] ❌ Exception fetching scrolls:", error);
      setScrolls([]);
      alert("A network error occurred while fetching your scrolls. Please check your connection.");
    } finally {
      setIsLoadingScrolls(false);
    }
  };

  const handleUploadScroll = async () => {
    if (!user) {
      alert("Please sign in first!");
      return;
    }

    // Validate based on upload mode
    if (uploadMode === "file" && !uploadFile) {
      alert("Please select a file to upload!");
      return;
    }
    
    if (uploadMode === "text" && (!uploadText.trim() || !uploadFilename.trim())) {
      alert("Please provide both content and filename!");
      return;
    }

    setIsUploading(true);
    try {
      let data;
      
      if (uploadMode === "file") {
        // File upload
        const formData = new FormData();
        formData.append("file", uploadFile!);
        formData.append("user_id", user.id);
        if (uploadTopic.trim()) {
          formData.append("topic", uploadTopic);
        }

        const res = await fetch("/api/study/upload-file", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to upload file");
        }

        data = await res.json();
      } else {
        // Text upload
        const res = await fetch("/api/study/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            text: uploadText,
            filename: uploadFilename,
            file_type: "text",
            topic: uploadTopic || null,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to upload scroll");
        }

        data = await res.json();
      }

      console.log("[STUDY] Upload successful:", data);
      alert(data.message || "Scroll uploaded successfully!");

      // Clear form and refresh scrolls
      setUploadText("");
      setUploadFilename("");
      setUploadTopic("");
      setUploadFile(null);
      
      // Wait a bit for DB to update, then fetch
      console.log("[STUDY] Refreshing scrolls list...");
      setTimeout(async () => {
        await fetchScrolls();
      }, 500);
    } catch (error) {
      console.error("Error uploading scroll:", error);
      alert(error instanceof Error ? error.message : "Failed to upload scroll. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteScroll = async (scrollId: string) => {
    if (!user || !confirm("Remove this scroll from your library?")) return;

    try {
      const res = await fetch(`/api/study/files/${scrollId}?user_id=${user.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Scroll removed from library");
        if (selectedScroll?.scroll_id === scrollId) {
          setSelectedScroll(null);
          setChatMessages([]);
          setSummary("");
        }
        await fetchScrolls();
      } else {
        alert("Failed to delete scroll");
      }
    } catch (error) {
      console.error("Error deleting scroll:", error);
      alert("Error deleting scroll");
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedScroll || isChatting) return;

    const userMsg: ChatMessage = { role: "user", content: currentMessage };
    setChatMessages((prev) => [...prev, userMsg]);
    setCurrentMessage("");
    setIsChatting(true);

    try {
      const res = await fetch("/api/study/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: selectedScroll.content_id,
          user_query: currentMessage,
          chat_history: chatMessages.slice(-6), // Keep last 6 messages for context
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.response,
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Error chatting:", error);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleGenerateSummary = async (length: "short" | "medium" | "long" = "medium") => {
    if (!selectedScroll || isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    try {
      const res = await fetch("/api/study/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: selectedScroll.content_id,
          max_length: length,
        }),
      });

      if (!res.ok) {
        throw new Error("Summary generation failed");
      }

      const data = await res.json();
      setSummary(data.summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleForgeQuiz = async () => {
    if (!selectedScroll || !user) return;
    
    try {
      console.log('[STUDY] Generating quiz for scroll:', selectedScroll.filename);
      
      // Step 1: Fetch full text content
      const contentRes = await fetch(
        `/api/study/content/${selectedScroll.content_id}?user_id=${user.id}`
      );
      
      if (!contentRes.ok) {
        throw new Error('Failed to fetch scroll content');
      }
      
      const contentData = await contentRes.json();
      console.log('[STUDY] Retrieved content:', contentData.length, 'characters');
      
      // Step 2: Determine difficulty based on user stats and quiz history
      const quizHistoryKey = `quiz_history_${selectedScroll.content_id}`;
      const quizHistory = JSON.parse(localStorage.getItem(quizHistoryKey) || '[]');
      
      let difficulty = 'easy';
      let numQuestions = 10;
      
      if (quizHistory.length === 0) {
        // First attempt - start easy
        difficulty = 'easy';
        numQuestions = 10;
        console.log('[STUDY] First quiz attempt - starting with EASY');
      } else {
        // Calculate average score from history
        const avgScore = quizHistory.reduce((sum: number, h: any) => sum + h.score, 0) / quizHistory.length;
        const lastScore = quizHistory[quizHistory.length - 1].score;
        
        console.log('[STUDY] Quiz history:', {
          attempts: quizHistory.length,
          avgScore: avgScore.toFixed(1),
          lastScore
        });
        
        // Progressive difficulty based on performance
        if (avgScore >= 90 && lastScore >= 85) {
          difficulty = 'hard';
          numQuestions = 15;
          console.log('[STUDY] 🔥 Excellent performance! Generating HARD quiz with 15 questions');
        } else if (avgScore >= 70) {
          difficulty = 'medium';
          numQuestions = 12;
          console.log('[STUDY] 📈 Good progress! Generating MEDIUM quiz with 12 questions');
        } else {
          difficulty = 'easy';
          numQuestions = 10;
          console.log('[STUDY] 📚 Building foundation! Generating EASY quiz with 10 questions');
        }
      }
      
      // Step 3: Generate quiz with adaptive settings
      const quizRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/generate-quiz`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text_context: contentData.text,
            num_questions: numQuestions,
            difficulty: difficulty,
            // Add timestamp to ensure unique generation
            seed: Date.now()
          })
        }
      );
      
      if (!quizRes.ok) {
        throw new Error('Failed to generate quiz');
      }
      
      const quizData = await quizRes.json();
      console.log('[STUDY] ✅ Generated quiz:', {
        questions: quizData.items?.length || 0,
        difficulty,
        attempt: quizHistory.length + 1
      });
      
      // Store in sessionStorage for game page
      sessionStorage.setItem('eduquest_quiz', JSON.stringify({
        topic: contentData.topic || selectedScroll.filename,
        items: quizData.items,
        content_id: selectedScroll.content_id,
        timerEnabled: false,
        difficulty: difficulty,
        attempt: quizHistory.length + 1
      }));
      
      // Navigate to game page
      router.push('/game');
      
    } catch (error) {
      console.error('[STUDY] Quiz generation error:', error);
      alert('Failed to generate quiz. Please try again.');
    }
  };

  const handleCreateFlashcards = async () => {
    if (!selectedScroll || !user) return;
    
    try {
      console.log('[STUDY] Generating flashcards for scroll:', selectedScroll.filename);
      
      // Fetch full text content
      const contentRes = await fetch(
        `/api/study/content/${selectedScroll.content_id}?user_id=${user.id}`
      );
      
      if (!contentRes.ok) {
        throw new Error('Failed to fetch scroll content');
      }
      
      const contentData = await contentRes.json();
      console.log('[STUDY] Retrieved content:', contentData.length, 'characters');
      
      // Store in sessionStorage instead of URL to avoid length limits
      sessionStorage.setItem('flashcard_content', JSON.stringify({
        content: contentData.text,
        topic: contentData.topic || selectedScroll.filename,
        filename: selectedScroll.filename
      }));
      
      // Navigate to flashcards page
      router.push('/flashcards?from=scroll');
      
    } catch (error) {
      console.error('[STUDY] Flashcard prep error:', error);
      alert('Failed to prepare flashcards. Please try again.');
    }
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
                The Arcane Library
              </h1>
              <p className="text-purple-300">
                Your collection of mystical scrolls and ancient knowledge
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Scrolls Library */}
          <div className="lg:col-span-1 space-y-4">
            {/* Upload New Scroll */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ScrollText className="w-5 h-5" />
                Add New Scroll
              </h3>

              {/* Upload Mode Toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setUploadMode("file")}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                    uploadMode === "file"
                      ? "bg-purple-500/40 text-white border border-purple-400"
                      : "bg-white/5 text-purple-300 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  📄 Upload File
                </button>
                <button
                  onClick={() => setUploadMode("text")}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                    uploadMode === "text"
                      ? "bg-purple-500/40 text-white border border-purple-400"
                      : "bg-white/5 text-purple-300 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  ✍️ Paste Text
                </button>
              </div>

              <div className="space-y-3">
                {uploadMode === "file" ? (
                  <>
                    {/* File Upload Mode */}
                    <div className="space-y-2">
                      <label className="block">
                        <div className={`w-full px-3 py-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${
                          uploadFile 
                            ? "border-purple-400 bg-purple-500/20" 
                            : "border-white/20 bg-white/5 hover:border-purple-400 hover:bg-white/10"
                        }`}>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadFile(file);
                                // Auto-set filename if empty
                                if (!uploadFilename) {
                                  setUploadFilename(file.name);
                                }
                              }
                            }}
                            className="hidden"
                          />
                          {uploadFile ? (
                            <div className="flex items-center justify-center gap-2 text-white">
                              <FileText className="w-5 h-5" />
                              <span className="text-sm font-semibold">{uploadFile.name}</span>
                            </div>
                          ) : (
                            <div className="text-purple-300">
                              <Upload className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm font-semibold">Click to upload file</p>
                              <p className="text-xs mt-1">PDF, Word, PowerPoint, or Text</p>
                            </div>
                          )}
                        </div>
                      </label>
                      {uploadFile && (
                        <button
                          onClick={() => setUploadFile(null)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Clear file
                        </button>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Topic (optional)..."
                      value={uploadTopic}
                      onChange={(e) => setUploadTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                    />
                  </>
                ) : (
                  <>
                    {/* Text Upload Mode */}
                    <input
                      type="text"
                      placeholder="Scroll name..."
                      value={uploadFilename}
                      onChange={(e) => setUploadFilename(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                    />

                    <input
                      type="text"
                      placeholder="Topic (optional)..."
                      value={uploadTopic}
                      onChange={(e) => setUploadTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                    />

                    <textarea
                      placeholder="Paste your study material here..."
                      value={uploadText}
                      onChange={(e) => setUploadText(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 resize-none"
                    />
                  </>
                )}

                <button
                  onClick={handleUploadScroll}
                  disabled={
                    isUploading || 
                    (uploadMode === "file" && !uploadFile) ||
                    (uploadMode === "text" && (!uploadText.trim() || !uploadFilename.trim()))
                  }
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Inscribing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Add to Library
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Scrolls List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Your Scrolls</h3>
                <motion.button
                  onClick={fetchScrolls}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-purple-300 hover:text-white transition-all"
                  title="Refresh scrolls"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                </motion.button>
              </div>

              {isLoadingScrolls ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-purple-300 animate-spin" />
                </div>
              ) : scrolls.length === 0 ? (
                <p className="text-purple-300 text-center py-8">
                  No scrolls yet. Add your first one above!
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scrolls.map((scroll, index) => (
                    <motion.div
                      key={scroll.scroll_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${
                        selectedScroll?.scroll_id === scroll.scroll_id
                          ? "bg-gradient-to-r from-purple-500/40 to-pink-500/40 border-purple-400 shadow-lg shadow-purple-500/50"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-300/50"
                      }`}
                      onClick={() => {
                        setSelectedScroll(scroll);
                        setChatMessages([]);
                        setSummary("");
                        setMode("chat");
                      }}
                    >
                      {selectedScroll?.scroll_id === scroll.scroll_id && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                        />
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate flex items-center gap-2">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            {scroll.filename}
                          </p>
                          {scroll.topic && (
                            <p className="text-xs text-purple-300 mt-1">{scroll.topic}</p>
                          )}
                          <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(scroll.upload_date).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteScroll(scroll.scroll_id);
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Main Area - Chat or Summary */}
          <div className="lg:col-span-3">
            {!selectedScroll ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-12 flex flex-col items-center justify-center min-h-[600px]"
              >
                <BookOpen className="w-24 h-24 text-purple-300 mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">
                  Select a Scroll to Begin
                </h2>
                <p className="text-purple-200 text-center max-w-md">
                  Choose a scroll from your library to consult the Oracle, generate summaries,
                  or create quizzes and flashcards.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden relative"
              >
                {/* Floating Book Animation */}
                <motion.div
                  className="absolute top-4 right-4 z-10"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [-5, 5, -5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <BookOpen className="w-12 h-12 text-purple-300/50" />
                </motion.div>
                
                {/* Magical Sparkles */}
                <motion.div
                  className="absolute top-8 right-8 z-10"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-400/70" />
                </motion.div>

                {/* Scroll Header */}
                <div className="bg-gradient-to-r from-purple-600/50 to-pink-600/50 p-6 border-b border-white/20 relative">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedScroll.filename}
                  </h2>
                  <p className="text-purple-200 text-sm mb-4">{selectedScroll.preview}</p>

                  {/* Mode Tabs */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode("chat")}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        mode === "chat"
                          ? "bg-white/20 text-white"
                          : "bg-white/5 text-purple-200 hover:bg-white/10"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Consult Oracle
                    </button>
                    <button
                      onClick={() => setMode("summary")}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        mode === "summary"
                          ? "bg-white/20 text-white"
                          : "bg-white/5 text-purple-200 hover:bg-white/10"
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      Quick Recap
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
                  {mode === "chat" ? (
                    <>
                      {/* Chat Messages */}
                      <div className="mb-4 h-96 overflow-y-auto space-y-4 p-4 bg-black/20 rounded-xl">
                        {chatMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-purple-300">
                            <Sparkles className="w-12 h-12 mb-3" />
                            <p className="text-center">
                              The Oracle awaits your questions about this scroll...
                            </p>
                          </div>
                        ) : (
                          <AnimatePresence>
                            {chatMessages.map((msg, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className={`flex ${
                                  msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : "text-left"}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    {msg.role === "assistant" && (
                                      <motion.div
                                        initial={{ rotate: 0 }}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                      >
                                        <Sparkles className="w-4 h-4 text-yellow-400" />
                                      </motion.div>
                                    )}
                                    <span className={`text-xs font-semibold ${
                                      msg.role === "user" 
                                        ? "text-purple-200" 
                                        : "text-yellow-200"
                                    }`}>
                                      {msg.role === "user" ? "✨ Your Speech" : "🔮 Oracle's Wisdom"}
                                    </span>
                                    {msg.role === "user" && (
                                      <MessageSquare className="w-4 h-4 text-purple-300" />
                                    )}
                                  </div>
                                  <div
                                    className={`p-3 rounded-2xl text-white ${
                                      msg.role === "user"
                                        ? "bg-purple-600"
                                        : "bg-black/30"
                                    }`}
                                  >
                                    <p>{msg.content}</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        )}
                        {isChatting && (
                          <div className="flex justify-start">
                            <div className="bg-white/10 text-purple-100 p-4 rounded-xl">
                              <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick Summary Button */}
                      <motion.button
                        onClick={() => setMode("summary")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 text-yellow-200 rounded-xl font-semibold hover:from-yellow-500/30 hover:to-orange-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-5 h-5" />
                        Quick Summary (Switch to Recap Mode)
                      </motion.button>

                      {/* Chat Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ask the Oracle anything about this scroll..."
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 transition-all focus:shadow-lg focus:shadow-purple-500/20"
                        />
                        <motion.button
                          onClick={handleSendMessage}
                          disabled={!currentMessage.trim() || isChatting}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/50"
                        >
                          <Send className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Summary Section */}
                      <div className="space-y-4">
                        {!summary ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12"
                          >
                            <motion.div
                              animate={{ 
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1.1, 1]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Eye className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                              Generate a Quick Recap
                            </h3>
                            <p className="text-purple-200 mb-6">
                              Get an AI-generated summary of this scroll in 3 key bullet points
                            </p>
                            <div className="flex gap-3 justify-center flex-wrap">
                              <motion.button
                                onClick={() => handleGenerateSummary("short")}
                                disabled={isGeneratingSummary}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                              >
                                📝 Short (2-3 sentences)
                              </motion.button>
                              <motion.button
                                onClick={() => handleGenerateSummary("medium")}
                                disabled={isGeneratingSummary}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/50 hover:shadow-xl"
                              >
                                {isGeneratingSummary ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating Magic...
                                  </span>
                                ) : (
                                  "✨ Medium (3 bullet points)"
                                )}
                              </motion.button>
                              <motion.button
                                onClick={() => handleGenerateSummary("long")}
                                disabled={isGeneratingSummary}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                              >
                                📖 Long (2-3 paragraphs)
                              </motion.button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-xl p-6 border border-purple-400/30 shadow-2xl shadow-purple-500/20 relative overflow-hidden"
                          >
                            {/* Magical shimmer effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                            />
                            
                            <div className="flex items-center justify-between mb-4 relative z-10">
                              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <motion.div
                                  animate={{ rotate: [0, 360] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                  <Sparkles className="w-5 h-5 text-yellow-400" />
                                </motion.div>
                                🔮 Oracle's Quick Recap
                              </h3>
                              <motion.button
                                onClick={() => setSummary("")}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-purple-300 hover:text-white text-sm px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                              >
                                Generate New ✨
                              </motion.button>
                            </div>
                            <div className="text-purple-100 whitespace-pre-wrap leading-relaxed relative z-10">
                              {summary.split('\n').map((line, idx) => (
                                <motion.p
                                  key={idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="mb-3"
                                >
                                  {line}
                                </motion.p>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <motion.div 
                    className="mt-6 pt-6 border-t border-white/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      Transform this Scroll
                    </h3>
                    <div className="flex gap-3 flex-wrap">
                      <motion.button
                        onClick={handleForgeQuiz}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 flex items-center gap-2 shadow-lg shadow-green-500/50 hover:shadow-xl transition-all"
                      >
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-5 h-5" />
                        </motion.div>
                        Forge Quiz
                      </motion.button>
                      <motion.button
                        onClick={handleCreateFlashcards}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 flex items-center gap-2 shadow-lg shadow-blue-500/50 hover:shadow-xl transition-all"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Brain className="w-5 h-5" />
                        </motion.div>
                        Create Flashcards
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
