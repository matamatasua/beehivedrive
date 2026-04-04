"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Flame,
  CheckCircle,
  Shield,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { AchievementGallery } from "@/components/game/AchievementGallery";
import { useGameState } from "@/hooks/useGameState";
import { SAMPLE_QUESTIONS } from "@/lib/sample-questions";
import { getCategoryName } from "@/lib/category-utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUESTION_CATEGORY_MAP: Record<string, string> = {};
for (const q of SAMPLE_QUESTIONS) {
  QUESTION_CATEGORY_MAP[q.id] = q.categoryId;
}

const ALL_CATEGORIES = [
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

const BOX_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "New", color: "bg-red-500" },
  2: { label: "Learning", color: "bg-orange-500" },
  3: { label: "Reviewing", color: "bg-yellow-500" },
  4: { label: "Almost", color: "bg-green-500" },
  5: { label: "Mastered", color: "bg-emerald-500" },
};

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMasteryStyle(pct: number): { bg: string; text: string } {
  if (pct >= 75) return { bg: "bg-green-100", text: "text-green-700" };
  if (pct >= 50) return { bg: "bg-yellow-100", text: "text-yellow-700" };
  if (pct >= 25) return { bg: "bg-amber-100", text: "text-amber-600" };
  return { bg: "bg-red-100", text: "text-red-600" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HistoryPage() {
  const router = useRouter();
  const { user, progress, loaded, getCategoryMastery, earnedAchievements } = useGameState();

  // Derived data
  const totalQuestionsAnswered = useMemo(() => {
    return Object.values(progress).reduce((sum, p) => sum + p.timesSeen, 0);
  }, [progress]);

  const categoryMastery = useMemo(() => {
    return getCategoryMastery(QUESTION_CATEGORY_MAP);
  }, [getCategoryMastery]);

  const boxDistribution = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const p of Object.values(progress)) {
      counts[p.leitnerBox] = (counts[p.leitnerBox] ?? 0) + 1;
    }
    return counts;
  }, [progress]);

  const totalTracked = useMemo(() => {
    return Object.values(boxDistribution).reduce((a, b) => a + b, 0);
  }, [boxDistribution]);

  // Study tips
  const tips = useMemo(() => {
    const result: string[] = [];

    if (user.currentStreak === 0) {
      result.push("Start a study streak! Answer at least 5 questions daily.");
    }

    // Find weakest category
    const weakEntries = ALL_CATEGORIES
      .map((slug) => ({ slug, mastery: categoryMastery[slug] ?? 0 }))
      .filter((e) => e.mastery < 30)
      .sort((a, b) => a.mastery - b.mastery);

    if (weakEntries.length > 0) {
      result.push(
        `Focus on ${getCategoryName(weakEntries[0].slug)} \u2014 it appears frequently on the test.`
      );
    }

    if (totalTracked > 0 && boxDistribution[1] / totalTracked > 0.5) {
      result.push(
        "Many questions need review. Try a Quick Quiz to start moving them up."
      );
    }

    // Overall average mastery
    const avgMastery =
      ALL_CATEGORIES.reduce((s, slug) => s + (categoryMastery[slug] ?? 0), 0) /
      ALL_CATEGORIES.length;

    if (avgMastery > 70) {
      result.push(
        "You're almost test-ready! Try an Exam Simulator to test your skills."
      );
    }

    if (result.length === 0) {
      result.push("Keep going! Consistency is the key to passing your test.");
    }

    return result;
  }, [user.currentStreak, categoryMastery, boxDistribution, totalTracked]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-4xl">🐝</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Your Progress</h1>
        </div>
      </header>

      <motion.main
        className="max-w-lg mx-auto px-4 pt-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* A. Stats Overview */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Star className="w-5 h-5 text-amber-500" />}
              label="Total XP"
              value={user.xp.toLocaleString()}
              bg="bg-amber-50"
            />
            <StatCard
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              label="Current Streak"
              value={`${user.currentStreak} day${user.currentStreak !== 1 ? "s" : ""}`}
              bg="bg-orange-50"
            />
            <StatCard
              icon={<CheckCircle className="w-5 h-5 text-green-500" />}
              label="Questions Answered"
              value={totalQuestionsAnswered.toLocaleString()}
              bg="bg-green-50"
            />
            <StatCard
              icon={<Shield className="w-5 h-5 text-blue-500" />}
              label="Mastery Level"
              value={
                user.licenseLevel === "full"
                  ? "Full"
                  : user.licenseLevel === "provisional"
                    ? "Provisional"
                    : "Learner"
              }
              bg="bg-blue-50"
            />
          </div>
        </motion.section>

        {/* B. Achievements */}
        <motion.section variants={itemVariants}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Achievements
          </h2>
          <AchievementGallery earnedAchievements={earnedAchievements} />
        </motion.section>

        {/* C. Category Mastery Heatmap */}
        <motion.section variants={itemVariants}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Category Mastery
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {ALL_CATEGORIES.map((slug) => {
              const pct = Math.round(categoryMastery[slug] ?? 0);
              const style = getMasteryStyle(pct);
              return (
                <button
                  key={slug}
                  onClick={() => router.push(`/category/${slug}`)}
                  className={`rounded-xl px-3 py-3 text-left transition-transform active:scale-95 ${style.bg}`}
                >
                  <p className={`text-xs font-semibold ${style.text}`}>
                    {getCategoryName(slug)}
                  </p>
                  <p className={`text-lg font-bold mt-0.5 ${style.text}`}>
                    {pct}%
                  </p>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* C. Leitner Box Distribution */}
        <motion.section variants={itemVariants}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Leitner Box Distribution
          </h2>
          <Card>
            <CardBody>
              {totalTracked === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">
                  No questions studied yet. Start a quiz!
                </p>
              ) : (
                <>
                  {/* Stacked bar */}
                  <div className="flex h-6 rounded-full overflow-hidden">
                    {([1, 2, 3, 4, 5] as const).map((box) => {
                      const count = boxDistribution[box] ?? 0;
                      if (count === 0) return null;
                      const widthPct = (count / totalTracked) * 100;
                      return (
                        <div
                          key={box}
                          className={`${BOX_LABELS[box].color} transition-all duration-500`}
                          style={{ width: `${widthPct}%` }}
                          title={`${BOX_LABELS[box].label}: ${count}`}
                        />
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {([1, 2, 3, 4, 5] as const).map((box) => (
                      <div key={box} className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${BOX_LABELS[box].color}`}
                        />
                        <span className="text-xs text-gray-600">
                          {BOX_LABELS[box].label} ({boxDistribution[box] ?? 0})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </motion.section>

        {/* D. Study Tips */}
        <motion.section variants={itemVariants}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Study Tips
          </h2>
          <Card>
            <CardBody className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </motion.section>
      </motion.main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard sub-component
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <Card>
      <CardBody className={`flex items-center gap-3 ${bg} rounded-2xl`}>
        <div className="shrink-0">{icon}</div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-base font-bold text-gray-900">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
