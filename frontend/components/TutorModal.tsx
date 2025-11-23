"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  contentId: string | null;
  fallbackText: string;
};

export default function TutorModal({ 
  open, 
  onClose, 
  question, 
  userAnswer, 
  correctAnswer,
  contentId, 
  fallbackText 
}: Props) {
  const [explanation, setExplanation] = useState(fallbackText);
  const [loading, setLoading] = useState(false);
  const [contextSnippets, setContextSnippets] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hints, setHints] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setShowAnswer(false);
      setHints([]);
      
      if (contentId) {
        setLoading(true);
        fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/ask-tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: "demo-user",
            content_id: contentId,
            question,
            user_answer: userAnswer,
            query: question,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            setExplanation(data.explanation || fallbackText);
            setContextSnippets(data.context_snippets || []);
            
            // Generate hints from explanation
            const explanationText = data.explanation || fallbackText;
            const sentences = explanationText.split('. ').filter((s: string) => s.length > 20);
            const generatedHints = [
              sentences[0] ? `💡 Hint 1: ${sentences[0]}.` : "Think about the key concepts in the question.",
              sentences[1] ? `💡 Hint 2: ${sentences[1]}.` : "Consider what the correct answer relates to.",
              "💡 Hint 3: Review the topic material if you're still unsure."
            ];
            setHints(generatedHints);
            setLoading(false);
          })
          .catch(() => {
            setExplanation(fallbackText);
            setHints([
              "💡 Hint 1: Think about the key concepts in the question.",
              "💡 Hint 2: Review the topic material carefully.",
              "💡 Hint 3: Consider all the options before deciding."
            ]);
            setLoading(false);
          });
      } else {
        setExplanation(fallbackText);
        setHints([
          "💡 Hint 1: Think about the key concepts in the question.",
          "💡 Hint 2: Review the topic material carefully.",
          "💡 Hint 3: Consider all the options before deciding."
        ]);
      }
    }
  }, [open, contentId, question, userAnswer, fallbackText]);

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl max-w-5xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-5xl">🧙‍♂️</span>
          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
            Sage's Wisdom
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-bounce">📚</div>
            <p className="text-xl text-gray-200 animate-pulse">Consulting the ancient texts...</p>
          </div>
        ) : (
          <>
            {/* Your Answer */}
            {userAnswer && (
              <div className="bg-red-900/40 border-2 border-red-400/50 rounded-xl p-5 mb-6">
                <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Your Answer</p>
                <p className="text-xl font-semibold text-red-200">{userAnswer}</p>
              </div>
            )}

            {/* Hints Section */}
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-2 border-blue-400/60 rounded-2xl p-6 mb-6 shadow-lg">
              <h4 className="text-2xl font-bold text-blue-300 mb-5 flex items-center gap-2">
                💭 <span>Helpful Hints</span>
              </h4>
              <div className="space-y-4">
                {hints.map((hint, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-blue-900/40 rounded-xl p-5 border-l-4 border-blue-400 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {index === 0 ? "1️⃣" : index === 1 ? "2️⃣" : "3️⃣"}
                      </span>
                      <p className="text-gray-100 text-lg leading-relaxed">{hint.replace(/💡 Hint \d+: /, '')}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Show Answer Button */}
            {!showAnswer ? (
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-200"
                >
                  🔓 Show Correct Answer
                </button>
              </div>
            ) : (
              <>
                {/* Correct Answer */}
                <div className="bg-green-900/40 border-2 border-green-400/50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-300 mb-1">Correct Answer</p>
                  <p className="text-lg font-semibold text-green-200">{correctAnswer}</p>
                </div>

                {/* Explanation */}
                <div className="bg-purple-900/50 border-2 border-purple-400/30 rounded-2xl p-6 mb-6">
                  <h4 className="text-xl font-bold text-yellow-300 mb-3">📖 Detailed Explanation</h4>
                  <p className="text-lg text-gray-200 leading-relaxed">{explanation}</p>
                </div>
              </>
            )}

            {/* Context Sources */}
            {contextSnippets.length > 0 && (
              <details className="bg-purple-900/30 border-2 border-purple-400/20 rounded-xl p-4">
                <summary className="cursor-pointer text-lg font-semibold text-yellow-300 hover:text-yellow-200 transition-colors">
                  📚 View Context Sources ({contextSnippets.length})
                </summary>
                <ul className="mt-4 space-y-3">
                  {contextSnippets.map((snippet, i) => (
                    <li key={i} className="border-l-4 border-purple-400/50 pl-4 text-gray-300 bg-purple-900/20 p-3 rounded">
                      {snippet}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}

        {/* Action Button */}
        <div className="mt-8 text-center">
          <button 
            className="px-8 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 text-gray-900 text-xl font-bold rounded-xl shadow-lg hover:shadow-teal-400/50 hover:scale-105 transition-all duration-200" 
            onClick={onClose}
          >
            ⚔️ Continue Quest
          </button>
        </div>
      </div>
    </div>
  );
}
