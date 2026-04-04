"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Car,
  RefreshCw,
  Backpack,
  User,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Brain,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { SAMPLE_QUESTIONS } from "@/lib/sample-questions";
import { useGameState } from "@/hooks/useGameState";
import type { Question, QuizResult } from "@/types";

// --- Types ---

interface OnboardingData {
  licenseType: string;
  ageGroup: string;
  diagnosticScore?: number;
  completedAt: string;
}

interface SelectionCard {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// --- Step data ---

const LICENSE_OPTIONS: SelectionCard[] = [
  {
    id: "original",
    label: "Learner Permit",
    description: "Getting my first Utah license",
    icon: <FileText size={32} className="text-amber-500" />,
  },
  {
    id: "transfer",
    label: "Transfer",
    description: "Moving to Utah from another state",
    icon: <Car size={32} className="text-amber-500" />,
  },
  {
    id: "renewal",
    label: "Renewal",
    description: "Renewing my expired Utah license",
    icon: <RefreshCw size={32} className="text-amber-500" />,
  },
];

const AGE_OPTIONS: SelectionCard[] = [
  {
    id: "teen",
    label: "Teen (15-17)",
    description: "Getting my first license",
    icon: <Backpack size={32} className="text-amber-500" />,
  },
  {
    id: "adult",
    label: "Adult (18+)",
    description: "New driver or new to Utah",
    icon: <User size={32} className="text-amber-500" />,
  },
];

// --- Animation variants ---

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

// --- Diagnostic Quiz Sub-component ---

function selectDiagnosticQuestions(): Question[] {
  // Get unique categories from questions
  const categoryMap = new Map<string, Question[]>();
  for (const q of SAMPLE_QUESTIONS) {
    if (q.difficulty > 2) continue; // only difficulty 1-2
    const existing = categoryMap.get(q.categoryId) ?? [];
    existing.push(q);
    categoryMap.set(q.categoryId, existing);
  }

  // Take 1 question from each of the top 10 categories
  const categories = Array.from(categoryMap.keys()).slice(0, 10);
  const selected: Question[] = [];

  for (const cat of categories) {
    const pool = categoryMap.get(cat) ?? [];
    if (pool.length > 0) {
      // Pick a random question from this category
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool[idx]);
    }
    if (selected.length >= 10) break;
  }

  return selected;
}

function DiagnosticQuiz({
  onComplete,
}: {
  onComplete: (score: number) => void;
}) {
  const [questions] = useState<Question[]>(() => selectDiagnosticQuestions());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [finished, setFinished] = useState(false);

  const { recordQuizResults } = useGameState();

  const resultsRef = useMemo<QuizResult[]>(() => [], []);

  const question = questions[currentIndex];
  const correctIndex = question
    ? question.options.findIndex((o) => o.isCorrect)
    : -1;

  const handleOptionClick = useCallback(
    (index: number) => {
      if (showFeedback || selectedIndex !== null) return;

      const correct = index === correctIndex;
      setSelectedIndex(index);
      setIsCorrectAnswer(correct);
      setShowFeedback(true);

      const newScore = correct ? score + 1 : score;
      if (correct) setScore(newScore);

      // Record result for useGameState
      resultsRef.push({
        question,
        selectedAnswer: question.options[index].text,
        isCorrect: correct,
        confidence: "unsure",
        timeSpentMs: 0,
        xpEarned: correct ? 10 : 0,
      });

      // Auto-advance after 1 second
      setTimeout(() => {
        if (currentIndex + 1 >= questions.length) {
          // Save results
          recordQuizResults(resultsRef);
          setFinished(true);
          // Brief pause to show summary, then complete
          setTimeout(() => {
            onComplete(newScore);
          }, 2000);
        } else {
          setCurrentIndex((i) => i + 1);
          setSelectedIndex(null);
          setShowFeedback(false);
          setIsCorrectAnswer(false);
        }
      }, 1000);
    },
    [
      showFeedback,
      selectedIndex,
      correctIndex,
      score,
      currentIndex,
      questions,
      question,
      resultsRef,
      recordQuizResults,
      onComplete,
    ]
  );

  function getOptionStyle(index: number) {
    if (!showFeedback) {
      return "border-gray-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer";
    }
    if (index === correctIndex) {
      return "border-green-500 bg-green-50";
    }
    if (index === selectedIndex && !isCorrectAnswer) {
      return "border-red-500 bg-red-50";
    }
    return "border-gray-200 opacity-40";
  }

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <Brain size={48} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          You got {score}/{questions.length}
        </h3>
        <p className="text-sm text-gray-500">
          We&apos;ll focus on your weak areas
        </p>
      </motion.div>
    );
  }

  if (!question) return null;

  return (
    <div>
      <div className="text-center mb-6">
        <Brain size={32} className="mx-auto text-amber-500 mb-2" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Quick Diagnostic
        </h2>
        <p className="text-sm text-gray-500">
          Let&apos;s see where you stand &mdash; 10 quick questions
        </p>
      </div>

      {/* Progress counter */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-sm font-medium text-amber-600">
          {score} correct
        </span>
      </div>

      <ProgressBar
        value={((currentIndex + 1) / questions.length) * 100}
        max={100}
        size="sm"
        color="amber"
        className="mb-6"
      />

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 leading-relaxed">
            {question.text}
          </h3>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={showFeedback}
                className={`
                  w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                  ${getOptionStyle(index)}
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-800 leading-relaxed">
                    {option.text}
                  </span>
                  {showFeedback && index === correctIndex && (
                    <CheckCircle
                      size={20}
                      className="flex-shrink-0 text-green-500 ml-auto"
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- Main Component ---

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [licenseType, setLicenseType] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<string>("");
  const [diagnosticScore, setDiagnosticScore] = useState<number | null>(null);

  const totalSteps = 4;
  const progressValue = ((step + 1) / totalSteps) * 100;

  function goNext() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function handleLicenseSelect(id: string) {
    setLicenseType(id);
    // Auto-advance after a brief pause for visual feedback
    setTimeout(() => {
      setDirection(1);
      setStep(1);
    }, 200);
  }

  function handleAgeSelect(id: string) {
    setAgeGroup(id);
    setTimeout(() => {
      setDirection(1);
      setStep(2);
    }, 200);
  }

  function handleDiagnosticComplete(score: number) {
    setDiagnosticScore(score);
    setDirection(1);
    setStep(3);
  }

  function handleComplete() {
    const data: OnboardingData = {
      licenseType,
      ageGroup,
      diagnosticScore: diagnosticScore ?? undefined,
      completedAt: new Date().toISOString(),
    };
    setStorageItem(STORAGE_KEYS.onboarding, data);
    router.push("/dashboard");
  }

  function getLicenseLabel(id: string): string {
    return LICENSE_OPTIONS.find((o) => o.id === id)?.label ?? id;
  }

  function getAgeLabel(id: string): string {
    return AGE_OPTIONS.find((o) => o.id === id)?.label ?? id;
  }

  return (
    <div>
      {/* Progress bar */}
      <ProgressBar
        value={progressValue}
        max={100}
        size="sm"
        color="amber"
        className="mb-8"
      />

      <AnimatePresence mode="wait" custom={direction}>
        {step === 0 && (
          <motion.div
            key="step-0"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              What are you preparing for?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              We&apos;ll customize your study plan
            </p>

            <div className="space-y-3">
              {LICENSE_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  hover
                  onClick={() => handleLicenseSelect(option.id)}
                  className={
                    licenseType === option.id
                      ? "ring-2 ring-amber-500 border-amber-400"
                      : ""
                  }
                >
                  <CardBody className="flex items-center gap-4">
                    <div className="flex-shrink-0">{option.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {option.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step-1"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Tell us about yourself
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              This helps us pick the right content for you
            </p>

            <div className="space-y-3">
              {AGE_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  hover
                  onClick={() => handleAgeSelect(option.id)}
                  className={
                    ageGroup === option.id
                      ? "ring-2 ring-amber-500 border-amber-400"
                      : ""
                  }
                >
                  <CardBody className="flex items-center gap-4">
                    <div className="flex-shrink-0">{option.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {option.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <DiagnosticQuiz onComplete={handleDiagnosticComplete} />

            <div className="mt-6">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle
                  size={56}
                  className="mx-auto text-green-500 mb-3"
                />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900">
                You&apos;re all set!
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Here&apos;s your personalized study plan
              </p>
            </div>

            {/* Summary */}
            <Card className="mb-4">
              <CardBody>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">License type</span>
                    <span className="font-semibold text-gray-900">
                      {getLicenseLabel(licenseType)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age group</span>
                    <span className="font-semibold text-gray-900">
                      {getAgeLabel(ageGroup)}
                    </span>
                  </div>
                  {diagnosticScore !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Diagnostic score</span>
                      <span className="font-semibold text-gray-900">
                        {diagnosticScore}/10
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* What the app covers */}
            <Card className="mb-6">
              <CardBody>
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  What you&apos;ll study:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">
                      <FileText size={16} />
                    </span>
                    <span>
                      <strong>Written Knowledge Test</strong> &mdash; 50
                      questions, 80% to pass
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">
                      <CheckCircle size={16} />
                    </span>
                    <span>
                      <strong>Traffic Safety Exam</strong> &mdash; 40 questions,
                      100% required
                    </span>
                  </li>
                </ul>
              </CardBody>
            </Card>

            {/* CTA */}
            <Button size="lg" className="w-full" onClick={handleComplete}>
              Start Learning
              <ArrowRight size={20} className="ml-2" />
            </Button>

            <div className="mt-4">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
