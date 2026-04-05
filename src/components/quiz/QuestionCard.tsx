"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { Question, Confidence } from "@/types";
import { Button } from "@/components/ui/Button";
import { ExplainButton } from "@/components/quiz/ExplainButton";
import { renderWithAcronyms } from "@/lib/acronym-utils";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  globalMissRate?: number;
  onAnswer: (selectedIndex: number, confidence: Confidence) => void;
}

type AnswerState = "unanswered" | "selecting_confidence" | "revealed";

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  globalMissRate,
  onAnswer,
}: QuestionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [confidence, setConfidence] = useState<Confidence | null>(null);

  const correctIndex = question.options.findIndex((o) => o.isCorrect);
  const isCorrect = selectedIndex === correctIndex;

  function handleOptionClick(index: number) {
    if (answerState !== "unanswered") return;
    setSelectedIndex(index);
    setAnswerState("selecting_confidence");
  }

  function handleConfidenceSelect(c: Confidence) {
    setConfidence(c);
    setAnswerState("revealed");
    if (selectedIndex !== null) {
      onAnswer(selectedIndex, c);
    }
  }

  function getOptionStyle(index: number) {
    if (answerState === "unanswered") {
      return "border-gray-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer";
    }
    if (answerState === "selecting_confidence") {
      return index === selectedIndex
        ? "border-amber-500 bg-amber-50"
        : "border-gray-200 opacity-50";
    }
    // Revealed
    if (index === correctIndex) {
      return "border-green-500 bg-green-50";
    }
    if (index === selectedIndex && !isCorrect) {
      return "border-red-500 bg-red-50 answer-incorrect";
    }
    return "border-gray-200 opacity-40";
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Question header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        {globalMissRate !== undefined && globalMissRate > 0.5 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            <AlertTriangle size={12} />
            {Math.round(globalMissRate * 100)}% miss this
          </span>
        )}
      </div>

      {/* Question text */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">
          {renderWithAcronyms(question.text)}
        </h2>
        {question.imageUrl && (
          <div className="mt-3 flex justify-center">
            <img
              src={question.imageUrl}
              alt="Question image"
              className="max-h-48 rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>

      {/* Answer options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(index)}
            disabled={answerState !== "unanswered"}
            className={`
              w-full text-left p-4 rounded-xl border-2 transition-all duration-200
              ${getOptionStyle(index)}
            `}
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-gray-800 leading-relaxed">{renderWithAcronyms(option.text)}</span>
              {answerState === "revealed" && index === correctIndex && (
                <CheckCircle2 size={20} className="flex-shrink-0 text-green-500 ml-auto" />
              )}
              {answerState === "revealed" && index === selectedIndex && !isCorrect && (
                <XCircle size={20} className="flex-shrink-0 text-red-500 ml-auto" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Confidence selector */}
      <AnimatePresence>
        {answerState === "selecting_confidence" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            <p className="text-sm font-medium text-gray-600 mb-3 text-center">
              How confident are you?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleConfidenceSelect("guess")}
              >
                Total guess
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleConfidenceSelect("unsure")}
              >
                Not sure
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => handleConfidenceSelect("sure")}
              >
                Sure!
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer explanation */}
      <AnimatePresence>
        {answerState === "revealed" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              rounded-xl p-5 border-2 mt-4
              ${isCorrect
                ? "bg-green-50 border-green-200 answer-correct"
                : "bg-red-50 border-red-200"
              }
            `}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle2 size={24} className="text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold mb-1 ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                  {isCorrect ? "Correct!" : "Not quite"}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {renderWithAcronyms(
                    isCorrect
                      ? question.explanation
                      : selectedIndex !== null
                      ? question.options[selectedIndex].explanation || question.explanation
                      : question.explanation
                  )}
                </p>
                {question.utahCodeRef && (
                  <p className="text-xs text-gray-500 mt-2">
                    Utah Code {question.utahCodeRef}
                  </p>
                )}
                {question.mnemonic && !isCorrect && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Memory Trick</p>
                    <p className="text-sm text-amber-800">{question.mnemonic}</p>
                  </div>
                )}
                {!isCorrect && selectedIndex !== null && (
                  <ExplainButton
                    questionText={question.text}
                    correctAnswer={question.options[correctIndex].text}
                    selectedAnswer={question.options[selectedIndex].text}
                    explanation={question.explanation}
                    utahCodeRef={question.utahCodeRef}
                    categoryId={question.categoryId}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
