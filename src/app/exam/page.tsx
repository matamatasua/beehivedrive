"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExamSimulator } from "@/components/exam/ExamSimulator";
import { ExamResults } from "@/components/exam/ExamResults";
import type { ExamResult } from "@/components/exam/ExamSimulator";
import { useQuestions } from "@/hooks/useQuestions";
import { useGameState } from "@/hooks/useGameState";
import type { Track } from "@/types";
import {
  PASSING_SCORE_WRITTEN,
  PASSING_SCORE_TRAFFIC_SAFETY,
} from "@/lib/constants";

// ============================================
// Config
// ============================================

function getExamConfig(track: Track) {
  if (track === "traffic_safety") {
    return {
      questionCount: 40,
      timeLimit: 20 * 60, // 20 minutes
      passingScore: PASSING_SCORE_TRAFFIC_SAFETY, // 1.0
    };
  }
  return {
    questionCount: 50,
    timeLimit: 30 * 60, // 30 minutes
    passingScore: PASSING_SCORE_WRITTEN, // 0.8
  };
}

// ============================================
// Inner content (uses useSearchParams)
// ============================================

function ExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const track = (searchParams.get("track") ?? "written_knowledge") as Track;
  const config = getExamConfig(track);

  const { progress, loaded } = useGameState();

  const questions = useQuestions({
    sessionType: "exam_sim",
    track,
    progress,
  });

  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [key, setKey] = useState(0); // for retry resets

  const handleComplete = useCallback((result: ExamResult) => {
    setExamResult(result);
  }, []);

  const handleExit = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleRetry = useCallback(() => {
    setExamResult(null);
    setKey((k) => k + 1); // force remount to get fresh questions
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">🐝</span>
          <p className="text-slate-500 mt-2">Preparing exam...</p>
        </div>
      </div>
    );
  }

  // Show results if exam is complete
  if (examResult) {
    return (
      <ExamResults
        result={examResult}
        questions={questions}
        passingScore={config.passingScore}
        timeLimit={config.timeLimit}
        onRetry={handleRetry}
        onDashboard={handleExit}
      />
    );
  }

  // Show the exam
  return (
    <ExamSimulator
      key={key}
      questions={questions}
      track={track}
      timeLimit={config.timeLimit}
      passingScore={config.passingScore}
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
}

// ============================================
// Page (wrapped in Suspense for useSearchParams)
// ============================================

export default function ExamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl">🐝</span>
            <p className="text-slate-500 mt-2">Loading exam...</p>
          </div>
        </div>
      }
    >
      <ExamContent />
    </Suspense>
  );
}
