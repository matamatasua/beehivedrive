import { createClient } from "@/lib/supabase/server";
import { syncUserProfile, syncProgress } from "@/lib/supabase/sync";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { user: userData, progress: progressData } = body;

    // Validate payload shape
    if (!userData && !progressData) {
      return Response.json(
        { error: "Request body must include 'user' and/or 'progress'" },
        { status: 400 }
      );
    }

    const promises: Promise<void>[] = [];

    // Sync user profile if provided
    if (userData) {
      promises.push(
        syncUserProfile(supabase, user.id, {
          xp: userData.xp ?? 0,
          currentStreak: userData.currentStreak ?? 0,
          longestStreak: userData.longestStreak ?? 0,
          lastStudyDate: userData.lastStudyDate ?? null,
          licenseLevel: userData.licenseLevel ?? "learner",
          licenseType: userData.licenseType,
          ageGroup: userData.ageGroup,
        })
      );
    }

    // Sync progress if provided
    if (progressData && typeof progressData === "object") {
      const progressArray = Object.values(progressData).map((p: unknown) => {
        const entry = p as Record<string, unknown>;
        return {
          questionId: String(entry.questionId ?? ""),
          leitnerBox: Number(entry.leitnerBox ?? 1),
          timesSeen: Number(entry.timesSeen ?? 0),
          timesCorrect: Number(entry.timesCorrect ?? 0),
          lastConfidence: (entry.lastConfidence as string) ?? null,
          nextReview: (entry.nextReview as string) ?? null,
          lastReviewed: (entry.lastReviewed as string) ?? null,
        };
      });

      // Filter out entries with empty questionId
      const validEntries = progressArray.filter((p) => p.questionId !== "");

      if (validEntries.length > 0) {
        promises.push(syncProgress(supabase, user.id, validEntries));
      }
    }

    await Promise.all(promises);

    return Response.json({ success: true });
  } catch (err) {
    console.error("[api/sync] Unexpected error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
