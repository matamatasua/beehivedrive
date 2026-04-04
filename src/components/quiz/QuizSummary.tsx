"use client";

import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp, RotateCcw, Home } from "lucide-react";
import type { GameState, QuizResult } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PASSING_SCORE_WRITTEN, PASSING_SCORE_TRAFFIC_SAFETY } from "@/lib/constants";

interface QuizSummaryProps {
  results: QuizResult[];
  gameState: GameState;
  track: "written_knowledge" | "traffic_safety";
  onClose: () => void;
}

export function QuizSummary({ results, gameState, track, onClose }: QuizSummaryProps) {
  const totalQuestions = results.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const scorePercent = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const totalXp = results.reduce((sum, r) => sum + r.xpEarned, 0);

  const passingScore =
    track === "traffic_safety" ? PASSING_SCORE_TRAFFIC_SAFETY : PASSING_SCORE_WRITTEN;
  const passed = scorePercent >= passingScore;

  // Find missed questions for review
  const missedQuestions = results.filter((r) => !r.isCorrect);

  // Find weak categories
  const categoryMisses: Record<string, { missed: number; total: number }> = {};
  for (const result of results) {
    const cat = result.question.categoryId;
    if (!categoryMisses[cat]) categoryMisses[cat] = { missed: 0, total: 0 };
    categoryMisses[cat].total++;
    if (!result.isCorrect) categoryMisses[cat].missed++;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Score circle */}
        <div className="text-center mb-8">
          <div
            className={`
              inline-flex items-center justify-center w-32 h-32 rounded-full border-4
              ${passed ? "border-green-500 bg-green-50" : "border-amber-500 bg-amber-50"}
            `}
          >
            <div>
              <p
                className={`text-3xl font-bold ${
                  passed ? "text-green-700" : "text-amber-700"
                }`}
              >
                {Math.round(scorePercent * 100)}%
              </p>
              <p className="text-xs text-gray-500">
                {correctCount}/{totalQuestions}
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-4">
            {passed
              ? gameState.lives === gameState.maxLives
                ? "Perfect Session!"
                : "You Passed!"
              : gameState.lives <= 0
              ? "Out of Lives"
              : "Almost There!"}
          </h2>
          <p className="text-gray-500 mt-1">
            {passed
              ? "Keep this up and you'll crush the real test."
              : `You need ${Math.round(passingScore * 100)}% to pass. Review the topics below and try again!`}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardBody className="text-center py-3">
              <Trophy size={20} className="mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-gray-900">+{totalXp}</p>
              <p className="text-xs text-gray-500">XP earned</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-3">
              <Target size={20} className="mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold text-gray-900">{correctCount}</p>
              <p className="text-xs text-gray-500">Correct</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-3">
              <TrendingUp size={20} className="mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold text-gray-900">
                {results.filter((r) => r.confidence === "sure" && r.isCorrect).length}
              </p>
              <p className="text-xs text-gray-500">Confident</p>
            </CardBody>
          </Card>
        </div>

        {/* Missed questions */}
        {missedQuestions.length > 0 && (
          <Card className="mb-6">
            <CardBody>
              <h3 className="font-semibold text-gray-900 mb-3">
                Review These ({missedQuestions.length})
              </h3>
              <div className="space-y-3">
                {missedQuestions.slice(0, 5).map((result, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-gray-800 font-medium line-clamp-2">
                      {result.question.text}
                    </p>
                    <p className="text-green-600 mt-0.5">
                      Correct: {result.question.options.find((o) => o.isCorrect)?.text}
                    </p>
                  </div>
                ))}
                {missedQuestions.length > 5 && (
                  <p className="text-xs text-gray-400">
                    +{missedQuestions.length - 5} more to review
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {!passed && (
            <Button variant="primary" size="lg" className="w-full">
              <RotateCcw size={18} className="mr-2" />
              Practice Weak Areas
            </Button>
          )}
          <Button variant={passed ? "primary" : "outline"} size="lg" className="w-full" onClick={onClose}>
            <Home size={18} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
