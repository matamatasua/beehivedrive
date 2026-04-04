"use client";

import { Lock } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/constants";
import { Card, CardBody } from "@/components/ui/Card";

const COMING_SOON = new Set(["sign_sage", "numbers_ninja", "boss_slayer"]);

interface AchievementGalleryProps {
  earnedAchievements: string[];
}

export function AchievementGallery({ earnedAchievements }: AchievementGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ACHIEVEMENTS.map((achievement) => {
        const isEarned = earnedAchievements.includes(achievement.id);
        const isComingSoon = COMING_SOON.has(achievement.id);

        return (
          <Card key={achievement.id}>
            <CardBody
              className={`text-center py-4 px-3 ${
                isEarned
                  ? "bg-amber-50"
                  : "bg-gray-50 opacity-60"
              }`}
            >
              {isEarned ? (
                <span className="text-3xl block mb-1">{achievement.icon}</span>
              ) : (
                <Lock className="w-7 h-7 mx-auto text-gray-400 mb-1" />
              )}
              <p
                className={`text-sm font-bold ${
                  isEarned ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {achievement.name}
              </p>
              {isEarned ? (
                <p className="text-xs text-amber-600 mt-0.5">Earned</p>
              ) : isComingSoon ? (
                <p className="text-xs text-gray-400 mt-0.5 italic">Coming soon</p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">{achievement.description}</p>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
