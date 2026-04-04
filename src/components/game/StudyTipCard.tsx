"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, RefreshCw } from "lucide-react";

const STORAGE_KEY = "beehive_study_tip";
const FALLBACK_TIP =
  "Focus on your weakest topics first — even 10 minutes of targeted practice each day builds real confidence for test day.";

interface StudyTipCardProps {
  weakCategories: string[];
  strongCategories: string[];
  readiness: number;
  streak: number;
}

export function StudyTipCard({
  weakCategories,
  strongCategories,
  readiness,
  streak,
}: StudyTipCardProps) {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check sessionStorage first
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      setTip(cached);
      setLoading(false);
      return;
    }

    fetchTip();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchTip() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/study-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weakCategories,
          strongCategories,
          readiness,
          streak,
        }),
      });

      if (!res.ok) {
        setTip(FALLBACK_TIP);
        return;
      }

      const data = await res.json();
      if (data.error) {
        setTip(FALLBACK_TIP);
      } else {
        setTip(data.tip);
        sessionStorage.setItem(STORAGE_KEY, data.tip);
      }
    } catch {
      setTip(FALLBACK_TIP);
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    sessionStorage.removeItem(STORAGE_KEY);
    fetchTip();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 rounded-2xl border border-blue-200 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Lightbulb size={16} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-blue-700">AI Study Tip</p>
            {!loading && (
              <button
                onClick={handleRefresh}
                className="text-blue-400 hover:text-blue-600 transition-colors p-0.5"
                aria-label="Get new tip"
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-blue-100 rounded w-full" />
              <div className="h-3 bg-blue-100 rounded w-3/4" />
            </div>
          ) : (
            <p className="text-sm text-blue-900 leading-relaxed">{tip}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
