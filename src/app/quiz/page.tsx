"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuizSession } from "@/components/quiz/QuizSession";
import { useGameState } from "@/hooks/useGameState";
import { useQuestions } from "@/hooks/useQuestions";
import type { SessionType, Track, QuizResult } from "@/types";

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionType = (searchParams.get("type") ?? "quick_quiz") as SessionType;
  const track = (searchParams.get("track") ?? "written_knowledge") as Track;
  const categorySlug = searchParams.get("category") ?? undefined;

  const { user, progress, loaded, recordQuizResults } = useGameState();

  const questions = useQuestions({
    sessionType,
    track,
    categorySlug,
    progress,
  });

  const handleComplete = useCallback(
    (results: QuizResult[]) => {
      recordQuizResults(results);
      try {
        sessionStorage.setItem("beehive_last_results", JSON.stringify(results));
        sessionStorage.setItem("beehive_last_track", track);
      } catch {
        // sessionStorage may be unavailable
      }
      router.push("/results");
    },
    [recordQuizResults, router, track]
  );

  const handleExit = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">🐝</span>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QuizSession
      questions={questions}
      sessionType={sessionType}
      track={track}
      userXp={user.xp}
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl">🐝</span>
            <p className="text-gray-500 mt-2">Loading quiz...</p>
          </div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
