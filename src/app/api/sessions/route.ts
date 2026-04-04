import type { QuizResult, SessionType, Track } from "@/types";

interface SessionRequestBody {
  results: QuizResult[];
  sessionType: SessionType;
  track: Track;
}

export async function POST(request: Request) {
  let body: SessionRequestBody;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { results, sessionType, track } = body;

  if (!results || !Array.isArray(results)) {
    return Response.json(
      { error: "Missing or invalid 'results' array" },
      { status: 400 }
    );
  }

  if (!sessionType) {
    return Response.json(
      { error: "Missing 'sessionType'" },
      { status: 400 }
    );
  }

  if (!track) {
    return Response.json(
      { error: "Missing 'track'" },
      { status: 400 }
    );
  }

  const questionsCorrect = results.filter((r) => r.isCorrect).length;
  const xpEarned = results.reduce((sum, r) => sum + r.xpEarned, 0);

  // TODO: persist session to Supabase

  return Response.json({
    success: true,
    xpEarned,
    questionsCorrect,
    totalQuestions: results.length,
    scorePercent:
      results.length > 0
        ? Math.round((questionsCorrect / results.length) * 100)
        : 0,
  });
}
