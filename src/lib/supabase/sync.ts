import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeitnerBox, Confidence } from "@/types";

// ============================================
// Supabase Row Types (match DB schema)
// ============================================

export interface UserProfileRow {
  user_id: string;
  xp: number;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  license_level: string;
  license_type: string | null;
  age_group: string | null;
}

export interface UserProgressRow {
  user_id: string;
  question_id: string;
  leitner_box: number;
  times_seen: number;
  times_correct: number;
  last_confidence: string | null;
  next_review: string | null;
  last_reviewed: string | null;
}

// ============================================
// Helpers
// ============================================

function isSupabaseConfigured(supabase: SupabaseClient): boolean {
  // If the URL is a placeholder or empty, skip all operations
  try {
    const url = (supabase as unknown as { supabaseUrl?: string }).supabaseUrl;
    if (
      !url ||
      url === "https://placeholder.supabase.co" ||
      url.includes("your-project") ||
      url === ""
    ) {
      return false;
    }
    return true;
  } catch {
    // If we can't inspect the client, assume it's configured and let
    // individual operations fail gracefully
    return true;
  }
}

// ============================================
// syncUserProfile
// ============================================

export async function syncUserProfile(
  supabase: SupabaseClient,
  userId: string,
  data: {
    xp: number;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string | null;
    licenseLevel: string;
    licenseType?: string;
    ageGroup?: string;
  }
): Promise<void> {
  if (!isSupabaseConfigured(supabase)) return;

  try {
    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        xp: data.xp,
        current_streak: data.currentStreak,
        longest_streak: data.longestStreak,
        last_study_date: data.lastStudyDate,
        license_level: data.licenseLevel,
        license_type: data.licenseType ?? null,
        age_group: data.ageGroup ?? null,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.warn("[supabase-sync] Failed to sync user profile:", error.message);
    }
  } catch (err) {
    console.warn("[supabase-sync] syncUserProfile error:", err);
  }
}

// ============================================
// saveSessionToSupabase
// ============================================

export async function saveSessionToSupabase(
  supabase: SupabaseClient,
  userId: string,
  session: {
    track: string;
    sessionType: string;
    totalQuestions: number;
    correctCount: number;
    scorePercent: number;
    livesRemaining: number;
    xpEarned: number;
  },
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    confidence: string;
    timeSpentMs: number;
  }>
): Promise<string | null> {
  if (!isSupabaseConfigured(supabase)) return null;

  try {
    // 1. Insert the session
    const { data: sessionRow, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        track: session.track,
        session_type: session.sessionType,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        total_questions: session.totalQuestions,
        correct_count: session.correctCount,
        score_percent: session.scorePercent,
        lives_remaining: session.livesRemaining,
        xp_earned: session.xpEarned,
      })
      .select("id")
      .single();

    if (sessionError || !sessionRow) {
      console.warn("[supabase-sync] Failed to save session:", sessionError?.message);
      return null;
    }

    const sessionId = sessionRow.id as string;

    // 2. Insert session answers
    if (answers.length > 0) {
      const answerRows = answers.map((a) => ({
        session_id: sessionId,
        question_id: a.questionId,
        selected_answer: a.selectedAnswer,
        is_correct: a.isCorrect,
        confidence: a.confidence,
        time_spent_ms: a.timeSpentMs,
        answered_at: new Date().toISOString(),
      }));

      const { error: answersError } = await supabase
        .from("session_answers")
        .insert(answerRows);

      if (answersError) {
        console.warn("[supabase-sync] Failed to save session answers:", answersError.message);
      }
    }

    // 3. Update user_progress for each answered question
    const progressRows = answers.map((a) => ({
      user_id: userId,
      question_id: a.questionId,
      last_confidence: a.confidence,
      last_reviewed: new Date().toISOString(),
    }));

    if (progressRows.length > 0) {
      const { error: progressError } = await supabase
        .from("user_progress")
        .upsert(progressRows, { onConflict: "user_id,question_id" });

      if (progressError) {
        console.warn(
          "[supabase-sync] Failed to update user_progress from session:",
          progressError.message
        );
      }
    }

    return sessionId;
  } catch (err) {
    console.warn("[supabase-sync] saveSessionToSupabase error:", err);
    return null;
  }
}

// ============================================
// syncProgress
// ============================================

export async function syncProgress(
  supabase: SupabaseClient,
  userId: string,
  progress: Array<{
    questionId: string;
    leitnerBox: number;
    timesSeen: number;
    timesCorrect: number;
    lastConfidence: string | null;
    nextReview: string | null;
    lastReviewed: string | null;
  }>
): Promise<void> {
  if (!isSupabaseConfigured(supabase)) return;
  if (progress.length === 0) return;

  try {
    const rows = progress.map((p) => ({
      user_id: userId,
      question_id: p.questionId,
      leitner_box: p.leitnerBox,
      times_seen: p.timesSeen,
      times_correct: p.timesCorrect,
      last_confidence: p.lastConfidence,
      next_review: p.nextReview,
      last_reviewed: p.lastReviewed,
    }));

    // Batch upsert — unique constraint on (user_id, question_id)
    const BATCH_SIZE = 500;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("user_progress")
        .upsert(batch, { onConflict: "user_id,question_id" });

      if (error) {
        console.warn("[supabase-sync] Failed to sync progress batch:", error.message);
      }
    }
  } catch (err) {
    console.warn("[supabase-sync] syncProgress error:", err);
  }
}

// ============================================
// loadProgressFromSupabase
// ============================================

export async function loadProgressFromSupabase(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<string, UserProgressRow>> {
  if (!isSupabaseConfigured(supabase)) return {};

  try {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.warn("[supabase-sync] Failed to load progress:", error.message);
      return {};
    }

    const result: Record<string, UserProgressRow> = {};
    for (const row of data ?? []) {
      result[row.question_id] = {
        user_id: row.user_id,
        question_id: row.question_id,
        leitner_box: row.leitner_box,
        times_seen: row.times_seen,
        times_correct: row.times_correct,
        last_confidence: row.last_confidence,
        next_review: row.next_review,
        last_reviewed: row.last_reviewed,
      };
    }

    return result;
  } catch (err) {
    console.warn("[supabase-sync] loadProgressFromSupabase error:", err);
    return {};
  }
}

// ============================================
// loadUserProfile
// ============================================

export async function loadUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfileRow | null> {
  if (!isSupabaseConfigured(supabase)) return null;

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // PGRST116 = row not found, which is expected for new users
      if (error.code !== "PGRST116") {
        console.warn("[supabase-sync] Failed to load user profile:", error.message);
      }
      return null;
    }

    return {
      user_id: data.user_id,
      xp: data.xp,
      current_streak: data.current_streak,
      longest_streak: data.longest_streak,
      last_study_date: data.last_study_date,
      license_level: data.license_level,
      license_type: data.license_type,
      age_group: data.age_group,
    };
  } catch (err) {
    console.warn("[supabase-sync] loadUserProfile error:", err);
    return null;
  }
}
