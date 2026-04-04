"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  AlertTriangle,
} from "lucide-react";
import type { Question } from "@/types";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

// ============================================
// Types
// ============================================

export interface ExamResult {
  answers: Record<string, string>;
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  passed: boolean;
  timeUsed: number;
  flaggedQuestions: string[];
}

export interface ExamSimulatorProps {
  questions: Question[];
  track: "written_knowledge" | "traffic_safety";
  timeLimit: number; // seconds
  passingScore: number; // 0-1
  onComplete: (results: ExamResult) => void;
  onExit: () => void;
}

// ============================================
// Helpers
// ============================================

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ============================================
// Component
// ============================================

export function ExamSimulator({
  questions,
  track,
  timeLimit,
  passingScore,
  onComplete,
  onExit,
}: ExamSimulatorProps) {
  // --- State ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [showNavGrid, setShowNavGrid] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  // --- Timer ---
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && !submitted) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  // --- Handlers ---
  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (submitted) return;
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: optionIndex,
      }));
    },
    [currentQuestion, submitted]
  );

  const handleToggleFlag = useCallback(() => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  }, [currentQuestion]);

  const handleNavigate = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) {
        setCurrentIndex(index);
        setShowNavGrid(false);
      }
    },
    [questions.length]
  );

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeUsed = Math.round((Date.now() - startTimeRef.current) / 1000);

    // Build answer text map and count correct
    const answerTexts: Record<string, string> = {};
    let correctCount = 0;

    for (const q of questions) {
      const selectedIdx = answers[q.id];
      if (selectedIdx !== undefined && q.options[selectedIdx]) {
        answerTexts[q.id] = q.options[selectedIdx].text;
        if (q.options[selectedIdx].isCorrect) {
          correctCount++;
        }
      } else {
        answerTexts[q.id] = "";
      }
    }

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const passed = correctCount / questions.length >= passingScore;

    onComplete({
      answers: answerTexts,
      correctCount,
      totalQuestions: questions.length,
      scorePercent,
      passed,
      timeUsed,
      flaggedQuestions: Array.from(flagged),
    });
  }, [submitted, answers, questions, passingScore, onComplete, flagged]);

  // --- Timer styling ---
  const timerWarning = timeRemaining < 300; // under 5 min
  const timerCritical = timeRemaining < 60; // under 1 min

  const timerClasses = timerCritical
    ? "text-red-600 font-bold animate-pulse"
    : timerWarning
    ? "text-red-500 font-semibold"
    : "text-slate-700 font-semibold";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ===== Header ===== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Exit */}
            <button
              onClick={() => setShowExitConfirm(true)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Exit exam"
            >
              <X size={22} />
            </button>

            {/* Timer */}
            <div className={`flex items-center gap-2 ${timerClasses}`}>
              <Clock size={18} />
              <span className="text-lg tabular-nums">{formatTime(timeRemaining)}</span>
            </div>

            {/* Progress count */}
            <span className="text-sm text-slate-500 font-medium">
              {answeredCount}/{questions.length}
            </span>
          </div>

          {/* Progress bar */}
          <ProgressBar
            value={answeredCount}
            max={questions.length}
            size="sm"
            color="blue"
            className="mt-2"
          />
        </div>
      </header>

      {/* ===== Question area ===== */}
      <div className="flex-1 flex items-start justify-center px-4 py-6 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-2xl"
          >
            {/* Question header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <button
                onClick={handleToggleFlag}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  flagged.has(currentQuestion.id)
                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent"
                }`}
              >
                <Flag size={14} />
                {flagged.has(currentQuestion.id) ? "Flagged" : "Flag"}
              </button>
            </div>

            {/* Question text */}
            <h2 className="text-lg font-semibold text-slate-900 leading-relaxed mb-6">
              {currentQuestion.text}
            </h2>

            {currentQuestion.imageUrl && (
              <div className="mb-6 flex justify-center">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question image"
                  className="max-h-48 rounded-lg border border-slate-200"
                />
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectOption(index)}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all duration-150
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-slate-800 leading-relaxed">
                        {option.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Prev/Next navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigate(currentIndex + 1)}
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                >
                  <Send size={14} className="mr-1.5" />
                  Submit Exam
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ===== Bottom navigation grid bar ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        {/* Toggle button */}
        <div className="bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
            <button
              onClick={() => setShowNavGrid((prev) => !prev)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showNavGrid ? "Hide" : "Show"} Questions
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-300 inline-block" /> Unanswered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500 inline-block" /> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Flagged
              </span>
            </div>

            {allAnswered && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              >
                <Send size={14} className="mr-1.5" />
                Submit
              </Button>
            )}
          </div>
        </div>

        {/* Grid panel */}
        <AnimatePresence>
          {showNavGrid && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-t border-slate-200 overflow-hidden"
            >
              <div className="max-w-3xl mx-auto px-4 py-4">
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {questions.map((q, i) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isFlagged = flagged.has(q.id);
                    const isCurrent = i === currentIndex;

                    let bgColor = "bg-slate-200 text-slate-600"; // unanswered
                    if (isFlagged) bgColor = "bg-amber-400 text-amber-900";
                    else if (isAnswered) bgColor = "bg-green-500 text-white";

                    return (
                      <button
                        key={q.id}
                        onClick={() => handleNavigate(i)}
                        className={`
                          w-full aspect-square rounded-lg text-xs font-bold
                          flex items-center justify-center transition-all
                          ${bgColor}
                          ${isCurrent ? "ring-2 ring-blue-500 ring-offset-1" : ""}
                        `}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== Exit confirmation modal ===== */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">Leave Exam?</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Your progress will be lost. Are you sure you want to exit?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Continue Exam
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  className="flex-1"
                  onClick={onExit}
                >
                  Exit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
