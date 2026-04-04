"use client";

import { Flame } from "lucide-react";

interface StreakDisplayProps {
  streak: number;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Flame
        size={18}
        className={`${
          streak >= 7
            ? "text-orange-500 fill-orange-500"
            : "text-orange-400 fill-orange-400"
        }`}
      />
      <span className="font-bold text-orange-600">{streak}</span>
      <span className="text-xs text-gray-500">day{streak === 1 ? "" : "s"}</span>
    </div>
  );
}
