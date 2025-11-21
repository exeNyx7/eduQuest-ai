"use client";
import { useState, useCallback } from "react";

export type QuizItem = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type GameState = {
  contentId: string | null;
  userId: string;
  topic: string;
  quiz: QuizItem[];
  questionIndex: number;
  xp: number;
  correctCount: number;
  wrongCount: number;
};

export function useGame() {
  const [state, setState] = useState<GameState>({
    contentId: null,
    userId: "demo-user", // In production, get from auth
    topic: "Learning Quest",
    quiz: [],
    questionIndex: 0,
    xp: 0,
    correctCount: 0,
    wrongCount: 0,
  });

  const loadQuiz = useCallback((data: any) => {
    setState((prev) => ({
      ...prev,
      contentId: data.content_id || null,
      topic: data.topic || "Learning Quest",
      quiz: data.items || [],
      questionIndex: 0,
    }));
  }, []);

  const answerCorrect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      xp: prev.xp + 10,
      correctCount: prev.correctCount + 1,
    }));
  }, []);

  const answerWrong = useCallback(() => {
    setState((prev) => ({
      ...prev,
      wrongCount: prev.wrongCount + 1,
    }));
  }, []);

  const nextQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      questionIndex: Math.min(prev.questionIndex + 1, prev.quiz.length - 1),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      contentId: null,
      userId: "demo-user",
      topic: "Learning Quest",
      quiz: [],
      questionIndex: 0,
      xp: 0,
      correctCount: 0,
      wrongCount: 0,
    });
  }, []);

  return {
    state,
    loadQuiz,
    answerCorrect,
    answerWrong,
    nextQuestion,
    reset,
  };
}
