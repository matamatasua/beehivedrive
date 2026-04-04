// ============================================
// Achievement Checking Logic
// ============================================

import type { QuizResult } from "@/types";
import type { PersistedUser, ProgressMap, CategoryMastery } from "@/hooks/useGameState";
import { ACHIEVEMENTS } from "@/lib/constants";

export interface AchievementCheckContext {
  user: PersistedUser;
  progress: ProgressMap;
  earnedAchievements: string[];
  latestResults?: QuizResult[];
  latestSessionType?: string;
  latestTrack?: string;
  categoryMastery?: CategoryMastery;
}

/** IDs that are not yet checkable — criteria require features not yet built */
const NOT_YET_CHECKABLE = new Set(["sign_sage", "numbers_ninja", "boss_slayer"]);

/**
 * Check all achievements against the current context and return an array of
 * achievement IDs that were newly earned (i.e. not already in earnedAchievements).
 */
export function checkAchievements(ctx: AchievementCheckContext): string[] {
  const newlyEarned: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip already-earned
    if (ctx.earnedAchievements.includes(achievement.id)) continue;
    // Skip not-yet-checkable
    if (NOT_YET_CHECKABLE.has(achievement.id)) continue;

    if (isEarned(achievement.id, ctx)) {
      newlyEarned.push(achievement.id);
    }
  }

  return newlyEarned;
}

function isEarned(id: string, ctx: AchievementCheckContext): boolean {
  switch (id) {
    case "road_scholar":
      return checkRoadScholar(ctx);
    case "bee_line":
      return checkBeeLine(ctx);
    case "streak_7":
      return ctx.user.currentStreak >= 7;
    case "streak_30":
      return ctx.user.currentStreak >= 30;
    case "speed_demon":
      return checkSpeedDemon(ctx);
    case "ready_to_drive":
      return checkReadyToDrive(ctx);
    case "perfect_safety":
      return checkPerfectSafety(ctx);
    default:
      return false;
  }
}

/** road_scholar: All road_signs questions have leitnerBox >= 4 */
function checkRoadScholar(ctx: AchievementCheckContext): boolean {
  const roadSignEntries = Object.values(ctx.progress).filter((p) =>
    p.questionId.startsWith("road_signs")
  );
  // Need at least 1 road sign question tracked
  if (roadSignEntries.length === 0) return false;
  return roadSignEntries.every((p) => p.leitnerBox >= 4);
}

/** bee_line: latestResults 100% accuracy, practice or exam_sim session */
function checkBeeLine(ctx: AchievementCheckContext): boolean {
  if (!ctx.latestResults || ctx.latestResults.length === 0) return false;
  if (ctx.latestSessionType !== "practice" && ctx.latestSessionType !== "exam_sim") {
    return false;
  }
  return ctx.latestResults.every((r) => r.isCorrect);
}

/** speed_demon: latestResults 90%+ accuracy, quick_quiz session */
function checkSpeedDemon(ctx: AchievementCheckContext): boolean {
  if (!ctx.latestResults || ctx.latestResults.length === 0) return false;
  if (ctx.latestSessionType !== "quick_quiz") return false;
  const accuracy =
    ctx.latestResults.filter((r) => r.isCorrect).length / ctx.latestResults.length;
  return accuracy >= 0.9;
}

/** ready_to_drive: readiness >= 90% from categoryMastery */
function checkReadyToDrive(ctx: AchievementCheckContext): boolean {
  if (!ctx.categoryMastery) return false;
  const values = Object.values(ctx.categoryMastery);
  if (values.length === 0) return false;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return avg >= 90;
}

/** perfect_safety: latestResults 100%, traffic_safety track */
function checkPerfectSafety(ctx: AchievementCheckContext): boolean {
  if (!ctx.latestResults || ctx.latestResults.length === 0) return false;
  if (ctx.latestTrack !== "traffic_safety") return false;
  return ctx.latestResults.every((r) => r.isCorrect);
}
