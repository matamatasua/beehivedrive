"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SAMPLE_QUESTIONS } from "@/lib/sample-questions";
import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
} from "@/lib/storage";
import type { Question, FatalFiveCategory } from "@/types";

// --- Types ---

interface ChallengeModeProps {
  onComplete: () => void;
  onExit: () => void;
}

interface SectionDef {
  id: number;
  name: string;
  description: string;
  fatalFiveCategories: FatalFiveCategory[];
  isRemainder: boolean;
}

interface ChallengeProgress {
  passedSections: number[]; // array of section ids that are passed
}

const CHALLENGE_STORAGE_KEY = "beehive_challenge_progress";

// --- Section definitions ---

const SECTION_DEFS: SectionDef[] = [
  {
    id: 0,
    name: "Speeding & Speed Limits",
    description: "Know the limits, save a life",
    fatalFiveCategories: ["speeding"],
    isRemainder: false,
  },
  {
    id: 1,
    name: "Distracted & Impaired Driving",
    description: "Eyes on the road, mind on the drive",
    fatalFiveCategories: ["distracted", "impaired"],
    isRemainder: false,
  },
  {
    id: 2,
    name: "Seatbelt & Safety",
    description: "Click it or ticket",
    fatalFiveCategories: ["seatbelt"],
    isRemainder: false,
  },
  {
    id: 3,
    name: "Aggressive Driving & General",
    description: "Stay calm, stay safe",
    fatalFiveCategories: ["aggressive"],
    isRemainder: true,
  },
];

// --- Build section question pools ---

function buildSectionQuestions(): Question[][] {
  const trafficSafetyQuestions = SAMPLE_QUESTIONS.filter(
    (q) => q.track === "traffic_safety"
  );

  const usedIds = new Set<string>();
  const sections: Question[][] = [];

  for (const def of SECTION_DEFS) {
    let pool: Question[];

    if (def.isRemainder) {
      // Include matching fatalFive categories + any remaining traffic_safety not yet used
      pool = trafficSafetyQuestions.filter(
        (q) =>
          (!usedIds.has(q.id) && def.fatalFiveCategories.includes(q.fatalFiveCategory)) ||
          (!usedIds.has(q.id) && !sections.flat().some((sq) => sq.id === q.id))
      );
    } else {
      pool = trafficSafetyQuestions.filter(
        (q) =>
          !usedIds.has(q.id) &&
          def.fatalFiveCategories.includes(q.fatalFiveCategory)
      );
    }

    // If not enough, pad with unused traffic_safety questions
    if (pool.length < 10) {
      const remaining = trafficSafetyQuestions.filter(
        (q) => !usedIds.has(q.id) && !pool.some((p) => p.id === q.id)
      );
      pool = [...pool, ...remaining].slice(0, 10);
    }

    const sectionQuestions = pool.slice(0, 10);
    for (const q of sectionQuestions) {
      usedIds.add(q.id);
    }
    sections.push(sectionQuestions);
  }

  return sections;
}

// --- Persistence helpers ---

function loadChallengeProgress(): ChallengeProgress {
  if (typeof window === "undefined") return { passedSections: [] };
  try {
    const raw = localStorage.getItem(CHALLENGE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ChallengeProgress;
  } catch {
    // ignore
  }
  return { passedSections: [] };
}

function saveChallengeProgress(progress: ChallengeProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

// --- Component ---

export function ChallengeMode({ onComplete, onExit }: ChallengeModeProps) {
  const [sectionQuestions] = useState<Question[][]>(() =>
    buildSectionQuestions()
  );
  const [passedSections, setPassedSections] = useState<number[]>([]);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [sectionFailed, setSectionFailed] = useState(false);
  const [sectionPassed, setSectionPassed] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved progress
  useEffect(() => {
    const saved = loadChallengeProgress();
    setPassedSections(saved.passedSections);
    setLoaded(true);
  }, []);

  // Save progress when sections change
  useEffect(() => {
    if (!loaded) return;
    saveChallengeProgress({ passedSections });
  }, [passedSections, loaded]);

  const currentQuestion =
    activeSection !== null
      ? sectionQuestions[activeSection]?.[currentQuestionIndex] ?? null
      : null;

  const correctIndex = currentQuestion
    ? currentQuestion.options.findIndex((o) => o.isCorrect)
    : -1;

  function startSection(sectionId: number) {
    setActiveSection(sectionId);
    setCurrentQuestionIndex(0);
    setSelectedIndex(null);
    setShowFeedback(false);
    setSectionFailed(false);
    setSectionPassed(false);
  }

  function handleOptionClick(index: number) {
    if (showFeedback || selectedIndex !== null) return;

    const correct = index === correctIndex;
    setSelectedIndex(index);
    setIsCorrectAnswer(correct);
    setShowFeedback(true);

    if (!correct) {
      // Section failed - show feedback, then offer retry
      setTimeout(() => {
        setSectionFailed(true);
      }, 1500);
    } else {
      // Correct answer
      setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1;
        const totalInSection = sectionQuestions[activeSection!]?.length ?? 10;

        if (nextIndex >= totalInSection) {
          // Section passed!
          setSectionPassed(true);
          const newPassed = [...passedSections, activeSection!];
          setPassedSections(newPassed);

          if (newPassed.length >= 4) {
            setTimeout(() => setAllComplete(true), 1500);
          }
        } else {
          setCurrentQuestionIndex(nextIndex);
          setSelectedIndex(null);
          setShowFeedback(false);
        }
      }, 1000);
    }
  }

  function handleRetrySection() {
    if (activeSection === null) return;
    setCurrentQuestionIndex(0);
    setSelectedIndex(null);
    setShowFeedback(false);
    setSectionFailed(false);
    setSectionPassed(false);
  }

  function handleBackToOverview() {
    setActiveSection(null);
    setCurrentQuestionIndex(0);
    setSelectedIndex(null);
    setShowFeedback(false);
    setSectionFailed(false);
    setSectionPassed(false);
  }

  function getOptionStyle(index: number) {
    if (!showFeedback) {
      return "border-gray-200 hover:border-red-400 hover:bg-red-50 cursor-pointer";
    }
    if (index === correctIndex) {
      return "border-green-500 bg-green-50";
    }
    if (index === selectedIndex && !isCorrectAnswer) {
      return "border-red-500 bg-red-50";
    }
    return "border-gray-200 opacity-40";
  }

  function isSectionUnlocked(sectionId: number): boolean {
    if (sectionId === 0) return true;
    return passedSections.includes(sectionId - 1);
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // --- All complete celebration ---
  if (allComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-center py-12"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Trophy size={72} className="mx-auto text-amber-500 mb-4" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          100% Challenge Complete!
        </h2>
        <p className="text-gray-500 mb-2">
          You passed all 4 sections with perfect scores.
        </p>
        <p className="text-lg font-semibold text-red-600 mb-8">
          You&apos;re ready for the real exam!
        </p>

        <motion.div
          className="flex gap-3 justify-center flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {SECTION_DEFS.map((def) => (
            <div
              key={def.id}
              className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200"
            >
              <CheckCircle size={14} />
              {def.name}
            </div>
          ))}
        </motion.div>

        <Button size="lg" className="mt-8" onClick={onComplete}>
          Back to Dashboard
          <ArrowRight size={20} className="ml-2" />
        </Button>
      </motion.div>
    );
  }

  // --- Section passed celebration ---
  if (sectionPassed && activeSection !== null) {
    const def = SECTION_DEFS[activeSection];
    const nextSectionAvailable = activeSection + 1 < 4;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
        >
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        </motion.div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Section Passed!
        </h2>
        <p className="text-gray-500 mb-6">
          Perfect score on {def.name}
        </p>

        <div className="flex gap-3 justify-center">
          {nextSectionAvailable ? (
            <Button onClick={() => startSection(activeSection + 1)}>
              Next Section
              <ArrowRight size={18} className="ml-2" />
            </Button>
          ) : null}
          <Button variant="outline" onClick={handleBackToOverview}>
            Section Overview
          </Button>
        </div>
      </motion.div>
    );
  }

  // --- Section failed ---
  if (sectionFailed && activeSection !== null && currentQuestion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-6"
      >
        <div className="text-center mb-6">
          <XCircle size={48} className="mx-auto text-red-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Not quite perfect
          </h2>
          <p className="text-sm text-gray-500">
            You need 100% to pass this section. Let&apos;s review and try again.
          </p>
        </div>

        {/* Explanation */}
        <Card className="mb-6 border-red-200">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {currentQuestion.text}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  {currentQuestion.explanation}
                </p>
                {currentQuestion.mnemonic && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-700 mb-1">
                      Memory Trick
                    </p>
                    <p className="text-sm text-amber-800">
                      {currentQuestion.mnemonic}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleRetrySection} className="flex-1">
            <RotateCcw size={18} className="mr-2" />
            Try Section Again
          </Button>
          <Button variant="outline" onClick={handleBackToOverview}>
            Overview
          </Button>
        </div>
      </motion.div>
    );
  }

  // --- Active section: question view ---
  if (activeSection !== null && currentQuestion) {
    const totalInSection = sectionQuestions[activeSection]?.length ?? 10;
    const def = SECTION_DEFS[activeSection];

    return (
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-red-500" />
            <span className="text-sm font-semibold text-red-600">
              {def.name}
            </span>
          </div>
          <button
            onClick={handleBackToOverview}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Exit Section
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">
            Question {currentQuestionIndex + 1} of {totalInSection}
          </span>
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
            100% required
          </span>
        </div>

        <ProgressBar
          value={((currentQuestionIndex + 1) / totalInSection) * 100}
          max={100}
          size="sm"
          color="red"
          className="mb-6"
        />

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 leading-relaxed">
              {currentQuestion.text}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
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
                    {showFeedback &&
                      index === selectedIndex &&
                      !isCorrectAnswer && (
                        <XCircle
                          size={20}
                          className="flex-shrink-0 text-red-500 ml-auto"
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

  // --- Section overview ---
  return (
    <div>
      <div className="text-center mb-6">
        <Shield size={40} className="mx-auto text-red-500 mb-2" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Traffic Safety 100% Challenge
        </h2>
        <p className="text-sm text-gray-500">
          Pass all 4 sections with a perfect score
        </p>
        <p className="text-xs text-red-600 font-medium mt-1">
          One wrong answer resets the section
        </p>
      </div>

      {/* Overall progress */}
      <ProgressBar
        value={(passedSections.length / 4) * 100}
        max={100}
        size="md"
        color="red"
        showLabel
        label="Overall Progress"
        className="mb-6"
      />

      {/* Section cards */}
      <div className="space-y-3 mb-6">
        {SECTION_DEFS.map((def) => {
          const passed = passedSections.includes(def.id);
          const unlocked = isSectionUnlocked(def.id);
          const questionCount = sectionQuestions[def.id]?.length ?? 0;

          return (
            <Card
              key={def.id}
              hover={unlocked && !passed}
              onClick={
                unlocked && !passed ? () => startSection(def.id) : undefined
              }
              className={
                passed
                  ? "border-green-300 bg-green-50"
                  : !unlocked
                  ? "opacity-60"
                  : "border-red-200"
              }
            >
              <CardBody className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {passed ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <CheckCircle size={32} className="text-green-500" />
                    </motion.div>
                  ) : !unlocked ? (
                    <Lock size={32} className="text-gray-400" />
                  ) : (
                    <Shield size={32} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      passed ? "text-green-800" : "text-gray-900"
                    }`}
                  >
                    Section {def.id + 1}: {def.name}
                  </p>
                  <p
                    className={`text-sm ${
                      passed ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {passed
                      ? "Passed with 100%!"
                      : !unlocked
                      ? "Complete previous section to unlock"
                      : `${questionCount} questions — ${def.description}`}
                  </p>
                </div>
                {unlocked && !passed && (
                  <ArrowRight size={20} className="text-red-400" />
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Exit button */}
      <Button variant="outline" className="w-full" onClick={onExit}>
        Back to Dashboard
      </Button>
    </div>
  );
}
