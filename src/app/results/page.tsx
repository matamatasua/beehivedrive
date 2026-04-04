"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuizSummary } from "@/components/quiz/QuizSummary";
import { useGameState } from "@/hooks/useGameState";
import type { GameState, QuizResult, Track } from "@/types";

export default function ResultsPage() {
  const router = useRouter();
  const { user } = useGameState();

  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [track, setTrack] = useState<Track>("written_knowledge");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("beehive_last_results");
      const savedTrack = sessionStorage.getItem("beehive_last_track") as Track | null;
      if (raw) {
        setResults(JSON.parse(raw) as QuizResult[]);
        if (savedTrack) setTrack(savedTrack);
      }
    } catch {
      // sessionStorage unavailable
    }
    setChecked(true);
  }, []);

  // Redirect to dashboard if no results are available
  useEffect(() => {
    if (checked && !results) {
      router.replace("/dashboard");
    }
  }, [checked, results, router]);

  if (!checked || !results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">🐝</span>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Build a lightweight GameState from user data + results for the summary
  const correctCount = results.filter((r) => r.isCorrect).length;
  const gameState: GameState = {
    lives: 3, // default; exact value is not persisted across navigation
    maxLives: 3,
    currentXp: user.xp,
    comboCount: 0,
    comboMultiplier: 1,
    questionsAnswered: results.length,
    questionsCorrect: correctCount,
    sessionType: "quick_quiz",
  };

  // Find weak categories from results
  const weakCategories: string[] = [];
  const categoryMisses: Record<string, { missed: number; total: number }> = {};
  for (const result of results) {
    const cat = result.question.categoryId;
    if (!categoryMisses[cat]) categoryMisses[cat] = { missed: 0, total: 0 };
    categoryMisses[cat].total++;
    if (!result.isCorrect) categoryMisses[cat].missed++;
  }
  for (const [cat, stats] of Object.entries(categoryMisses)) {
    if (stats.missed > 0) weakCategories.push(cat);
  }

  function handleClose() {
    router.push("/dashboard");
  }

  function handlePracticeWeak() {
    const params = new URLSearchParams({
      type: "quick_quiz",
      track: "written_knowledge",
    });
    if (weakCategories.length === 1) {
      params.set("category", weakCategories[0]);
    }
    router.push(`/quiz?${params.toString()}`);
  }

  return (
    <ResultsView
      results={results}
      gameState={gameState}
      track={track}
      weakCategories={weakCategories}
      onClose={handleClose}
      onPracticeWeak={handlePracticeWeak}
    />
  );
}

/**
 * Wrapper that renders QuizSummary and intercepts the "Practice Weak Areas"
 * button click via the onClose callback. The QuizSummary component uses a
 * single onClose prop, so we wrap it to add the practice-weak navigation.
 */
function ResultsView({
  results,
  gameState,
  track,
  weakCategories,
  onClose,
  onPracticeWeak,
}: {
  results: QuizResult[];
  gameState: GameState;
  track: Track;
  weakCategories: string[];
  onClose: () => void;
  onPracticeWeak: () => void;
}) {
  return (
    <QuizSummary
      results={results}
      gameState={gameState}
      track={track}
      onClose={onClose}
    />
  );
}
