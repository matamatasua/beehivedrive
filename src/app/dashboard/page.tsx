"use client";

import { useMemo } from "react";
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
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { XpDisplay } from "@/components/game/XpDisplay";
import { StreakDisplay } from "@/components/game/StreakDisplay";
import { LicenseBadge } from "@/components/game/LicenseBadge";
import { UtahRoadMap } from "@/components/game/UtahRoadMap";
import { AchievementToast } from "@/components/game/AchievementToast";
import { StudyTipCard } from "@/components/game/StudyTipCard";
import { useGameState } from "@/hooks/useGameState";
import { getLicenseLevel } from "@/lib/learning/leitner";
import { SAMPLE_QUESTIONS } from "@/lib/sample-questions";
import type { SessionType, Track } from "@/types";

// Build a questionId -> categorySlug map for mastery calculations
const QUESTION_CATEGORY_MAP: Record<string, string> = {};
for (const q of SAMPLE_QUESTIONS) {
  QUESTION_CATEGORY_MAP[q.id] = q.categoryId;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loaded, getCategoryMastery, newlyEarned, dismissNewAchievements } = useGameState();

  // Compute category mastery from persisted progress
  const mastery = useMemo(
    () => getCategoryMastery(QUESTION_CATEGORY_MAP),
    [getCategoryMastery]
  );

  // Calculate readiness from mastery
  const readiness = useMemo(() => {
    const values = Object.values(mastery);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [mastery]);

  const licenseLevel = getLicenseLevel(readiness);

  // Build the full mastery map (include categories with 0)
  const fullMastery = useMemo(() => {
    const base: Record<string, number> = {
      road_signs: 0,
      traffic_signals: 0,
      right_of_way: 0,
      speed_limits: 0,
      dui_laws: 0,
      parking_rules: 0,
      sharing_road: 0,
      adverse_conditions: 0,
      insurance_equipment: 0,
      final_exam: 0,
    };
    return { ...base, ...mastery };
  }, [mastery]);

  function handleStartQuiz(
    sessionType: SessionType = "quick_quiz",
    track: Track = "written_knowledge",
    categorySlug?: string
  ) {
    const params = new URLSearchParams({ type: sessionType, track });
    if (categorySlug) params.set("category", categorySlug);
    router.push(`/quiz?${params.toString()}`);
  }

  // Show nothing until localStorage is hydrated (prevents flash)
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
      <AchievementToast newlyEarned={newlyEarned} onDismiss={dismissNewAchievements} />
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
        {/* License badge + readiness */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <LicenseBadge level={licenseLevel} readiness={readiness} />
          <ProgressBar
            value={readiness}
            max={100}
            color={readiness >= 80 ? "green" : readiness >= 40 ? "amber" : "blue"}
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

        {/* Exam Simulator CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            hover
            onClick={() => router.push("/exam?track=written_knowledge")}
            className="bg-linear-to-r from-amber-400 to-amber-500 border-amber-500 overflow-hidden"
          >
            <CardBody className="py-5">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-base">Exam Simulator</p>
                  <p className="text-sm text-white/80 leading-snug">
                    Take a full 50-question timed test — just like the real DLD exam
                  </p>
                </div>
                <ArrowRight size={20} className="text-white/70 shrink-0" />
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card hover onClick={() => handleStartQuiz("quick_quiz", "written_knowledge")}>
            <CardBody className="text-center py-5">
              <Zap size={28} className="mx-auto text-amber-500 mb-2" />
              <p className="font-semibold text-gray-900">Quick Quiz</p>
              <p className="text-xs text-gray-500">10 questions, ~5 min</p>
            </CardBody>
          </Card>
          <Card hover onClick={() => handleStartQuiz("practice", "written_knowledge")}>
            <CardBody className="text-center py-5">
              <Target size={28} className="mx-auto text-blue-500 mb-2" />
              <p className="font-semibold text-gray-900">Practice Test</p>
              <p className="text-xs text-gray-500">20 questions</p>
            </CardBody>
          </Card>
          <Card hover onClick={() => router.push("/gauntlet")}>
            <CardBody className="text-center py-5">
              <Hash size={28} className="mx-auto text-green-500 mb-2" />
              <p className="font-semibold text-gray-900">Numbers Gauntlet</p>
              <p className="text-xs text-gray-500">Master the key numbers</p>
            </CardBody>
          </Card>
          <Card hover onClick={() => router.push("/challenge")}>
            <CardBody className="text-center py-5">
              <Shield size={28} className="mx-auto text-red-500 mb-2" />
              <p className="font-semibold text-gray-900">100% Challenge</p>
              <p className="text-xs text-gray-500">Traffic Safety exam</p>
            </CardBody>
          </Card>
        </div>

        {/* Two tracks */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={20} />
            Study Tracks
          </h2>

          <Card hover onClick={() => handleStartQuiz("practice", "written_knowledge")}>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">Written Knowledge Test</p>
                  <p className="text-sm text-gray-500">50 questions, 80% to pass</p>
                </div>
                <span className="text-2xl">📝</span>
              </div>
              <ProgressBar value={readiness} max={100} size="sm" color="amber" showLabel />
            </CardBody>
          </Card>

          <Card hover onClick={() => handleStartQuiz("quick_quiz", "traffic_safety")}>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">Traffic Safety & Trends</p>
                  <p className="text-sm text-gray-500">40 questions, 100% required</p>
                </div>
                <span className="text-2xl">🛡️</span>
              </div>
              <ProgressBar
                value={fullMastery["sharing_road"] ?? 0}
                max={100}
                size="sm"
                color="red"
                showLabel
              />
            </CardBody>
          </Card>
        </div>

        {/* Road trip map */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Map size={20} />
            Your Journey
          </h2>
          <UtahRoadMap
            categoryMastery={fullMastery}
            onSelectCategory={(slug) => {
              handleStartQuiz("quick_quiz", "written_knowledge", slug);
            }}
          />
        </div>
      </main>
    </div>
  );
}
