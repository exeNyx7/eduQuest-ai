"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";

const GOALS = [
  { id: "SAT", name: "SAT Warrior", icon: "📝", desc: "Conquer the SAT" },
  { id: "GRE", name: "GRE Champion", icon: "🎓", desc: "Master the GRE" },
  { id: "STEM", name: "STEM Scholar", icon: "🔬", desc: "Excel in Science & Tech" },
  { id: "General", name: "Knowledge Seeker", icon: "🌍", desc: "Learn Everything" },
];

const SUBJECTS = [
  { id: "math", name: "Mathematics", icon: "📐" },
  { id: "physics", name: "Physics", icon: "⚛️" },
  { id: "cs", name: "Computer Science", icon: "💻" },
  { id: "chemistry", name: "Chemistry", icon: "🧪" },
  { id: "biology", name: "Biology", icon: "🧬" },
  { id: "history", name: "History", icon: "📜" },
  { id: "literature", name: "Literature", icon: "📚" },
  { id: "languages", name: "Languages", icon: "🗣️" },
];

const POWER_LEVELS = [
  { id: "Novice", name: "Novice", desc: "Just starting out", color: "text-gray-400" },
  { id: "Apprentice", name: "Apprentice", desc: "Learning the basics", color: "text-green-400" },
  { id: "Adept", name: "Adept", desc: "Comfortable with concepts", color: "text-blue-400" },
  { id: "Expert", name: "Expert", desc: "Mastered the material", color: "text-purple-400" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateProfile } = useGame();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedPowerLevel, setSelectedPowerLevel] = useState<string>("Novice");

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Update user profile
    updateProfile({
      goal: selectedGoal || undefined,
      subjects: selectedSubjects,
      powerLevel: selectedPowerLevel,
    });
    
    // Redirect to dashboard
    router.push("/dashboard");
  };

  const toggleSubject = (subjectId: string) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  const canProceed = () => {
    if (step === 1) return true; // Welcome screen
    if (step === 2) return selectedGoal !== null;
    if (step === 3) return selectedSubjects.length > 0;
    if (step === 4) return true;
    return false;
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-4xl w-full">
        {/* Progress Indicator */}
        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-all ${
                s === step
                  ? "bg-yellow-400 w-24"
                  : s < step
                  ? "bg-green-400"
                  : "bg-purple-800/40"
              }`}
            />
          ))}
        </div>

        <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-4 border-yellow-400/50 rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center">
              <div className="text-8xl mb-6 animate-bounce">⚔️</div>
              <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Welcome, Adventurer!
              </h1>
              <p className="text-2xl text-gray-200 mb-8">
                Prepare to embark on an epic learning quest
              </p>
              <p className="text-lg text-gray-300 mb-8">
                Answer a few questions to customize your journey and unlock your full potential!
              </p>
            </div>
          )}

          {/* Step 2: Goal Selection */}
          {step === 2 && (
            <div>
              <h2 className="text-4xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Choose Your Battleground
              </h2>
              <p className="text-center text-gray-300 mb-8">What's your main learning goal?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`p-6 rounded-2xl text-left transition-all duration-200 ${
                      selectedGoal === goal.id
                        ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 scale-105 shadow-lg"
                        : "bg-purple-800/40 text-white hover:bg-purple-700/60 border-2 border-purple-400/30"
                    }`}
                  >
                    <div className="text-5xl mb-3">{goal.icon}</div>
                    <div className="text-2xl font-bold mb-1">{goal.name}</div>
                    <div className={`text-sm ${selectedGoal === goal.id ? "text-gray-800" : "text-gray-400"}`}>
                      {goal.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Subject Selection */}
          {step === 3 && (
            <div>
              <h2 className="text-4xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Select Your Arsenal
              </h2>
              <p className="text-center text-gray-300 mb-8">Choose subjects you want to master (select multiple)</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SUBJECTS.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`p-4 rounded-xl text-center transition-all duration-200 ${
                      selectedSubjects.includes(subject.id)
                        ? "bg-gradient-to-br from-green-400 to-teal-400 text-gray-900 scale-105 shadow-lg"
                        : "bg-purple-800/40 text-white hover:bg-purple-700/60 border-2 border-purple-400/30"
                    }`}
                  >
                    <div className="text-4xl mb-2">{subject.icon}</div>
                    <div className="text-sm font-semibold">{subject.name}</div>
                  </button>
                ))}
              </div>
              
              {selectedSubjects.length > 0 && (
                <div className="mt-6 text-center text-green-300">
                  ✓ {selectedSubjects.length} subject{selectedSubjects.length > 1 ? "s" : ""} selected
                </div>
              )}
            </div>
          )}

          {/* Step 4: Power Level */}
          {step === 4 && (
            <div>
              <h2 className="text-4xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Your Current Power Level
              </h2>
              <p className="text-center text-gray-300 mb-8">How would you rate your knowledge?</p>
              
              <div className="space-y-4">
                {POWER_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedPowerLevel(level.id)}
                    className={`w-full p-6 rounded-2xl text-left transition-all duration-200 flex items-center gap-4 ${
                      selectedPowerLevel === level.id
                        ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 scale-102 shadow-lg"
                        : "bg-purple-800/40 text-white hover:bg-purple-700/60 border-2 border-purple-400/30"
                    }`}
                  >
                    <div
                      className={`text-6xl ${
                        selectedPowerLevel === level.id ? "text-gray-900" : level.color
                      }`}
                    >
                      {level.id === "Novice" ? "🌱" : level.id === "Apprentice" ? "📖" : level.id === "Adept" ? "⚡" : "🔥"}
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold mb-1">{level.name}</div>
                      <div className={`text-sm ${selectedPowerLevel === level.id ? "text-gray-800" : "text-gray-400"}`}>
                        {level.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 flex justify-between items-center">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-purple-800/60 text-gray-200 rounded-xl border-2 border-purple-400/30 hover:bg-purple-700/80 transition-all"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                  canProceed()
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 hover:scale-105 shadow-lg"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-8 py-4 bg-gradient-to-r from-green-400 to-teal-400 text-gray-900 rounded-xl font-bold text-lg hover:scale-105 shadow-lg transition-all"
              >
                🎮 Enter the Arena!
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
