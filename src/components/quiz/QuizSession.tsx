"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Question, Confidence, GameState, QuizResult } from "@/types";
import { QuestionCard } from "./QuestionCard";
import { QuizHeader } from "./QuizHeader";
import { QuizSummary } from "./QuizSummary";
import { Button } from "@/components/ui/Button";
import { MAX_LIVES } from "@/lib/constants";
import { calculateXp, getNextBox } from "@/lib/learning/leitner";
import type { LeitnerBox } from "@/types";

interface QuizSessionProps {
  questions: Question[];
  sessionType: GameState["sessionType"];
  track: "written_knowledge" | "traffic_safety";
  userXp?: number;
  onComplete: (results: QuizResult[]) => void;
  onExit: () => void;
  questionBoxes?: Record<string, LeitnerBox>;
}

export function QuizSession({
  questions,
  sessionType,
  track,
  userXp = 0,
  onComplete,
  onExit,
  questionBoxes = {},
}: QuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    lives: MAX_LIVES,
    maxLives: MAX_LIVES,
    currentXp: userXp,
    comboCount: 0,
    comboMultiplier: 1,
    questionsAnswered: 0,
    questionsCorrect: 0,
    sessionType,
  });
  const [showNextButton, setShowNextButton] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback(
    (selectedIndex: number, confidence: Confidence) => {
      if (!currentQuestion) return;

      const isCorrect = currentQuestion.options[selectedIndex]?.isCorrect ?? false;
      const currentBox = questionBoxes[currentQuestion.id] ?? 1;
      const newCombo = isCorrect ? gameState.comboCount + 1 : 0;

      const xpEarned = calculateXp(
        isCorrect,
        currentBox as LeitnerBox,
        newCombo,
        confidence
      );

      const result: QuizResult = {
        question: currentQuestion,
        selectedAnswer: currentQuestion.options[selectedIndex]?.text ?? "",
        isCorrect,
        confidence,
        timeSpentMs: 0,
        xpEarned,
      };

      setResults((prev) => [...prev, result]);

      const newLives = isCorrect ? gameState.lives : gameState.lives - 1;

      setGameState((prev) => ({
        ...prev,
        lives: newLives,
        currentXp: prev.currentXp + xpEarned,
        comboCount: newCombo,
        comboMultiplier: newCombo >= 5 ? 2 : newCombo >= 3 ? 1.5 : 1,
        questionsAnswered: prev.questionsAnswered + 1,
        questionsCorrect: prev.questionsCorrect + (isCorrect ? 1 : 0),
      }));

      // Show next button after a short delay for reading the explanation
      setTimeout(() => setShowNextButton(true), 800);

      // Check if session is over (out of lives or last question)
      if (newLives <= 0) {
        setTimeout(() => setIsFinished(true), 1500);
      }
    },
    [currentQuestion, gameState.comboCount, gameState.lives, questionBoxes]
  );

  const handleNext = useCallback(() => {
    setShowNextButton(false);
    if (currentIndex + 1 >= questions.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  // Session finished — show summary
  if (isFinished) {
    return (
      <QuizSummary
        results={results}
        gameState={gameState}
        track={track}
        onClose={() => onComplete(results)}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Session header */}
      <QuizHeader
        gameState={gameState}
        currentQuestion={currentIndex + 1}
        totalQuestions={questions.length}
        onExit={onExit}
      />

      {/* Question area */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              globalMissRate={currentQuestion.globalMissRate}
              onAnswer={handleAnswer}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next button */}
      <AnimatePresence>
        {showNextButton && !isFinished && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-0 bg-white border-t border-gray-200 p-4"
          >
            <div className="max-w-2xl mx-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleNext}
              >
                {currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
