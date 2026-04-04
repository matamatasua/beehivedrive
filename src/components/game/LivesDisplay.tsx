"use client";

import { Heart } from "lucide-react";

interface LivesDisplayProps {
  lives: number;
  maxLives: number;
}

export function LivesDisplay({ lives, maxLives }: LivesDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxLives }, (_, i) => (
        <Heart
          key={i}
          size={20}
          className={`transition-all duration-300 ${
            i < lives
              ? "fill-red-500 text-red-500"
              : "fill-none text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}
