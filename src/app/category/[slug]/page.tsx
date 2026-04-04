"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Target,
  Brain,
  Clock,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SAMPLE_QUESTIONS } from "@/lib/sample-questions";
import { MAP_STOPS } from "@/lib/constants";
import { useGameState } from "@/hooks/useGameState";
import {
  getCategoryName,
  getCategoryQuestions,
  getCategoryStats,
} from "@/lib/category-utils";
import type { LeitnerBox } from "@/types";

// ============================================
// Leitner Box Color Helpers
// ============================================

function getLeitnerDotColor(box: LeitnerBox): string {
  switch (box) {
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-orange-500";
    case 3:
      return "bg-yellow-500";
    case 4:
      return "bg-green-500";
    case 5:
      return "bg-emerald-500";
  }
}

function getLeitnerLabel(box: LeitnerBox): string {
  switch (box) {
    case 1:
      return "New";
    case 2:
      return "Learning";
    case 3:
      return "Reviewing";
    case 4:
      return "Familiar";
    case 5:
      return "Mastered";
  }
}

function formatConfidence(avg: number): string {
  if (avg === 0) return "N/A";
  if (avg >= 2.5) return "High";
  if (avg >= 1.5) return "Medium";
  return "Low";
}

// ============================================
// Category Page
// ============================================

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { progress, loaded } = useGameState();

  const categoryName = getCategoryName(slug);
  const categoryQuestions = useMemo(
    () => getCategoryQuestions(slug, SAMPLE_QUESTIONS),
    [slug]
  );
  const stats = useMemo(
    () => getCategoryStats(slug, SAMPLE_QUESTIONS, progress),
    [slug, progress]
  );

  const mapStop = MAP_STOPS.find((s) => s.slug === slug);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-pulse text-amber-600 text-lg font-semibold">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-amber-200"
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-amber-700" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{categoryName}</h1>
            {mapStop && (
              <p className="text-sm text-amber-600">{mapStop.city}</p>
            )}
          </div>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Mastery Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardBody className="text-center space-y-4">
              <div className="text-5xl font-bold text-amber-600">
                {stats.masteryPercent}%
              </div>
              <p className="text-sm text-gray-500 font-medium">Mastery</p>
              <ProgressBar
                value={stats.masteryPercent}
                color="amber"
                size="lg"
                className="max-w-xs mx-auto"
              />
              <div className="flex justify-center gap-8 text-sm text-gray-600 pt-2">
                <div>
                  <span className="font-semibold text-gray-900">
                    {stats.seen}
                  </span>{" "}
                  / {stats.totalQuestions} seen
                </div>
                <div>
                  <span className="font-semibold text-gray-900">
                    {stats.mastered}
                  </span>{" "}
                  mastered
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Fun Fact */}
        {mapStop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border-amber-200 bg-amber-50">
              <CardBody>
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Fun fact:</span>{" "}
                  {mapStop.funFact}
                </p>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card>
            <CardBody className="text-center py-4">
              <Target className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {stats.totalCorrect} / {stats.totalSeen}
              </div>
              <p className="text-xs text-gray-500">Correct / Seen</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <Brain className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {formatConfidence(stats.averageConfidence)}
              </div>
              <p className="text-xs text-gray-500">Avg Confidence</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {stats.dueForReview}
              </div>
              <p className="text-xs text-gray-500">Due for Review</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {stats.totalQuestions}
              </div>
              <p className="text-xs text-gray-500">Total Questions</p>
            </CardBody>
          </Card>
        </motion.div>

        {/* Start Practice Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() =>
              router.push(
                `/quiz?type=quick_quiz&track=written_knowledge&category=${slug}`
              )
            }
          >
            <BookOpen className="w-5 h-5" />
            Start Practice
          </Button>
        </motion.div>

        {/* Question List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 px-1">
            Questions ({categoryQuestions.length})
          </h2>
          {categoryQuestions.map((q, i) => {
            const p = progress[q.id];
            const box: LeitnerBox = p?.leitnerBox ?? 1;
            const dotColor = getLeitnerDotColor(box);
            const label = getLeitnerLabel(box);

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.4 + i * 0.03 }}
              >
                <Card hover>
                  <CardBody className="flex items-start gap-3 py-3">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-3 h-3 rounded-full ${dotColor}`}
                        title={`Box ${box}: ${label}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">
                        {q.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          Box {box} - {label}
                        </span>
                        {p && (
                          <span className="text-xs text-gray-400">
                            {p.timesCorrect}/{p.timesSeen} correct
                          </span>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
