"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { Question } from "@/types";
import type { ExamResult } from "./ExamSimulator";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

// ============================================
// Types
// ============================================

interface ExamResultsProps {
  result: ExamResult;
  questions: Question[];
  passingScore: number;
  timeLimit: number;
  onRetry: () => void;
  onDashboard: () => void;
}

// ============================================
// Helpers
// ============================================

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ============================================
// Component
// ============================================

export function ExamResults({
  result,
  questions,
  passingScore,
  timeLimit,
  onRetry,
  onDashboard,
}: ExamResultsProps) {
  const [showWrong, setShowWrong] = useState(true);

  // Find wrong answers
  const wrongAnswers = questions.filter((q) => {
    const userAnswer = result.answers[q.id];
    if (!userAnswer) return true; // unanswered counts as wrong
    return userAnswer !== q.correctAnswer;
  });

  const passThresholdCount = Math.ceil(result.totalQuestions * passingScore);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* ===== Pass/Fail banner ===== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`rounded-2xl p-8 text-center ${
            result.passed
              ? "bg-linear-to-br from-green-500 to-emerald-600"
              : "bg-linear-to-br from-red-500 to-rose-600"
          }`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {result.passed ? (
              <CheckCircle2 size={64} className="mx-auto text-white mb-4" />
            ) : (
              <XCircle size={64} className="mx-auto text-white mb-4" />
            )}
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {result.passed ? "You Passed!" : "Not Yet"}
          </h1>
          <p className="text-white/80 text-lg">
            {result.passed
              ? "Great job! You're ready for the real test."
              : "Keep studying and try again. You'll get there!"}
          </p>

          {/* Score circle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 inline-flex flex-col items-center justify-center w-28 h-28 rounded-full bg-white/20 backdrop-blur"
          >
            <span className="text-4xl font-bold text-white">
              {result.scorePercent}%
            </span>
            <span className="text-sm text-white/70">Score</span>
          </motion.div>
        </motion.div>

        {/* ===== Stats grid ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          {/* Score */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-blue-500" />
              <span className="text-sm font-medium text-slate-500">Score</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {result.correctCount}/{result.totalQuestions}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Need {passThresholdCount} to pass ({Math.round(passingScore * 100)}%)
            </p>
          </div>

          {/* Time */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-blue-500" />
              <span className="text-sm font-medium text-slate-500">Time Used</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatTime(result.timeUsed)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              of {formatTime(timeLimit)} allowed
            </p>
          </div>
        </motion.div>

        {/* Score bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-5"
        >
          <ProgressBar
            value={result.scorePercent}
            max={100}
            size="lg"
            color={result.passed ? "green" : "red"}
            showLabel
            label="Your Score"
          />
          <div className="mt-2 flex justify-end">
            <span className="text-xs text-slate-400">
              Passing: {Math.round(passingScore * 100)}%
            </span>
          </div>
        </motion.div>

        {/* ===== Wrong answers review ===== */}
        {wrongAnswers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setShowWrong((prev) => !prev)}
              className="flex items-center justify-between w-full mb-4"
            >
              <h2 className="text-lg font-bold text-slate-900">
                Review Wrong Answers ({wrongAnswers.length})
              </h2>
              {showWrong ? (
                <ChevronUp size={20} className="text-slate-400" />
              ) : (
                <ChevronDown size={20} className="text-slate-400" />
              )}
            </button>

            {showWrong && (
              <div className="space-y-4">
                {wrongAnswers.map((q, i) => {
                  const userAnswer = result.answers[q.id];
                  const correctOption = q.options.find((o) => o.isCorrect);

                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="bg-white rounded-xl border border-red-200 p-5"
                    >
                      <p className="text-sm font-semibold text-slate-900 mb-3">
                        {q.text}
                      </p>

                      {/* User's wrong answer */}
                      {userAnswer ? (
                        <div className="flex items-start gap-2 mb-2">
                          <XCircle
                            size={16}
                            className="text-red-500 mt-0.5 shrink-0"
                          />
                          <p className="text-sm text-red-700">
                            Your answer: {userAnswer}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 mb-2">
                          <XCircle
                            size={16}
                            className="text-red-500 mt-0.5 shrink-0"
                          />
                          <p className="text-sm text-red-700 italic">
                            Not answered
                          </p>
                        </div>
                      )}

                      {/* Correct answer */}
                      <div className="flex items-start gap-2 mb-3">
                        <CheckCircle2
                          size={16}
                          className="text-green-500 mt-0.5 shrink-0"
                        />
                        <p className="text-sm text-green-700">
                          Correct: {correctOption?.text ?? q.correctAnswer}
                        </p>
                      </div>

                      {/* Explanation */}
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-sm text-slate-600">{q.explanation}</p>
                        {q.utahCodeRef && (
                          <p className="text-xs text-slate-400 mt-1">
                            Utah Code {q.utahCodeRef}
                          </p>
                        )}
                      </div>

                      {/* Mnemonic */}
                      {q.mnemonic && (
                        <div className="mt-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <p className="text-xs font-semibold text-amber-700 mb-0.5">
                            Memory Trick
                          </p>
                          <p className="text-sm text-amber-800">{q.mnemonic}</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ===== Action buttons ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3 pb-8"
        >
          <Button
            variant="outline"
            size="lg"
            className="flex-1 border-blue-500 text-blue-700 hover:bg-blue-50"
            onClick={onRetry}
          >
            <RotateCcw size={18} className="mr-2" />
            Try Again
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={onDashboard}
          >
            <Home size={18} className="mr-2" />
            Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
