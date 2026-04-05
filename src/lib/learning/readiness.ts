import type { UserProgress, ReadinessScore } from "@/types";
import {
  calculateCategoryMastery,
  calculateReadinessScore,
  getReadinessPrediction,
} from "./leitner";

interface CategoryInfo {
  slug: string;
  name: string;
}

/**
 * Generate a full readiness report for a user.
 * This is the "Am I ready to pass?" feature.
 */
export function generateReadinessReport(
  progressByCategory: Record<string, UserProgress[]>,
  categories: CategoryInfo[]
): ReadinessScore {
  const byCategory: Record<string, number> = {};

  for (const category of categories) {
    const progress = progressByCategory[category.slug] ?? [];
    byCategory[category.slug] = calculateCategoryMastery(progress);
  }

  const overall = calculateReadinessScore(byCategory);
  const prediction = getReadinessPrediction(overall);

  // Find weak and strong areas
  const sortedCategories = categories
    .map((c) => ({ slug: c.slug, name: c.name, mastery: byCategory[c.slug] ?? 0 }))
    .sort((a, b) => a.mastery - b.mastery);

  const weakAreas = sortedCategories
    .filter((c) => c.mastery < 60)
    .slice(0, 3)
    .map((c) => c.name);

  const strongAreas = sortedCategories
    .filter((c) => c.mastery >= 80)
    .slice(-3)
    .map((c) => c.name);

  const recommendation = generateRecommendation(overall, weakAreas, prediction);

  return {
    overall,
    byCategory,
    prediction,
    weakAreas,
    strongAreas,
    recommendation,
  };
}

function generateRecommendation(
  score: number,
  weakAreas: string[],
  prediction: ReadinessScore["prediction"]
): string {
  switch (prediction) {
    case "very_ready":
      return "You're ready to pass! Consider taking the test soon while the material is fresh.";
    case "ready":
      return `Looking good! A few more practice sessions on ${weakAreas[0] ?? "your weak areas"} and you'll be very confident.`;
    case "almost":
      return `Almost there! Focus on ${weakAreas.slice(0, 2).join(" and ")}. These topics appear frequently on the test.`;
    case "not_ready":
      return `Keep studying! Focus on ${weakAreas[0] ?? "the topics below"} first. It's the area with the most room for improvement.`;
  }
}

/**
 * Calculate streak status and update.
 */
export function updateStreak(
  currentStreak: number,
  longestStreak: number,
  lastStudyDate: string | null,
  questionsAnsweredToday: number,
  minimumQuestions: number = 5
): { currentStreak: number; longestStreak: number } {
  // Must answer at least 5 questions to count for streak
  if (questionsAnsweredToday < minimumQuestions) {
    return { currentStreak, longestStreak };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastStudyDate) {
    return { currentStreak: 1, longestStreak: Math.max(1, longestStreak) };
  }

  const lastDate = new Date(lastStudyDate);
  lastDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    // Same day, already counted
    return { currentStreak, longestStreak };
  }

  if (diffDays === 1) {
    // Consecutive day — extend streak
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, longestStreak),
    };
  }

  // Missed a day — reset streak
  return { currentStreak: 1, longestStreak };
}
