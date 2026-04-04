"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NumbersGauntlet } from "@/components/gauntlet/NumbersGauntlet";
import { GauntletSummary } from "@/components/gauntlet/GauntletSummary";
import { useGameState } from "@/hooks/useGameState";
import type { GauntletResult } from "@/components/gauntlet/NumbersGauntlet";

export default function GauntletPage() {
  const router = useRouter();
  const { user, loaded } = useGameState();
  const [results, setResults] = useState<GauntletResult[] | null>(null);
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);

  const handleComplete = useCallback((gauntletResults: GauntletResult[]) => {
    // Calculate session XP (mirror the gauntlet's internal XP logic)
    let xp = 0;
    let combo = 0;
    for (const r of gauntletResults) {
      if (r.isCorrect) {
        combo++;
        const multiplier = combo >= 5 ? 2 : 1;
        const bonus = combo >= 3 ? 5 : 0;
        xp += 15 * multiplier + bonus;
      } else {
        combo = 0;
      }
    }
    setSessionXp(xp);
    setResults(gauntletResults);

    try {
      sessionStorage.setItem("beehive_gauntlet_results", JSON.stringify(gauntletResults));
      sessionStorage.setItem("beehive_gauntlet_xp", String(xp));
    } catch {
      // sessionStorage may be unavailable
    }
  }, []);

  const handleExit = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleRetry = useCallback(() => {
    setResults(null);
    setSessionXp(0);
    setSessionKey((prev) => prev + 1);
  }, []);

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

  if (results) {
    return (
      <GauntletSummary
        results={results}
        sessionXp={sessionXp}
        onRetry={handleRetry}
        onDashboard={handleExit}
      />
    );
  }

  return (
    <NumbersGauntlet
      key={sessionKey}
      onComplete={handleComplete}
      onExit={handleExit}
      userXp={user.xp}
    />
  );
}
