"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ACRONYMS } from "@/lib/acronyms";
import { BeeBrain } from "./BeeBrain";

interface AcronymTooltipProps {
  acronym: string;
  children?: React.ReactNode;
}

export function AcronymTooltip({ acronym, children }: AcronymTooltipProps) {
  const def = ACRONYMS[acronym];
  const [showTooltip, setShowTooltip] = useState(false);
  const [showBeeBrain, setShowBeeBrain] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("above");
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // If too close to top, show below
    setPosition(rect.top < 120 ? "below" : "above");
  }, []);

  const openTooltip = useCallback(() => {
    updatePosition();
    setShowTooltip(true);
  }, [updatePosition]);

  const closeTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!showTooltip) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        closeTooltip();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTooltip, closeTooltip]);

  if (!def) {
    return <span>{children ?? acronym}</span>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-block cursor-help"
        style={{ borderBottom: "1px dotted #9ca3af" }}
        onMouseEnter={() => {
          hoverTimeoutRef.current = setTimeout(openTooltip, 200);
        }}
        onMouseLeave={() => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          closeTooltip();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (showTooltip) {
            closeTooltip();
          } else {
            openTooltip();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${def.short}: ${def.full}`}
      >
        {children ?? acronym}

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, y: position === "above" ? 4 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: position === "above" ? 4 : -4 }}
              transition={{ duration: 0.15 }}
              className={`absolute z-50 left-1/2 -translate-x-1/2 w-64 ${
                position === "above" ? "bottom-full mb-2" : "top-full mt-2"
              }`}
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = null;
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-900 text-white rounded-xl p-3 shadow-xl text-left text-sm">
                <p className="font-bold text-amber-400 mb-1">{def.full}</p>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {def.brief}
                </p>
                <button
                  className="mt-2 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTooltip();
                    setShowBeeBrain(true);
                  }}
                >
                  <span>🐝</span>
                  <Sparkles className="w-3 h-3" />
                  <span>Bee Brain</span>
                </button>

                {/* Arrow */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent ${
                    position === "above"
                      ? "top-full border-t-[6px] border-t-gray-900"
                      : "bottom-full border-b-[6px] border-b-gray-900"
                  }`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </span>

      {showBeeBrain && (
        <BeeBrain
          acronym={def.short}
          onClose={() => setShowBeeBrain(false)}
        />
      )}
    </>
  );
}
