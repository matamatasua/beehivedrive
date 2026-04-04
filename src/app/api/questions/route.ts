import { type NextRequest } from "next/server";
import { SAMPLE_QUESTIONS } from "@/lib/sample-questions";
import type { Track, SessionType } from "@/types";

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const track = searchParams.get("track") as Track | null;
  const categorySlug = searchParams.get("categorySlug");
  const sessionType = searchParams.get("sessionType") as SessionType | null;

  let filtered = SAMPLE_QUESTIONS;

  if (track) {
    filtered = filtered.filter((q) => q.track === track);
  }

  if (categorySlug) {
    filtered = filtered.filter((q) => q.categoryId === categorySlug);
  }

  if (sessionType) {
    // For exam_sim, return a broader set; for practice, allow category filtering only
    // This hook is here for future session-type-specific filtering logic
  }

  return Response.json({
    questions: filtered,
    count: filtered.length,
  });
}
