"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ExplainButtonProps {
  questionText: string;
  correctAnswer: string;
  selectedAnswer: string;
  explanation: string;
  utahCodeRef: string | null;
  categoryId: string;
}

export function ExplainButton({
  questionText,
  correctAnswer,
  selectedAnswer,
  explanation,
  utahCodeRef,
  categoryId,
}: ExplainButtonProps) {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExplain() {
    // Already fetched — don't re-fetch
    if (aiExplanation) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText,
          correctAnswer,
          selectedAnswer,
          explanation,
          utahCodeRef,
          categoryId,
        }),
      });

      if (res.status === 429) {
        setError("Try again in a moment.");
        return;
      }

      if (!res.ok) {
        setError("Explanation unavailable right now.");
        return;
      }

      const data = await res.json();
      if (data.error) {
        setError("Explanation unavailable right now.");
      } else {
        setAiExplanation(data.explanation);
      }
    } catch {
      setError("Explanation unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      {!aiExplanation && !error && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExplain}
          disabled={loading}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Explain more with AI
            </>
          )}
        </Button>
      )}

      {aiExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
        >
          <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
            <Sparkles size={12} />
            AI Explanation
          </p>
          <p className="text-sm text-blue-900 leading-relaxed">{aiExplanation}</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <p className="text-sm text-gray-500">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
