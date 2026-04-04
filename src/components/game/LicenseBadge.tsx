"use client";

import type { LicenseLevel } from "@/types";

interface LicenseBadgeProps {
  level: LicenseLevel;
  readiness: number;
}

const levelConfig = {
  learner: {
    label: "Learner Permit",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: "🔰",
    nextLevel: "Provisional License",
    nextThreshold: 40,
  },
  provisional: {
    label: "Provisional License",
    color: "bg-amber-50 text-amber-800 border-amber-400",
    icon: "🚗",
    nextLevel: "Full License",
    nextThreshold: 80,
  },
  full: {
    label: "Full License",
    color: "bg-green-50 text-green-800 border-green-400",
    icon: "⭐",
    nextLevel: null,
    nextThreshold: 100,
  },
};

export function LicenseBadge({ level, readiness }: LicenseBadgeProps) {
  const config = levelConfig[level];

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${config.color}`}>
      <span className="text-xl">{config.icon}</span>
      <div>
        <p className="font-bold text-sm">{config.label}</p>
        {config.nextLevel && (
          <p className="text-xs opacity-75">
            {config.nextThreshold - readiness}% to {config.nextLevel}
          </p>
        )}
      </div>
    </div>
  );
}
