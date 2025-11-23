"use client";

type Props = {
  xp: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  onRetry: () => void;
  onNewQuest: () => void;
};

export default function CompletionScreen({
  xp,
  correctCount,
  wrongCount,
  totalQuestions,
  onRetry,
  onNewQuest,
}: Props) {
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const grade = percentage >= 90 ? "S" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "D";
  const emoji = percentage >= 80 ? "🏆" : percentage >= 60 ? "⭐" : "📚";

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="glass max-w-2xl w-full p-8 text-white text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h1 className="text-4xl font-extrabold mb-2">Quest Complete!</h1>
        <p className="text-white/80 mb-6">You've conquered the challenge</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-900/60 backdrop-blur-sm border-2 border-purple-400/30 p-4 rounded-xl">
            <div className="text-3xl font-bold text-yellow-400">{xp}</div>
            <div className="text-sm text-gray-200">Total XP</div>
          </div>
          <div className="bg-purple-900/60 backdrop-blur-sm border-2 border-purple-400/30 p-4 rounded-xl">
            <div className="text-3xl font-bold text-green-400">{percentage}%</div>
            <div className="text-sm text-gray-200">Score</div>
          </div>
          <div className="bg-purple-900/60 backdrop-blur-sm border-2 border-purple-400/30 p-4 rounded-xl">
            <div className="text-2xl font-bold text-green-300">{correctCount}</div>
            <div className="text-sm text-gray-200">Correct</div>
          </div>
          <div className="bg-purple-900/60 backdrop-blur-sm border-2 border-purple-400/30 p-4 rounded-xl">
            <div className="text-2xl font-bold text-red-300">{wrongCount}</div>
            <div className="text-sm text-gray-200">Wrong</div>
          </div>
        </div>

        <div className="mb-6 p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg">
          <div className="text-5xl font-black text-white">{grade}</div>
          <div className="text-sm text-white">Performance Grade</div>
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={onNewQuest} className="button bg-quest.yellow text-black">
            🔥 New Quest
          </button>
          <a href="/dashboard" className="button bg-white/20">
            🏠 Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
