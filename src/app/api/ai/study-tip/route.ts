import { type NextRequest } from "next/server";
import { getAIClient } from "@/lib/ai/client";
import { checkRateLimit } from "@/lib/ai/rate-limit";

const SYSTEM_PROMPT = `You are BeehiveDrive, an AI study coach for the Utah driver's license test. Give ONE specific, actionable study tip based on the student's progress. Be brief (1-2 sentences), encouraging, and reference specific Utah driving topics. Don't be generic.`;

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return Response.json(
      { error: "Too many requests. Try again in a moment." },
      { status: 429 }
    );
  }

  // Check for AI client
  const client = getAIClient();
  if (!client) {
    return Response.json(
      { error: "AI features are not configured." },
      { status: 503 }
    );
  }

  // Parse request body
  let body: {
    weakCategories?: string[];
    strongCategories?: string[];
    readiness?: number;
    streak?: number;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { weakCategories = [], strongCategories = [], readiness = 0, streak = 0 } = body;

  const userPrompt = [
    `Student readiness: ${readiness}%`,
    `Study streak: ${streak} days`,
    weakCategories.length > 0
      ? `Weak areas: ${weakCategories.join(", ")}`
      : "No weak areas identified yet",
    strongCategories.length > 0
      ? `Strong areas: ${strongCategories.join(", ")}`
      : "No strong areas yet, just getting started",
  ].join("\n");

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const tip = textBlock ? textBlock.text : "Keep practicing, you're making progress!";

    return Response.json({ tip });
  } catch (err) {
    console.error("AI study-tip error:", err);
    return Response.json(
      { error: "Failed to generate study tip. Please try again." },
      { status: 500 }
    );
  }
}
