"use client";

import { motion } from "framer-motion";
import { Hash, Trophy, Target, RotateCcw, Home, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import type { GauntletResult } from "./NumbersGauntlet";

interface GauntletSummaryProps {
  results: GauntletResult[];
  sessionXp: number;
  onRetry: () => void;
  onDashboard: () => void;
}

export function GauntletSummary({
  results,
  sessionXp,
  onRetry,
  onDashboard,
}: GauntletSummaryProps) {
  const totalQuestions = results.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = scorePercent >= 80;

  const missedResults = results.filter((r) => !r.isCorrect);

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
              <Hash
                size={20}
                className={`mx-auto mb-1 ${passed ? "text-green-600" : "text-amber-600"}`}
              />
              <p
                className={`text-3xl font-bold ${
                  passed ? "text-green-700" : "text-amber-700"
                }`}
              >
                {scorePercent}%
              </p>
              <p className="text-xs text-gray-500">
                {correctCount}/{totalQuestions}
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-4">
            {scorePercent === 100
              ? "Numbers Ninja!"
              : passed
              ? "Solid Numbers Knowledge!"
              : "Keep Drilling!"}
          </h2>
          <p className="text-gray-500 mt-1">
            {scorePercent === 100
              ? "You've mastered every key number. The test has nothing on you."
              : passed
              ? "You know your numbers well. Review the ones below to lock them in."
              : "These numbers trip up most test-takers. Study the mnemonics and try again!"}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardBody className="text-center py-3">
              <Trophy size={20} className="mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-gray-900">+{sessionXp}</p>
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
        </div>

        {/* Missed numbers with mnemonics */}
        {missedResults.length > 0 && (
          <Card className="mb-6">
            <CardBody>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                Numbers to Review ({missedResults.length})
              </h3>
              <div className="space-y-4">
                {missedResults.map((result, i) => (
                  <div key={i} className="text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <p className="font-bold text-gray-900">{result.keyNumber.value}</p>
                      <span className="text-xs text-gray-400">
                        {result.challengeType === "value_from_rule"
                          ? "Number Q"
                          : result.challengeType === "rule_from_value"
                          ? "Rule Q"
                          : "Compare Q"}
                      </span>
                    </div>
                    <p className="text-gray-700">{result.keyNumber.rule}</p>
                    <p className="text-amber-600 mt-1 italic">{result.keyNumber.mnemonic}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Button variant="primary" size="lg" className="w-full" onClick={onRetry}>
            <RotateCcw size={18} className="mr-2" />
            Try Again
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={onDashboard}>
            <Home size={18} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
