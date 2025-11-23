"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import {
  Brain,
  BookOpen,
  Filter,
  Search,
  Trash2,
  Star,
  Tag,
} from "lucide-react";

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
  sessionId: string;
  sessionName: string;
  createdAt: string;
  tags?: string[];
  bookmarked?: boolean;
}

export default function AllFlashcardsPage() {
  const { user } = useGame();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkFilter, setBookmarkFilter] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchAllFlashcards();
    }
  }, [user]);

  useEffect(() => {
    filterCards();
  }, [flashcards, statusFilter, searchQuery, bookmarkFilter]);

  const fetchAllFlashcards = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/flashcards/all/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data.flashcards);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCards = () => {
    let filtered = [...flashcards];

    // Bookmark filter
    if (bookmarkFilter) {
      filtered = filtered.filter((card) => card.bookmarked);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((card) => card.status === statusFilter);
    }

    // Search filter (includes tags)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.front.toLowerCase().includes(query) ||
          card.back.toLowerCase().includes(query) ||
          card.sessionName?.toLowerCase().includes(query) ||
          card.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredCards(filtered);
  };

  const handleToggleBookmark = async (cardId: string) => {
    if (!user) return;

    try {
      const res = await fetch(`/api/flashcards/${cardId}/bookmark?user_id=${user.id}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setFlashcards(flashcards.map(c => 
          c.id === cardId ? { ...c, bookmarked: data.bookmarked } : c
        ));
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!user || !confirm("Delete this flashcard?")) return;

    try {
      const res = await fetch(`/api/flashcards/${cardId}?user_id=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFlashcards(flashcards.filter((c) => c.id !== cardId));
      }
    } catch (error) {
      console.error("Error deleting flashcard:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "learning":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
      case "reviewing":
        return "bg-blue-500/20 text-blue-300 border-blue-400/30";
      case "mastered":
        return "bg-green-500/20 text-green-300 border-green-400/30";
      default:
        return "bg-white/10 text-white border-white/20";
    }
  };

  if (!mounted || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">All Flashcards</h1>
                <p className="text-purple-200">{flashcards.length} total cards</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/flashcards")}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all"
            >
              ← Back
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
              <input
                type="text"
                placeholder="Search by content or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-400 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="learning">Learning</option>
                <option value="reviewing">Reviewing</option>
                <option value="mastered">Mastered</option>
              </select>
            </div>

            {/* Bookmark Filter */}
            <button
              onClick={() => setBookmarkFilter(!bookmarkFilter)}
              className={`px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                bookmarkFilter
                  ? "bg-yellow-500/20 border-2 border-yellow-400 text-yellow-300"
                  : "bg-white/5 border border-white/10 text-purple-200 hover:bg-white/10"
              }`}
            >
              <Star className={`w-5 h-5 ${bookmarkFilter ? "fill-yellow-300" : ""}`} />
              Bookmarked Only
            </button>
          </div>
        </motion.div>

        {/* Flashcards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="text-center py-12 text-purple-200">Loading...</div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-12 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
              <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-xl text-white font-bold mb-2">No flashcards found</p>
              <p className="text-purple-200 mb-6">
                {flashcards.length === 0
                  ? "Generate some flashcards to get started"
                  : "Try adjusting your filters"}
              </p>
              <button
                onClick={() => router.push("/flashcards")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg transition-all"
              >
                Generate Flashcards
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-purple-400/30 transition-all group"
                >
                  <div className="p-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(
                          card.status
                        )}`}
                      >
                        {card.status}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleBookmark(card.id)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            card.bookmarked
                              ? "bg-yellow-500/20 border-yellow-400/50 text-yellow-300"
                              : "bg-white/10 border-white/20 text-purple-300 opacity-0 group-hover:opacity-100"
                          }`}
                          title={card.bookmarked ? "Remove bookmark" : "Bookmark"}
                        >
                          <Star className={`w-4 h-4 ${card.bookmarked ? "fill-yellow-300" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1.5 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-purple-300 mb-1">
                        QUESTION
                      </p>
                      <p className="text-white font-medium line-clamp-3">
                        {card.front}
                      </p>
                    </div>

                    {/* Answer */}
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-green-300 mb-1">
                        ANSWER
                      </p>
                      <p className="text-white/80 text-sm line-clamp-3">
                        {card.back}
                      </p>
                    </div>

                    {/* Hint */}
                    {card.hint && (
                      <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-300 mb-1">
                          HINT
                        </p>
                        <p className="text-white/80 text-xs line-clamp-2">
                          {card.hint}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {card.tags && card.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {card.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-purple-300 pt-3 border-t border-white/10">
                      <span className="truncate">{card.sessionName}</span>
                      <span>
                        Next: {card.interval} day{card.interval !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
