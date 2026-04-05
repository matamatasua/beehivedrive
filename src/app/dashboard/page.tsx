"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Zap,
  Target,
  Shield,
  Map,
  Hash,
  Clock,
  FileText,
  ArrowRight,
  CheckCircle2,
  Circle,
  PlayCircle,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { XpDisplay } from "@/components/game/XpDisplay";
import { StreakDisplay } from "@/components/game/StreakDisplay";
import { LicenseBadge } from "@/components/game/LicenseBadge";
import { UtahRoadMap } from "@/components/game/UtahRoadMap";
import { AchievementToast } from "@/components/game/AchievementToast";
import { StudyTipCard } from "@/components/game/StudyTipCard";
import { useGameState } from "@/hooks/useGameState";
import { getLicenseLevel } from "@/lib/learning/leitner";
import { SAMPLE_QUESTIONS } from "@/lib/sample-questions";
import { getCategoryName } from "@/lib/category-utils";
import { getStorageItem, STORAGE_KEYS } from "@/lib/storage";
import type { LicenseLevel, SessionType, Track } from "@/types";

// ---------------------------------------------------------------------------
// Static data derived from the question bank
// ---------------------------------------------------------------------------

const QUESTION_CATEGORY_MAP: Record<string, string> = {};
for (const q of SAMPLE_QUESTIONS) {
  QUESTION_CATEGORY_MAP[q.id] = q.categoryId;
}

const CATEGORY_QUESTION_COUNTS: Record<string, number> = {};
for (const q of SAMPLE_QUESTIONS) {
  CATEGORY_QUESTION_COUNTS[q.categoryId] =
    (CATEGORY_QUESTION_COUNTS[q.categoryId] ?? 0) + 1;
}

/** Recommended order through the 11 study topics. */
const STUDY_ORDER = [
  "road_signs",
  "traffic_signals",
  "right_of_way",
  "speed_limits",
  "dui_laws",
  "parking_rules",
  "sharing_road",
  "adverse_conditions",
  "insurance_equipment",
  "gdl_restrictions",
  "utah_specific",
] as const;

/** The diagnostic quiz answers at most ~10 questions. */
const DIAGNOSTIC_THRESHOLD = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CategoryStatus = "not_started" | "in_progress" | "complete";

interface NextStepData {
  label: string;
  description: string;
  slug: string | null;
  route: string | null;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    progress,
    loaded,
    getCategoryMastery,
    newlyEarned,
    dismissNewAchievements,
  } = useGameState();

  // Total questions the user has ever seen (across all progress entries)
  const totalTimesSeen = useMemo(
    () => Object.values(progress).reduce((sum, p) => sum + p.timesSeen, 0),
    [progress],
  );

  const isFirstTime = totalTimesSeen <= DIAGNOSTIC_THRESHOLD;
  const hasDoneRealStudy = !isFirstTime;

  // Category mastery from Leitner boxes
  const mastery = useMemo(
    () => getCategoryMastery(QUESTION_CATEGORY_MAP),
    [getCategoryMastery],
  );

  // Full mastery map (every category present, zeroed if diagnostic-only)
  const fullMastery = useMemo(() => {
    const base: Record<string, number> = {};
    for (const slug of STUDY_ORDER) base[slug] = 0;
    base["final_exam"] = 0;
    if (hasDoneRealStudy) return { ...base, ...mastery };
    return base;
  }, [mastery, hasDoneRealStudy]);

  // Overall readiness (uses zeroed mastery for first-time users)
  const readiness = useMemo(() => {
    const vals = Object.values(fullMastery);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [fullMastery]);

  const licenseLevel = getLicenseLevel(readiness);

  // Context-aware recommendation
  const nextStep: NextStepData = useMemo(() => {
    if (isFirstTime) {
      return {
        label: "Start with: Road Signs",
        description:
          "This is the most common topic on the test. Master this first.",
        slug: "road_signs",
        route: null,
      };
    }

    const firstUnstarted = STUDY_ORDER.find(
      (s) => (fullMastery[s] ?? 0) === 0,
    );
    if (firstUnstarted) {
      return {
        label: `Continue with: ${getCategoryName(firstUnstarted)}`,
        description: "Pick up where you left off and keep building knowledge.",
        slug: firstUnstarted,
        route: null,
      };
    }

    const weakest = [...STUDY_ORDER]
      .filter((s) => (fullMastery[s] ?? 0) < 60)
      .sort((a, b) => (fullMastery[a] ?? 0) - (fullMastery[b] ?? 0));
    if (weakest.length > 0) {
      return {
        label: `Review: ${getCategoryName(weakest[0])}`,
        description: "Strengthen your weakest area to boost your readiness.",
        slug: weakest[0],
        route: null,
      };
    }

    if (readiness >= 80) {
      return {
        label: "You're almost there! Try the 100% Challenge",
        description:
          "You have strong knowledge across all topics. Prove you can get a perfect score.",
        slug: null,
        route: "/challenge",
      };
    }

    return {
      label: "You're ready! Take the Exam Simulator",
      description:
        "All topics are looking good. Simulate the real DLD exam experience.",
      slug: null,
      route: "/exam?track=written_knowledge",
    };
  }, [isFirstTime, fullMastery, readiness]);

  // Navigation helpers
  function handleStartQuiz(
    sessionType: SessionType = "quick_quiz",
    track: Track = "written_knowledge",
    categorySlug?: string,
  ) {
    const params = new URLSearchParams({ type: sessionType, track });
    if (categorySlug) params.set("category", categorySlug);
    router.push(`/quiz?${params.toString()}`);
  }

  function handleNextStep() {
    if (nextStep.route) {
      router.push(nextStep.route);
    } else if (nextStep.slug) {
      handleStartQuiz("quick_quiz", "written_knowledge", nextStep.slug);
    }
  }

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!loaded) return;
    const onboarding = getStorageItem<{ completedAt: string }>(STORAGE_KEYS.onboarding);
    if (!onboarding) {
      router.replace("/onboarding");
    }
  }, [loaded, router]);

  // Hydration guard
  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">🐝</span>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AchievementToast
        newlyEarned={newlyEarned}
        onDismiss={dismissNewAchievements}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐝</span>
            <h1 className="text-xl font-bold text-gray-900">BeehiveDrive</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/history")}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Quiz history"
            >
              <Clock size={20} />
            </button>
            <StreakDisplay streak={user.currentStreak} />
            <XpDisplay xp={user.xp} />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {isFirstTime ? (
          <FirstTimeDashboard
            nextStep={nextStep}
            onNextStep={handleNextStep}
            fullMastery={fullMastery}
            onStartQuiz={handleStartQuiz}
          />
        ) : (
          <ReturningDashboard
            user={user}
            nextStep={nextStep}
            onNextStep={handleNextStep}
            fullMastery={fullMastery}
            readiness={readiness}
            licenseLevel={licenseLevel}
            hasDoneRealStudy={hasDoneRealStudy}
            onStartQuiz={handleStartQuiz}
            onNavigate={(path: string) => router.push(path)}
          />
        )}
      </main>
    </div>
  );
}

// ============================================
// First-Time User Dashboard
// ============================================

interface FirstTimeDashboardProps {
  nextStep: NextStepData;
  onNextStep: () => void;
  fullMastery: Record<string, number>;
  onStartQuiz: (t: SessionType, tr: Track, cat?: string) => void;
}

function FirstTimeDashboard({
  nextStep,
  onNextStep,
  onStartQuiz,
}: FirstTimeDashboardProps) {
  return (
    <>
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-amber-50 border-amber-200">
          <CardBody>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Welcome to BeehiveDrive!
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Here&apos;s your path to passing the Utah driver&apos;s test.
              You&apos;ll study 11 topics, then take a practice exam.
              Let&apos;s start with the basics.
            </p>
          </CardBody>
        </Card>
      </motion.div>

      {/* Next Step CTA */}
      <NextStepCard nextStep={nextStep} onNextStep={onNextStep} />

      {/* What You'll Need to Pass */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          What You&apos;ll Need to Pass
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardBody className="text-center py-5">
              <span className="text-2xl mb-2 block">📝</span>
              <p className="font-semibold text-gray-900 text-sm">
                Written Knowledge
              </p>
              <p className="text-xs text-gray-500 mt-1">50 questions</p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">
                Need 80% correct
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-5">
              <span className="text-2xl mb-2 block">🛡️</span>
              <p className="font-semibold text-gray-900 text-sm">
                Traffic Safety
              </p>
              <p className="text-xs text-gray-500 mt-1">40 questions</p>
              <p className="text-xs text-red-600 font-medium mt-0.5">
                Must get 100%
              </p>
            </CardBody>
          </Card>
        </div>
      </motion.div>

      {/* Study Plan — numbered list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <BookOpen size={20} />
          Your Study Plan
        </h2>
        <div className="space-y-2">
          {STUDY_ORDER.map((slug, index) => {
            const questionCount = CATEGORY_QUESTION_COUNTS[slug] ?? 0;

            return (
              <motion.button
                key={slug}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                onClick={() =>
                  onStartQuiz("quick_quiz", "written_knowledge", slug)
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all text-left"
              >
                <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {getCategoryName(slug)}
                    {index === 0 && (
                      <span className="ml-2 text-xs text-amber-600 font-semibold">
                        Start here
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {questionCount} questions
                  </p>
                </div>
                <StudyStatusBadge status="not_started" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

// ============================================
// Returning User Dashboard
// ============================================

interface ReturningDashboardProps {
  user: {
    xp: number;
    currentStreak: number;
    longestStreak: number;
    questionsAnsweredToday: number;
  };
  nextStep: NextStepData;
  onNextStep: () => void;
  fullMastery: Record<string, number>;
  readiness: number;
  licenseLevel: LicenseLevel;
  hasDoneRealStudy: boolean;
  onStartQuiz: (t: SessionType, tr: Track, cat?: string) => void;
  onNavigate: (path: string) => void;
}

function ReturningDashboard({
  user,
  nextStep,
  onNextStep,
  fullMastery,
  readiness,
  licenseLevel,
  hasDoneRealStudy,
  onStartQuiz,
  onNavigate,
}: ReturningDashboardProps) {
  const writtenCategories = STUDY_ORDER.filter((s) => s !== "sharing_road");

  const writtenReadiness = useMemo(() => {
    const vals = writtenCategories.map((s) => fullMastery[s] ?? 0);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [fullMastery, writtenCategories]);

  const trafficSafetyMastery = fullMastery["sharing_road"] ?? 0;

  return (
    <>
      {/* License Badge + Readiness */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <LicenseBadge level={licenseLevel} readiness={readiness} />
        <ProgressBar
          value={readiness}
          max={100}
          color={
            readiness >= 80 ? "green" : readiness >= 40 ? "amber" : "blue"
          }
          showLabel
          label="Test Readiness"
          className="mt-4"
        />
      </motion.div>

      {/* AI Study Tip */}
      <StudyTipCard
        weakCategories={Object.entries(fullMastery)
          .filter(([, v]) => v < 40)
          .map(([k]) => k.replace(/_/g, " "))}
        strongCategories={Object.entries(fullMastery)
          .filter(([, v]) => v >= 70)
          .map(([k]) => k.replace(/_/g, " "))}
        readiness={readiness}
        streak={user.currentStreak}
      />

      {/* Next Step CTA */}
      <NextStepCard nextStep={nextStep} onNextStep={onNextStep} />

      {/* Quick Actions — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          hover
          onClick={() => onStartQuiz("quick_quiz", "written_knowledge")}
        >
          <CardBody className="text-center py-5">
            <Zap size={28} className="mx-auto text-amber-500 mb-2" />
            <p className="font-semibold text-gray-900">Quick Quiz</p>
            <p className="text-xs text-gray-500">10 questions, ~5 min</p>
          </CardBody>
        </Card>
        <Card
          hover
          onClick={() => onStartQuiz("practice", "written_knowledge")}
        >
          <CardBody className="text-center py-5">
            <Target size={28} className="mx-auto text-blue-500 mb-2" />
            <p className="font-semibold text-gray-900">Practice Test</p>
            <p className="text-xs text-gray-500">20 questions</p>
          </CardBody>
        </Card>
        <Card hover onClick={() => onNavigate("/gauntlet")}>
          <CardBody className="text-center py-5">
            <Hash size={28} className="mx-auto text-green-500 mb-2" />
            <p className="font-semibold text-gray-900">Numbers Gauntlet</p>
            <p className="text-xs text-gray-500">Master the key numbers</p>
          </CardBody>
        </Card>
        <Card hover onClick={() => onNavigate("/challenge")}>
          <CardBody className="text-center py-5">
            <Shield size={28} className="mx-auto text-red-500 mb-2" />
            <p className="font-semibold text-gray-900">100% Challenge</p>
            <p className="text-xs text-gray-500">Traffic Safety exam</p>
          </CardBody>
        </Card>
      </div>

      {/* Exam Simulator — progressive disclosure, hidden until readiness >= 50% */}
      {readiness >= 50 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            hover
            onClick={() => onNavigate("/exam?track=written_knowledge")}
            className="bg-linear-to-r from-amber-400 to-amber-500 border-amber-500 overflow-hidden"
          >
            <CardBody className="py-5">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-base">
                    Exam Simulator
                  </p>
                  <p className="text-sm text-white/80 leading-snug">
                    Take a full 50-question timed test, just like the real DLD
                    exam
                  </p>
                </div>
                <ArrowRight size={20} className="text-white/70 shrink-0" />
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Study Tracks — shows "Not started" instead of fake percentages */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <BookOpen size={20} />
          Study Tracks
        </h2>

        <Card
          hover
          onClick={() => onStartQuiz("practice", "written_knowledge")}
        >
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">
                  Written Knowledge Test
                </p>
                <p className="text-sm text-gray-500">
                  50 questions, 80% to pass
                </p>
              </div>
              <span className="text-2xl">📝</span>
            </div>
            {hasDoneRealStudy && writtenReadiness > 0 ? (
              <ProgressBar
                value={writtenReadiness}
                max={100}
                size="sm"
                color="amber"
                showLabel
              />
            ) : (
              <p className="text-sm text-gray-400 italic">Not started</p>
            )}
          </CardBody>
        </Card>

        <Card
          hover
          onClick={() => onStartQuiz("quick_quiz", "traffic_safety")}
        >
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">
                  Traffic Safety &amp; Trends
                </p>
                <p className="text-sm text-gray-500">
                  40 questions, 100% required
                </p>
              </div>
              <span className="text-2xl">🛡️</span>
            </div>
            {hasDoneRealStudy && trafficSafetyMastery > 0 ? (
              <ProgressBar
                value={trafficSafetyMastery}
                max={100}
                size="sm"
                color="red"
                showLabel
              />
            ) : (
              <p className="text-sm text-gray-400 italic">Not started</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Journey Map */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Map size={20} />
          Your Journey
        </h2>
        <UtahRoadMap
          categoryMastery={fullMastery}
          totalQuestionsStudied={
            hasDoneRealStudy
              ? Object.values(fullMastery).filter((v) => v > 0).length
              : 0
          }
          onSelectCategory={(slug) => {
            onStartQuiz("quick_quiz", "written_knowledge", slug);
          }}
        />
      </div>
    </>
  );
}

// ============================================
// Shared UI Pieces
// ============================================

function NextStepCard({
  nextStep,
  onNextStep,
}: {
  nextStep: NextStepData;
  onNextStep: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-2 border-amber-400 bg-white shadow-md">
        <CardBody className="py-5">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">
            Your Next Step
          </p>
          <p className="font-bold text-gray-900 text-base mb-1">
            {nextStep.label}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {nextStep.description}
          </p>
          <Button size="lg" className="w-full" onClick={onNextStep}>
            Start Learning
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </CardBody>
      </Card>
    </motion.div>
  );
}

function StudyStatusBadge({ status }: { status: CategoryStatus }) {
  switch (status) {
    case "complete":
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <CheckCircle2 size={12} />
          Complete
        </span>
      );
    case "in_progress":
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
          <PlayCircle size={12} />
          In progress
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
          <Circle size={12} />
          Not started
        </span>
      );
  }
}
