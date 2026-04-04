"use client";

import { Star } from "lucide-react";

interface XpDisplayProps {
  xp: number;
  sessionXp?: number;
}

export function XpDisplay({ xp, sessionXp }: XpDisplayProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Star size={18} className="fill-amber-400 text-amber-400" />
      <span className="font-bold text-amber-700">{xp.toLocaleString()}</span>
      {sessionXp !== undefined && sessionXp > 0 && (
        <span className="text-sm text-amber-500 font-medium">+{sessionXp}</span>
      )}
    </div>
  );
}
