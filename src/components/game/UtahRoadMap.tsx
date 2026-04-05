"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Flag } from "lucide-react";
import { MAP_STOPS } from "@/lib/constants";
import { getCategoryName } from "@/lib/category-utils";
import { SAMPLE_QUESTIONS } from "@/lib/sample-questions";

// Build question count per category from the question bank
const questionCountByCategory: Record<string, number> = {};
for (const q of SAMPLE_QUESTIONS) {
  questionCountByCategory[q.categoryId] =
    (questionCountByCategory[q.categoryId] ?? 0) + 1;
}

interface UtahRoadMapProps {
  categoryMastery: Record<string, number>;
  totalQuestionsStudied: number;
  onSelectCategory: (slug: string) => void;
}

type StopStatus = "mastered" | "in_progress" | "not_started";

function getStopStatus(
  mastery: number,
  totalQuestionsStudied: number
): StopStatus {
  if (mastery >= 80) return "mastered";
  if (mastery >= 40 && totalQuestionsStudied > 10) return "in_progress";
  return "not_started";
}

function getStatusLabel(status: StopStatus): string {
  switch (status) {
    case "mastered":
      return "Mastered";
    case "in_progress":
      return "In Progress";
    case "not_started":
      return "Not Started";
  }
}

function getStatusColor(status: StopStatus): string {
  switch (status) {
    case "mastered":
      return "#22C55E";
    case "in_progress":
      return "#F59E0B";
    case "not_started":
      return "#D1D5DB";
  }
}

export function UtahRoadMap({
  categoryMastery,
  totalQuestionsStudied,
  onSelectCategory,
}: UtahRoadMapProps) {
  // Separate regular stops from the final exam
  const regularStops = MAP_STOPS.filter((s) => s.slug !== "final_exam");
  const finalStop = MAP_STOPS.find((s) => s.slug === "final_exam")!;

  // Build status for each regular stop
  const stops = regularStops.map((stop) => {
    const mastery = categoryMastery[stop.slug] ?? 0;
    const status = getStopStatus(mastery, totalQuestionsStudied);
    return { ...stop, mastery, status };
  });

  // Find first non-mastered stop for "YOU ARE HERE" marker
  const youAreHereIndex = stops.findIndex((s) => s.status !== "mastered");

  // Final exam: only highlight when all other categories >= 60
  const allCategoriesReady = stops.every(
    (s) => (categoryMastery[s.slug] ?? 0) >= 60
  );
  const finalMastery = categoryMastery[finalStop.slug] ?? 0;
  const finalStatus: StopStatus =
    finalMastery >= 80 ? "mastered" : "not_started";

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        {stops.map((stop, index) => {
          const isYouAreHere = index === youAreHereIndex;
          const lineColor = getStatusColor(stop.status);

          return (
            <motion.div
              key={stop.slug}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <button
                onClick={() => onSelectCategory(stop.slug)}
                className="w-full flex items-start gap-3 py-3 px-2 rounded-lg text-left transition-colors hover:bg-amber-50/60 cursor-pointer group"
              >
                {/* Left column: dot + connecting line */}
                <div className="relative flex flex-col items-center shrink-0 w-6">
                  {/* The dot */}
                  <div className="relative">
                    {stop.status === "mastered" ? (
                      <CheckCircle2
                        size={22}
                        className="text-green-500"
                        fill="currentColor"
                        stroke="white"
                      />
                    ) : stop.status === "in_progress" ? (
                      <div className="relative">
                        <Circle
                          size={22}
                          className="text-amber-500"
                          fill="currentColor"
                          stroke="white"
                        />
                        {isYouAreHere && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <Circle size={22} className="text-gray-300" />
                        {isYouAreHere && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Connecting line to next stop */}
                  {index < stops.length && (
                    <div
                      className="w-0.5 flex-1 min-h-7"
                      style={{ backgroundColor: lineColor }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-900 text-sm group-hover:text-amber-700 transition-colors">
                        {stop.city}
                      </span>
                      <span className="text-gray-400 text-sm mx-1">:</span>
                      <span className="text-sm text-gray-600">
                        {getCategoryName(stop.slug)}
                      </span>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`
                        shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap
                        ${
                          stop.status === "mastered"
                            ? "bg-green-100 text-green-700"
                            : stop.status === "in_progress"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                        }
                      `}
                    >
                      {stop.status === "mastered" && "✓ "}
                      {getStatusLabel(stop.status)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {questionCountByCategory[stop.slug] ?? 0} questions
                    {isYouAreHere && (
                      <span className="ml-2 text-amber-600 font-medium">
                        ← YOU ARE HERE
                      </span>
                    )}
                  </p>
                </div>
              </button>
            </motion.div>
          );
        })}

        {/* Final Exam stop */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: stops.length * 0.04 }}
        >
          <button
            onClick={() => allCategoriesReady && onSelectCategory(finalStop.slug)}
            className={`
              w-full flex items-start gap-3 py-3 px-2 rounded-lg text-left transition-colors
              ${
                allCategoriesReady
                  ? "hover:bg-amber-50/60 cursor-pointer group"
                  : "opacity-60 cursor-not-allowed"
              }
            `}
            disabled={!allCategoriesReady}
          >
            {/* Left column: finish flag */}
            <div className="relative flex flex-col items-center shrink-0 w-6">
              <div className="flex items-center justify-center w-5.5 h-5.5">
                <Flag
                  size={18}
                  className={
                    finalStatus === "mastered"
                      ? "text-green-500"
                      : allCategoriesReady
                      ? "text-amber-500"
                      : "text-gray-300"
                  }
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span
                    className={`font-semibold text-sm ${
                      allCategoriesReady
                        ? "text-gray-900 group-hover:text-amber-700"
                        : "text-gray-400"
                    } transition-colors`}
                  >
                    {finalStop.city}
                  </span>
                  <span className="text-gray-400 text-sm mx-1">:</span>
                  <span className="text-sm text-gray-500">Final Exam</span>
                </div>

                <span
                  className={`
                    shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap
                    ${
                      finalStatus === "mastered"
                        ? "bg-green-100 text-green-700"
                        : allCategoriesReady
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                    }
                  `}
                >
                  {finalStatus === "mastered"
                    ? "✓ Mastered"
                    : allCategoriesReady
                    ? "Ready"
                    : "Locked"}
                </span>
              </div>

              <p className="text-xs text-gray-400 mt-0.5">
                {allCategoriesReady
                  ? "All topics covered — take the final!"
                  : "Score 60%+ on all topics to unlock"}
              </p>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
