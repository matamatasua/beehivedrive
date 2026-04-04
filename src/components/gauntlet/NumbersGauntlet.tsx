"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, ArrowLeft, Lightbulb } from "lucide-react";
import { KEY_NUMBERS, MAX_LIVES, COMBO_THRESHOLD, COMBO_SUPER_THRESHOLD } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LivesDisplay } from "@/components/game/LivesDisplay";
import { XpDisplay } from "@/components/game/XpDisplay";
import { ComboIndicator } from "@/components/game/ComboIndicator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChallengeType = "value_from_rule" | "rule_from_value" | "comparison";

export interface GauntletResult {
  keyNumber: (typeof KEY_NUMBERS)[number];
  challengeType: ChallengeType;
  isCorrect: boolean;
  timeSpentMs: number;
}

interface NumbersGauntletProps {
  onComplete: (results: GauntletResult[]) => void;
  onExit: () => void;
  userXp: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors<T>(
  pool: readonly T[],
  correct: T,
  count: number
): T[] {
  const others = pool.filter((x) => x !== correct);
  return shuffle([...others]).slice(0, count);
}

// Build the 14-question plan: ~7 A, ~4 B, ~3 C
function buildQuestionPlan(): { index: number; type: ChallengeType }[] {
  const indices = shuffle(Array.from({ length: KEY_NUMBERS.length }, (_, i) => i));
  // Assign types: first 7 = A, next 4 = B, last 3 = C
  const types: ChallengeType[] = [
    ...Array(7).fill("value_from_rule" as ChallengeType),
    ...Array(4).fill("rule_from_value" as ChallengeType),
    ...Array(3).fill("comparison" as ChallengeType),
  ];
  const shuffledTypes = shuffle(types);
  return indices.map((idx, i) => ({ index: idx, type: shuffledTypes[i] }));
}

// For comparison questions, pick a second item whose value differs
function pickComparisonPartner(primaryIndex: number): number {
  const candidates = KEY_NUMBERS.map((_, i) => i).filter((i) => i !== primaryIndex);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const XP_PER_CORRECT = 15;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NumbersGauntlet({ onComplete, onExit, userXp }: NumbersGauntletProps) {
  const [plan] = useState(() => buildQuestionPlan());
  const [questionIdx, setQuestionIdx] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [combo, setCombo] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [results, setResults] = useState<GauntletResult[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const questionStartRef = useRef(Date.now());

  // Comparison partner for type C questions (stable per question)
  const comparisonPartners = useMemo(
    () => plan.map((q) => (q.type === "comparison" ? pickComparisonPartner(q.index) : -1)),
    [plan]
  );

  const currentPlan = plan[questionIdx] as (typeof plan)[number] | undefined;
  const currentNumber = currentPlan ? KEY_NUMBERS[currentPlan.index] : null;
  const isGameOver = lives <= 0 || questionIdx >= plan.length;

  // Build options for current question
  const options = useMemo(() => {
    if (!currentPlan || !currentNumber) return [];

    if (currentPlan.type === "value_from_rule") {
      const distractors = pickDistractors(
        KEY_NUMBERS.map((k) => k.value),
        currentNumber.value,
        3
      );
      return shuffle([currentNumber.value, ...distractors]);
    }

    if (currentPlan.type === "rule_from_value") {
      const distractors = pickDistractors(
        KEY_NUMBERS.map((k) => k.rule),
        currentNumber.rule,
        3
      );
      return shuffle([currentNumber.rule, ...distractors]);
    }

    // comparison — two choices
    return ["A", "B"];
  }, [currentPlan, currentNumber]);

  const compPartner =
    currentPlan?.type === "comparison"
      ? KEY_NUMBERS[comparisonPartners[questionIdx]]
      : null;

  // Determine the correct answer for comparison
  const comparisonCorrect = useMemo(() => {
    if (currentPlan?.type !== "comparison" || !currentNumber || !compPartner) return "";
    // Parse numeric portion for comparison
    const parseNum = (v: string) => {
      const nums = v.match(/[\d.]+/g);
      if (!nums) return 0;
      return parseFloat(nums[nums.length - 1]);
    };
    const a = parseNum(currentNumber.value);
    const b = parseNum(compPartner.value);
    return a >= b ? "A" : "B";
  }, [currentPlan, currentNumber, compPartner]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (showFeedback || !currentPlan || !currentNumber) return;

      const timeSpent = Date.now() - questionStartRef.current;

      let correct = false;
      if (currentPlan.type === "value_from_rule") {
        correct = answer === currentNumber.value;
      } else if (currentPlan.type === "rule_from_value") {
        correct = answer === currentNumber.rule;
      } else {
        correct = answer === comparisonCorrect;
      }

      setSelected(answer);
      setIsCorrect(correct);
      setShowFeedback(true);

      const newCombo = correct ? combo + 1 : 0;
      setCombo(newCombo);

      if (correct) {
        const multiplier = newCombo >= COMBO_SUPER_THRESHOLD ? 2 : 1;
        const bonusXp = newCombo >= COMBO_THRESHOLD ? 5 : 0;
        const earned = XP_PER_CORRECT * multiplier + bonusXp;
        setSessionXp((prev) => prev + earned);
      } else {
        setLives((prev) => prev - 1);
      }

      const result: GauntletResult = {
        keyNumber: currentNumber,
        challengeType: currentPlan.type,
        isCorrect: correct,
        timeSpentMs: timeSpent,
      };

      setResults((prev) => [...prev, result]);
    },
    [showFeedback, currentPlan, currentNumber, combo, comparisonCorrect]
  );

  const handleNext = useCallback(() => {
    const newResults = results;
    const newLives = isCorrect ? lives : lives; // lives already updated

    if (lives <= (isCorrect ? 0 : 1) && !isCorrect) {
      // Game over after this
      onComplete(newResults);
      return;
    }

    if (questionIdx + 1 >= plan.length) {
      onComplete(newResults);
      return;
    }

    setQuestionIdx((prev) => prev + 1);
    setSelected(null);
    setShowFeedback(false);
    questionStartRef.current = Date.now();
  }, [results, lives, isCorrect, questionIdx, plan.length, onComplete]);

  // If game over, complete immediately
  if (isGameOver && !showFeedback) {
    onComplete(results);
    return null;
  }

  if (!currentNumber || !currentPlan) return null;

  // Determine correct answer text for feedback
  const correctAnswerText =
    currentPlan.type === "value_from_rule"
      ? currentNumber.value
      : currentPlan.type === "rule_from_value"
      ? currentNumber.rule
      : comparisonCorrect;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onExit}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Exit gauntlet"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Hash size={18} className="text-green-600" />
              <span className="font-bold text-gray-900">Numbers Gauntlet</span>
            </div>
            <div className="flex items-center gap-3">
              <LivesDisplay lives={lives} maxLives={MAX_LIVES} />
              <XpDisplay xp={userXp + sessionXp} sessionXp={sessionXp} />
            </div>
          </div>
          <ProgressBar
            value={questionIdx + 1}
            max={plan.length}
            size="sm"
            color="green"
            showLabel
            label={`Question ${questionIdx + 1} of ${plan.length}`}
          />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={questionIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* Combo indicator */}
            <div className="flex justify-center mb-4 h-8">
              <ComboIndicator combo={combo} />
            </div>

            {/* Question card */}
            <Card className="mb-6">
              <CardBody>
                {currentPlan.type === "value_from_rule" && (
                  <>
                    <p className="text-sm text-green-600 font-semibold mb-2 uppercase tracking-wide">
                      What&apos;s the number?
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {currentNumber.rule}?
                    </p>
                  </>
                )}

                {currentPlan.type === "rule_from_value" && (
                  <>
                    <p className="text-sm text-blue-600 font-semibold mb-2 uppercase tracking-wide">
                      What&apos;s the rule?
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {currentNumber.value}
                    </p>
                  </>
                )}

                {currentPlan.type === "comparison" && compPartner && (
                  <>
                    <p className="text-sm text-purple-600 font-semibold mb-2 uppercase tracking-wide">
                      Which number is greater?
                    </p>
                    <div className="space-y-2 mt-2">
                      <p className="text-base text-gray-900">
                        <span className="font-bold text-purple-700">A:</span>{" "}
                        {currentNumber.rule}
                      </p>
                      <p className="text-base text-gray-900">
                        <span className="font-bold text-purple-700">B:</span>{" "}
                        {compPartner.rule}
                      </p>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>

            {/* Answer options */}
            <div
              className={`grid gap-3 ${
                currentPlan.type === "comparison" ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {options.map((option) => {
                let btnClass = "";
                if (showFeedback) {
                  const isThisCorrect =
                    currentPlan.type === "value_from_rule"
                      ? option === currentNumber.value
                      : currentPlan.type === "rule_from_value"
                      ? option === currentNumber.rule
                      : option === comparisonCorrect;

                  if (isThisCorrect) {
                    btnClass = "border-green-500 bg-green-50 answer-correct";
                  } else if (option === selected && !isThisCorrect) {
                    btnClass = "border-red-500 bg-red-50 answer-incorrect";
                  } else {
                    btnClass = "opacity-50";
                  }
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={showFeedback}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                      ${
                        showFeedback
                          ? btnClass
                          : selected === option
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }
                      disabled:cursor-default
                      font-medium text-gray-900
                    `}
                  >
                    {currentPlan.type === "comparison" ? (
                      <span className="text-xl font-bold">{option}</span>
                    ) : (
                      option
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                {!isCorrect && (
                  <Card className="mb-4 border-amber-200 bg-amber-50">
                    <CardBody>
                      <div className="flex items-start gap-2">
                        <Lightbulb size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-amber-800 text-sm">
                            The answer is: {correctAnswerText}
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            {currentNumber.mnemonic}
                          </p>
                          {currentPlan.type === "comparison" && compPartner && (
                            <p className="text-xs text-amber-600 mt-1">
                              {currentNumber.rule}: {currentNumber.value} vs{" "}
                              {compPartner.rule}: {compPartner.value}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {isCorrect && (
                  <div className="text-center mb-4">
                    <p className="text-green-600 font-bold text-lg">Correct!</p>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleNext}
                >
                  {questionIdx + 1 >= plan.length || (!isCorrect && lives <= 1)
                    ? "See Results"
                    : "Next Question"}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
