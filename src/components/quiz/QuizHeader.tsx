"use client";

import { X } from "lucide-react";
import type { GameState } from "@/types";
import { LivesDisplay } from "@/components/game/LivesDisplay";
import { XpDisplay } from "@/components/game/XpDisplay";
import { ComboIndicator } from "@/components/game/ComboIndicator";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface QuizHeaderProps {
  gameState: GameState;
  currentQuestion: number;
  totalQuestions: number;
  onExit: () => void;
}

export function QuizHeader({
  gameState,
  currentQuestion,
  totalQuestions,
  onExit,
}: QuizHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3">
        {/* Top row: lives, XP, exit */}
        <div className="flex items-center justify-between mb-2">
          <LivesDisplay lives={gameState.lives} maxLives={gameState.maxLives} />

          <div className="flex items-center gap-4">
            <ComboIndicator combo={gameState.comboCount} />
            <XpDisplay
              xp={gameState.currentXp}
              sessionXp={gameState.questionsCorrect > 0 ? undefined : 0}
            />
          </div>

          <button
            onClick={onExit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Exit quiz"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <ProgressBar
          value={currentQuestion}
          max={totalQuestions}
          size="sm"
          color="amber"
        />
      </div>
    </div>
  );
}
