import type { LeitnerBox, Confidence, UserProgress } from "@/types";

// ============================================
// Leitner Box Spaced Repetition Engine
// ============================================
//
// Box 1: New/wrong questions — review every session
// Box 2: Correct once — review every 2 sessions
// Box 3: Correct twice — review every 4 sessions
// Box 4: Correct 3x — review every 8 sessions
// Box 5: Mastered (4+) — review only in boss/exam rounds

const BOX_INTERVALS_HOURS: Record<LeitnerBox, number> = {
  1: 0,      // Every session
  2: 12,     // ~half day
  3: 48,     // ~2 days
  4: 168,    // ~1 week
  5: 336,    // ~2 weeks
};

/**
 * Calculate the next Leitner box after answering a question.
 * Confidence modifies the promotion — guessing correctly doesn't promote as fast.
 */
export function getNextBox(
  currentBox: LeitnerBox,
  isCorrect: boolean,
  confidence: Confidence
): LeitnerBox {
  if (!isCorrect) {
    // Wrong answer always goes back to Box 1
    return 1;
  }

  // Correct but guessed — stay in current box (lucky, needs reinforcement)
  if (confidence === "guess") {
    return currentBox;
  }

  // Correct and unsure — promote one box (learning)
  // Correct and sure — promote one box (solid)
  const nextBox = Math.min(currentBox + 1, 5) as LeitnerBox;
  return nextBox;
}

/**
 * Calculate when a question should next be reviewed.
 */
export function getNextReviewDate(box: LeitnerBox): Date {
  const now = new Date();
  const hoursUntilReview = BOX_INTERVALS_HOURS[box];
  return new Date(now.getTime() + hoursUntilReview * 60 * 60 * 1000);
}

/**
 * Check if a question is due for review.
 */
export function isDueForReview(progress: UserProgress): boolean {
  if (!progress.nextReview) return true;
  return new Date(progress.nextReview) <= new Date();
}

/**
 * Calculate XP earned for answering a question.
 * Higher boxes earn less XP (diminishing returns on mastered content).
 */
export function calculateXp(
  isCorrect: boolean,
  box: LeitnerBox,
  comboCount: number,
  confidence: Confidence
): number {
  if (!isCorrect) return 0;

  // Base XP decreases with mastery to prevent farming easy questions
  const baseXp: Record<LeitnerBox, number> = {
    1: 10,
    2: 8,
    3: 6,
    4: 4,
    5: 2,
  };

  let xp = baseXp[box];

  // Combo bonus: 3+ correct in a row
  if (comboCount >= 5) {
    xp = Math.round(xp * 2);
  } else if (comboCount >= 3) {
    xp = Math.round(xp * 1.5);
  }

  // Confidence bonus — being sure and right earns a small bonus
  if (confidence === "sure") {
    xp += 2;
  }

  return xp;
}

/**
 * Select questions for a study session.
 * Mixes due reviews with new questions, weighted toward Box 1-2.
 */
export function selectSessionQuestions(
  allProgress: UserProgress[],
  unseenQuestionIds: string[],
  sessionSize: number
): string[] {
  const selected: string[] = [];

  // 1. Get all due questions, sorted by box (lowest first = highest priority)
  const dueQuestions = allProgress
    .filter(isDueForReview)
    .sort((a, b) => a.leitnerBox - b.leitnerBox);

  // 2. Fill ~70% with review questions
  const reviewCount = Math.floor(sessionSize * 0.7);
  for (let i = 0; i < Math.min(reviewCount, dueQuestions.length); i++) {
    selected.push(dueQuestions[i].questionId);
  }

  // 3. Fill remaining ~30% with new questions
  const newCount = sessionSize - selected.length;
  const shuffledUnseen = shuffleArray([...unseenQuestionIds]);
  for (let i = 0; i < Math.min(newCount, shuffledUnseen.length); i++) {
    selected.push(shuffledUnseen[i]);
  }

  // 4. If we still don't have enough, add more due questions
  if (selected.length < sessionSize) {
    for (let i = reviewCount; i < dueQuestions.length && selected.length < sessionSize; i++) {
      if (!selected.includes(dueQuestions[i].questionId)) {
        selected.push(dueQuestions[i].questionId);
      }
    }
  }

  // 5. Shuffle to interleave topics (interleaving improves learning)
  return shuffleArray(selected);
}

/**
 * Calculate mastery percentage for a category.
 */
export function calculateCategoryMastery(
  progressInCategory: UserProgress[]
): number {
  if (progressInCategory.length === 0) return 0;

  const totalWeight = progressInCategory.length * 5; // Max box = 5
  const currentWeight = progressInCategory.reduce(
    (sum, p) => sum + p.leitnerBox,
    0
  );

  return Math.round((currentWeight / totalWeight) * 100);
}

/**
 * Calculate overall readiness score.
 * Weights topics by their representation on the real test.
 */
export function calculateReadinessScore(
  categoryMastery: Record<string, number>
): number {
  const weights: Record<string, number> = {
    road_signs: 0.20,
    right_of_way: 0.15,
    traffic_signals: 0.12,
    speed_limits: 0.10,
    parking: 0.08,
    dui_laws: 0.10,
    insurance: 0.05,
    sharing_road: 0.08,
    adverse_conditions: 0.05,
    gdl_restrictions: 0.04,
    utah_specific: 0.03,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [category, weight] of Object.entries(weights)) {
    const mastery = categoryMastery[category] ?? 0;
    weightedSum += mastery * weight;
    totalWeight += weight;
  }

  // Normalize for any categories not in the weights
  for (const [category, mastery] of Object.entries(categoryMastery)) {
    if (!(category in weights)) {
      weightedSum += mastery * 0.05;
      totalWeight += 0.05;
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Get license level based on overall mastery.
 */
export function getLicenseLevel(readinessScore: number): "learner" | "provisional" | "full" {
  if (readinessScore >= 80) return "full";
  if (readinessScore >= 40) return "provisional";
  return "learner";
}

/**
 * Get readiness prediction label.
 */
export function getReadinessPrediction(
  score: number
): "not_ready" | "almost" | "ready" | "very_ready" {
  if (score >= 90) return "very_ready";
  if (score >= 80) return "ready";
  if (score >= 65) return "almost";
  return "not_ready";
}

// --- Utility ---

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
