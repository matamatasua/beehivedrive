"use client";

import { useMemo } from "react";
import type { Question, SessionType, Track, UserProgress } from "@/types";
import { selectSessionQuestions } from "@/lib/learning/leitner";
import { SESSION_SIZES } from "@/lib/constants";
import { SAMPLE_QUESTIONS } from "@/lib/sample-questions";
import type { ProgressMap } from "./useGameState";

// ============================================
// Helpers
// ============================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Resolve the session size from SESSION_SIZES.
 * For exam_sim the size depends on the track, so we handle that mapping.
 */
function getSessionSize(sessionType: SessionType, track: Track): number {
  if (sessionType === "exam_sim") {
    return track === "traffic_safety"
      ? SESSION_SIZES.exam_sim_traffic_safety
      : SESSION_SIZES.exam_sim_written_original;
  }

  return SESSION_SIZES[sessionType] ?? 10;
}

// ============================================
// Hook
// ============================================

interface UseQuestionsOptions {
  sessionType: SessionType;
  track: Track;
  categorySlug?: string;
  progress: ProgressMap;
  /** Optional full question bank. Falls back to SAMPLE_QUESTIONS. */
  questionBank?: Question[];
}

/**
 * Returns a properly sized and ordered set of questions for a quiz session.
 *
 * Uses the Leitner engine to prioritise due reviews and new questions.
 * Falls back to shuffled sample questions when there is not enough progress data.
 */
export function useQuestions({
  sessionType,
  track,
  categorySlug,
  progress,
  questionBank,
}: UseQuestionsOptions): Question[] {
  return useMemo(() => {
    const bank = questionBank ?? SAMPLE_QUESTIONS;
    const sessionSize = getSessionSize(sessionType, track);

    // Filter the bank to the requested track (and optionally category)
    const eligible = bank.filter((q) => {
      if (q.track !== track) return false;
      if (categorySlug && q.categoryId !== categorySlug) return false;
      return true;
    });

    if (eligible.length === 0) {
      // Nothing matches filters — fall back to any questions in the bank
      return shuffleArray(bank).slice(0, sessionSize);
    }

    // Build arrays the Leitner selector expects
    const allProgress: UserProgress[] = [];
    const unseenIds: string[] = [];

    for (const q of eligible) {
      const p = progress[q.id];
      if (p) {
        allProgress.push(p);
      } else {
        unseenIds.push(q.id);
      }
    }

    // Use Leitner-based selection when we have any progress data
    let selectedIds: string[];

    if (allProgress.length > 0) {
      selectedIds = selectSessionQuestions(allProgress, unseenIds, sessionSize);
    } else {
      // No progress at all — just shuffle eligible questions
      selectedIds = shuffleArray(eligible.map((q) => q.id)).slice(0, sessionSize);
    }

    // If the Leitner engine returned fewer than sessionSize (small bank),
    // pad with shuffled eligible questions not already selected
    if (selectedIds.length < sessionSize) {
      const selectedSet = new Set(selectedIds);
      const extras = shuffleArray(
        eligible.filter((q) => !selectedSet.has(q.id)).map((q) => q.id)
      );
      for (const id of extras) {
        if (selectedIds.length >= sessionSize) break;
        selectedIds.push(id);
      }
    }

    // Map ids back to Question objects, preserving the selected order
    const idToQuestion = new Map(eligible.map((q) => [q.id, q]));
    return selectedIds
      .map((id) => idToQuestion.get(id))
      .filter((q): q is Question => q !== undefined);
  }, [sessionType, track, categorySlug, progress, questionBank]);
}
