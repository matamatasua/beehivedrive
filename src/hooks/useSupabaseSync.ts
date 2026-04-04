"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  syncUserProfile,
  syncProgress,
  loadProgressFromSupabase,
  loadUserProfile,
} from "@/lib/supabase/sync";
import type { UserProgressRow } from "@/lib/supabase/sync";
import type { PersistedUser, ProgressMap } from "@/hooks/useGameState";
import type { LeitnerBox, Confidence, LicenseLevel, UserProgress } from "@/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ============================================
// Helpers: convert between DB rows and app types
// ============================================

function dbRowToUserProgress(row: UserProgressRow): UserProgress {
  return {
    id: row.question_id,
    userId: row.user_id,
    questionId: row.question_id,
    leitnerBox: (row.leitner_box >= 1 && row.leitner_box <= 5
      ? row.leitner_box
      : 1) as LeitnerBox,
    timesSeen: row.times_seen,
    timesCorrect: row.times_correct,
    lastConfidence: (row.last_confidence as Confidence) ?? null,
    nextReview: row.next_review,
    lastReviewed: row.last_reviewed,
  };
}

function progressMapToSyncArray(progress: ProgressMap) {
  return Object.values(progress).map((p) => ({
    questionId: p.questionId,
    leitnerBox: p.leitnerBox,
    timesSeen: p.timesSeen,
    timesCorrect: p.timesCorrect,
    lastConfidence: p.lastConfidence,
    nextReview: p.nextReview,
    lastReviewed: p.lastReviewed,
  }));
}

/**
 * Merge Supabase progress with localStorage progress.
 * Supabase wins on conflicts (same questionId), but localStorage-only
 * entries are kept.
 */
function mergeProgress(
  local: ProgressMap,
  remote: Record<string, UserProgressRow>,
  userId: string
): ProgressMap {
  const merged = { ...local };

  for (const [qid, row] of Object.entries(remote)) {
    const converted = dbRowToUserProgress(row);
    converted.userId = userId;

    const localEntry = merged[qid];
    if (!localEntry) {
      // Remote-only — add it
      merged[qid] = converted;
    } else {
      // Both exist — Supabase wins on conflicts.
      // Use the entry with the more recent lastReviewed, or prefer remote.
      const remoteTime = row.last_reviewed
        ? new Date(row.last_reviewed).getTime()
        : 0;
      const localTime = localEntry.lastReviewed
        ? new Date(localEntry.lastReviewed).getTime()
        : 0;

      if (remoteTime >= localTime) {
        merged[qid] = converted;
      }
      // else keep local (it's newer)
    }
  }

  return merged;
}

// ============================================
// Hook
// ============================================

interface UseSupabaseSyncOptions {
  /** Current user state from useGameState */
  user: PersistedUser;
  /** Current progress from useGameState */
  progress: ProgressMap;
  /** Whether useGameState has finished loading from localStorage */
  loaded: boolean;
  /** Callback to update the user state in useGameState */
  setUser?: (user: PersistedUser) => void;
  /** Callback to replace the progress map in useGameState */
  setProgress?: (progress: ProgressMap) => void;
}

interface UseSupabaseSyncReturn {
  isAuthenticated: boolean;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  user: SupabaseUser | null;
}

export function useSupabaseSync(
  options?: UseSupabaseSyncOptions
): UseSupabaseSyncReturn {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const initialLoadDone = useRef(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  // Lazily create the Supabase client
  function getSupabase() {
    if (!supabaseRef.current) {
      try {
        supabaseRef.current = createClient();
      } catch {
        // Supabase not configured
        return null;
      }
    }
    return supabaseRef.current;
  }

  // Check auth state on mount
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const supabase = getSupabase();
      if (!supabase) return;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (user) {
          setAuthUser(user);
          setIsAuthenticated(true);
        }
      } catch {
        // Auth check failed — stay anonymous
      }
    }

    checkAuth();

    // Listen for auth changes
    const supabase = getSupabase();
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        const user = session?.user ?? null;
        setAuthUser(user);
        setIsAuthenticated(!!user);
      });

      return () => {
        cancelled = true;
        subscription.unsubscribe();
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Load from Supabase after auth is confirmed and localStorage is ready
  useEffect(() => {
    if (
      !isAuthenticated ||
      !authUser ||
      !options?.loaded ||
      initialLoadDone.current
    ) {
      return;
    }

    async function loadFromSupabase() {
      const supabase = getSupabase();
      if (!supabase || !authUser) return;

      try {
        setIsSyncing(true);

        const [remoteProgress, remoteProfile] = await Promise.all([
          loadProgressFromSupabase(supabase, authUser.id),
          loadUserProfile(supabase, authUser.id),
        ]);

        // Merge progress: Supabase wins on conflicts
        if (
          options?.setProgress &&
          Object.keys(remoteProgress).length > 0
        ) {
          const merged = mergeProgress(
            options.progress,
            remoteProgress,
            authUser.id
          );
          options.setProgress(merged);
        }

        // Merge user profile: Supabase wins
        if (options?.setUser && remoteProfile) {
          options.setUser({
            ...options.user,
            xp: Math.max(options.user.xp, remoteProfile.xp),
            currentStreak: remoteProfile.current_streak,
            longestStreak: Math.max(
              options.user.longestStreak,
              remoteProfile.longest_streak
            ),
            lastStudyDate: remoteProfile.last_study_date,
            licenseLevel:
              (remoteProfile.license_level as LicenseLevel) ||
              options.user.licenseLevel,
          });
        }

        // If there's local-only progress, push it to Supabase
        if (options && Object.keys(options.progress).length > 0) {
          const localOnlyEntries = Object.entries(options.progress).filter(
            ([qid]) => !remoteProgress[qid]
          );
          if (localOnlyEntries.length > 0) {
            await syncProgress(
              supabase,
              authUser.id,
              localOnlyEntries.map(([, p]) => ({
                questionId: p.questionId,
                leitnerBox: p.leitnerBox,
                timesSeen: p.timesSeen,
                timesCorrect: p.timesCorrect,
                lastConfidence: p.lastConfidence,
                nextReview: p.nextReview,
                lastReviewed: p.lastReviewed,
              }))
            );
          }
        }

        initialLoadDone.current = true;
      } catch (err) {
        console.warn("[useSupabaseSync] Failed to load from Supabase:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    loadFromSupabase();
  }, [isAuthenticated, authUser, options?.loaded]);

  // syncNow: push current state to Supabase
  const syncNow = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !authUser || !options) return;

    try {
      setIsSyncing(true);

      await Promise.all([
        syncUserProfile(supabase, authUser.id, {
          xp: options.user.xp,
          currentStreak: options.user.currentStreak,
          longestStreak: options.user.longestStreak,
          lastStudyDate: options.user.lastStudyDate,
          licenseLevel: options.user.licenseLevel,
        }),
        syncProgress(
          supabase,
          authUser.id,
          progressMapToSyncArray(options.progress)
        ),
      ]);
    } catch (err) {
      console.warn("[useSupabaseSync] syncNow failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [authUser, options?.user, options?.progress]);

  return {
    isAuthenticated,
    isSyncing,
    syncNow,
    user: authUser,
  };
}
