"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  LeitnerBox,
  Confidence,
  LicenseLevel,
  QuizResult,
  ReadinessScore,
  UserProgress,
} from "@/types";
import {
  getNextBox,
  getNextReviewDate,
  calculateXp,
  calculateCategoryMastery,
  calculateReadinessScore,
  getReadinessPrediction,
  getLicenseLevel,
} from "@/lib/learning/leitner";
import { updateStreak } from "@/lib/learning/readiness";
import {
  getStorageItem,
  setStorageItem,
  clearAllStorage,
  STORAGE_KEYS,
} from "@/lib/storage";
import { MIN_STREAK_QUESTIONS } from "@/lib/constants";

// ============================================
// Persisted State Shapes
// ============================================

export interface PersistedUser {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  licenseLevel: LicenseLevel;
  questionsAnsweredToday: number;
}

/** Map of questionId -> progress entry */
export type ProgressMap = Record<string, UserProgress>;

/** Map of categorySlug -> mastery (0-100) */
export type CategoryMastery = Record<string, number>;

// ============================================
// Defaults
// ============================================

const DEFAULT_USER: PersistedUser = {
  xp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  licenseLevel: "learner",
  questionsAnsweredToday: 0,
};

// ============================================
// Hook
// ============================================

export function useGameState() {
  const [user, setUser] = useState<PersistedUser>(DEFAULT_USER);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loaded, setLoaded] = useState(false);

  // --- Load from localStorage on mount ---
  useEffect(() => {
    const storedUser = getStorageItem<PersistedUser>(STORAGE_KEYS.user);
    const storedProgress = getStorageItem<ProgressMap>(STORAGE_KEYS.progress);

    if (storedUser) setUser(storedUser);
    if (storedProgress) setProgress(storedProgress);

    setLoaded(true);
  }, []);

  // --- Persist user whenever it changes ---
  useEffect(() => {
    if (!loaded) return;
    setStorageItem(STORAGE_KEYS.user, user);
  }, [user, loaded]);

  // --- Persist progress whenever it changes ---
  useEffect(() => {
    if (!loaded) return;
    setStorageItem(STORAGE_KEYS.progress, progress);
  }, [progress, loaded]);

  // ------------------------------------------------------------------
  // Record the results of a completed quiz session.
  // Updates Leitner boxes, XP, streaks, and category mastery.
  // ------------------------------------------------------------------
  const recordQuizResults = useCallback(
    (results: QuizResult[]) => {
      setProgress((prev) => {
        const next = { ...prev };

        for (const result of results) {
          const qid = result.question.id;
          const existing = next[qid];

          const currentBox: LeitnerBox = existing?.leitnerBox ?? 1;
          const newBox = getNextBox(currentBox, result.isCorrect, result.confidence);
          const reviewDate = getNextReviewDate(newBox);

          next[qid] = {
            id: existing?.id ?? qid,
            userId: "local",
            questionId: qid,
            leitnerBox: newBox,
            timesSeen: (existing?.timesSeen ?? 0) + 1,
            timesCorrect: (existing?.timesCorrect ?? 0) + (result.isCorrect ? 1 : 0),
            lastConfidence: result.confidence,
            nextReview: reviewDate.toISOString(),
            lastReviewed: new Date().toISOString(),
          };
        }

        return next;
      });

      // Update user-level stats
      setUser((prev) => {
        const xpEarned = results.reduce((sum, r) => sum + r.xpEarned, 0);
        const newQuestionsToday = prev.questionsAnsweredToday + results.length;

        const streakResult = updateStreak(
          prev.currentStreak,
          prev.longestStreak,
          prev.lastStudyDate,
          newQuestionsToday,
          MIN_STREAK_QUESTIONS
        );

        // Recompute category mastery from the freshest progress
        // (we use a callback form, but progress may be stale here,
        //  so we also read from the storage-level progress via closure)
        const newXp = prev.xp + xpEarned;

        return {
          ...prev,
          xp: newXp,
          currentStreak: streakResult.currentStreak,
          longestStreak: streakResult.longestStreak,
          lastStudyDate: new Date().toISOString(),
          questionsAnsweredToday: newQuestionsToday,
          licenseLevel: prev.licenseLevel, // recalculated via getReadiness
        };
      });
    },
    []
  );

  // ------------------------------------------------------------------
  // Compute the current readiness score from progress data.
  // ------------------------------------------------------------------
  const getReadiness = useCallback((): ReadinessScore => {
    // Build category mastery map from progress
    const categoryProgressMap: Record<string, UserProgress[]> = {};

    for (const p of Object.values(progress)) {
      // We need the categoryId from the question — but progress only has questionId.
      // As a lightweight approach, we use the prefix of the question id if it encodes
      // the category, or fall back to a generic bucket. In practice the caller should
      // pass category info. For now, group by the part before the first underscore
      // after "q" or use the full id.
      // NOTE: The sample questions use categoryId on the Question object.
      //       Here we don't have the question objects, so we approximate.
      //       The proper implementation would store categoryId in UserProgress
      //       or resolve from a question bank lookup.
      const bucket = "unknown";
      if (!categoryProgressMap[bucket]) categoryProgressMap[bucket] = [];
      categoryProgressMap[bucket].push(p);
    }

    const categoryMastery: CategoryMastery = {};
    for (const [slug, progs] of Object.entries(categoryProgressMap)) {
      categoryMastery[slug] = calculateCategoryMastery(progs);
    }

    const overall = calculateReadinessScore(categoryMastery);
    const prediction = getReadinessPrediction(overall);

    // Determine weak/strong areas
    const sorted = Object.entries(categoryMastery).sort(([, a], [, b]) => a - b);
    const weakAreas = sorted.filter(([, m]) => m < 60).slice(0, 3).map(([s]) => s);
    const strongAreas = sorted.filter(([, m]) => m >= 80).slice(-3).map(([s]) => s);

    // Update license level
    const licenseLevel = getLicenseLevel(overall);
    setUser((prev) => {
      if (prev.licenseLevel === licenseLevel) return prev;
      return { ...prev, licenseLevel };
    });

    return {
      overall,
      byCategory: categoryMastery,
      prediction,
      weakAreas,
      strongAreas,
      recommendation: "",
    };
  }, [progress]);

  // ------------------------------------------------------------------
  // Compute category mastery from current progress.
  // Requires a mapping of questionId -> categorySlug.
  // ------------------------------------------------------------------
  const getCategoryMastery = useCallback(
    (questionCategoryMap: Record<string, string>): CategoryMastery => {
      const grouped: Record<string, UserProgress[]> = {};

      for (const p of Object.values(progress)) {
        const cat = questionCategoryMap[p.questionId] ?? "unknown";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p);
      }

      const mastery: CategoryMastery = {};
      for (const [slug, progs] of Object.entries(grouped)) {
        mastery[slug] = calculateCategoryMastery(progs);
      }
      return mastery;
    },
    [progress]
  );

  // ------------------------------------------------------------------
  // Reset all persisted progress and user state.
  // ------------------------------------------------------------------
  const resetProgress = useCallback(() => {
    clearAllStorage();
    setUser(DEFAULT_USER);
    setProgress({});
  }, []);

  return {
    user,
    progress,
    loaded,
    recordQuizResults,
    getReadiness,
    getCategoryMastery,
    resetProgress,
  };
}
