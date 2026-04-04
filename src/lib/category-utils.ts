import type { Question, UserProgress, LeitnerBox } from "@/types";
import type { ProgressMap } from "@/hooks/useGameState";

// ============================================
// Category Name Mapping
// ============================================

const CATEGORY_NAMES: Record<string, string> = {
  road_signs: "Road Signs",
  traffic_signals: "Traffic Signals",
  right_of_way: "Right-of-Way",
  speed_limits: "Speed Limits",
  dui_laws: "DUI & Impaired Driving",
  parking_rules: "Parking Rules",
  sharing_road: "Sharing the Road",
  adverse_conditions: "Adverse Conditions",
  insurance_equipment: "Insurance & Equipment",
  gdl_restrictions: "GDL Restrictions",
  utah_specific: "Utah-Specific Laws",
};

/**
 * Maps a category slug to its display name.
 * Falls back to title-casing the slug if not found in the map.
 */
export function getCategoryName(slug: string): string {
  if (CATEGORY_NAMES[slug]) {
    return CATEGORY_NAMES[slug];
  }
  // Fallback: replace underscores with spaces and title case
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Filters questions by category slug.
 */
export function getCategoryQuestions(
  slug: string,
  questions: Question[]
): Question[] {
  return questions.filter((q) => q.categoryId === slug);
}

/**
 * Computes aggregate stats for a category from the user's progress map.
 */
export function getCategoryStats(
  slug: string,
  questions: Question[],
  progress: ProgressMap
): {
  seen: number;
  mastered: number;
  dueForReview: number;
  totalCorrect: number;
  totalSeen: number;
  totalQuestions: number;
  averageConfidence: number;
  masteryPercent: number;
} {
  const categoryQuestions = getCategoryQuestions(slug, questions);
  const totalQuestions = categoryQuestions.length;

  let seen = 0;
  let mastered = 0;
  let dueForReview = 0;
  let totalCorrect = 0;
  let totalSeen = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;

  const now = new Date();

  for (const q of categoryQuestions) {
    const p = progress[q.id];
    if (!p) continue;

    seen++;
    totalCorrect += p.timesCorrect;
    totalSeen += p.timesSeen;

    if (p.leitnerBox >= 4) {
      mastered++;
    }

    if (p.nextReview && new Date(p.nextReview) <= now) {
      dueForReview++;
    }

    if (p.lastConfidence) {
      confidenceCount++;
      if (p.lastConfidence === "sure") confidenceSum += 3;
      else if (p.lastConfidence === "unsure") confidenceSum += 2;
      else confidenceSum += 1; // guess
    }
  }

  const averageConfidence =
    confidenceCount > 0 ? confidenceSum / confidenceCount : 0;

  const masteryPercent =
    totalQuestions > 0 ? Math.round((mastered / totalQuestions) * 100) : 0;

  return {
    seen,
    mastered,
    dueForReview,
    totalCorrect,
    totalSeen,
    totalQuestions,
    averageConfidence,
    masteryPercent,
  };
}
