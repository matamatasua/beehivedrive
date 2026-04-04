"use client";

import { motion } from "framer-motion";
import { Lock, CheckCircle2, MapPin } from "lucide-react";
import { MAP_STOPS } from "@/lib/constants";

interface UtahRoadMapProps {
  categoryMastery: Record<string, number>;
  currentCategory?: string;
  onSelectCategory: (slug: string) => void;
}

function getMasteryColor(mastery: number): string {
  if (mastery >= 80) return "#22C55E"; // green
  if (mastery >= 40) return "#F59E0B"; // amber
  if (mastery > 0) return "#FB923C";   // orange
  return "#D1D5DB";                     // gray
}

function getMasteryLabel(mastery: number): string {
  if (mastery >= 80) return "Mastered";
  if (mastery >= 40) return "Learning";
  if (mastery > 0) return "Started";
  return "Locked";
}

export function UtahRoadMap({
  categoryMastery,
  currentCategory,
  onSelectCategory,
}: UtahRoadMapProps) {
  // Determine which stops are unlocked
  // First stop is always unlocked, subsequent unlock when previous hits 40%
  const stops = MAP_STOPS.map((stop, index) => {
    const mastery = categoryMastery[stop.slug] ?? 0;
    const isUnlocked =
      index === 0 ||
      stop.slug === "final_exam"
        ? Object.values(categoryMastery).every((m) => m >= 60)
        : index === 0 || (categoryMastery[MAP_STOPS[index - 1].slug] ?? 0) >= 40;

    return { ...stop, mastery, isUnlocked };
  });

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
        Your Utah Road Trip
      </h3>

      <div className="space-y-3">
        {stops.map((stop, index) => {
          const isActive = stop.slug === currentCategory;
          const isFinal = stop.slug === "final_exam";

          return (
            <motion.button
              key={stop.slug}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              disabled={!stop.isUnlocked}
              onClick={() => stop.isUnlocked && onSelectCategory(stop.slug)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${!stop.isUnlocked
                  ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                  : isActive
                  ? "border-amber-500 bg-amber-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm cursor-pointer"
                }
                ${isFinal ? "border-dashed" : ""}
              `}
            >
              {/* Stop marker */}
              <div
                className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                  ${isFinal ? "bg-amber-100" : ""}
                `}
                style={{
                  backgroundColor: !isFinal ? `${getMasteryColor(stop.mastery)}20` : undefined,
                  borderWidth: 2,
                  borderColor: getMasteryColor(stop.mastery),
                }}
              >
                {!stop.isUnlocked ? (
                  <Lock size={16} className="text-gray-400" />
                ) : stop.mastery >= 80 ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : isFinal ? (
                  <span className="text-lg">🏁</span>
                ) : (
                  <MapPin size={16} style={{ color: getMasteryColor(stop.mastery) }} />
                )}
              </div>

              {/* Stop info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    {stop.city}
                  </span>
                  {stop.mastery > 0 && stop.mastery < 80 && (
                    <span className="text-xs font-medium text-amber-600">
                      {stop.mastery}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {stop.isUnlocked ? stop.funFact : "Complete previous topics to unlock"}
                </p>
              </div>

              {/* Mastery badge */}
              {stop.isUnlocked && (
                <span
                  className={`
                    flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full
                    ${stop.mastery >= 80
                      ? "bg-green-100 text-green-700"
                      : stop.mastery >= 40
                      ? "bg-amber-100 text-amber-700"
                      : stop.mastery > 0
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-500"
                    }
                  `}
                >
                  {getMasteryLabel(stop.mastery)}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Connecting line */}
      <div className="absolute left-[2.25rem] top-16 bottom-8 w-0.5 bg-gray-200 -z-10" />
    </div>
  );
}
