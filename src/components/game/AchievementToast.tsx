"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACHIEVEMENTS } from "@/lib/constants";

interface AchievementToastProps {
  newlyEarned: string[];
  onDismiss: () => void;
}

export function AchievementToast({ newlyEarned, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    if (newlyEarned.length === 0) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [newlyEarned, onDismiss]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {newlyEarned.map((id, index) => {
          const achievement = ACHIEVEMENTS.find((a) => a.id === id);
          if (!achievement) return null;

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ delay: index * 0.15, duration: 0.35, ease: "easeOut" }}
              className="pointer-events-auto bg-white rounded-2xl shadow-lg border-2 border-amber-400 px-5 py-3 flex items-center gap-3 min-w-[280px]"
            >
              <span className="text-3xl">{achievement.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                  Achievement Unlocked!
                </p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {achievement.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {achievement.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
