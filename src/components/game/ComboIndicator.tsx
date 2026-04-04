"use client";

import { Zap } from "lucide-react";

interface ComboIndicatorProps {
  combo: number;
}

export function ComboIndicator({ combo }: ComboIndicatorProps) {
  if (combo < 3) return null;

  const isSuper = combo >= 5;

  return (
    <div
      className={`
        inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm
        combo-flash
        ${isSuper
          ? "bg-amber-100 text-amber-700 border-2 border-amber-400"
          : "bg-orange-50 text-orange-600 border border-orange-300"
        }
      `}
    >
      <Zap size={14} className={isSuper ? "fill-amber-500" : "fill-orange-400"} />
      {combo} in a row!
      {isSuper && " 2x XP!"}
    </div>
  );
}
