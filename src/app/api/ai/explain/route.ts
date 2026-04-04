import { type NextRequest } from "next/server";
import { getAIClient } from "@/lib/ai/client";
import { checkRateLimit } from "@/lib/ai/rate-limit";

const SYSTEM_PROMPT = `You are a friendly Utah driving instructor helping a student understand why they got a practice test question wrong. Be concise (2-3 sentences), encouraging, and focus on WHY the correct answer is right. Reference specific Utah laws when relevant. Don't lecture — be conversational, like explaining to a friend.`;

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
    questionText?: string;
    correctAnswer?: string;
    selectedAnswer?: string;
    explanation?: string;
    utahCodeRef?: string | null;
    categoryId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { questionText, correctAnswer, selectedAnswer, explanation, utahCodeRef, categoryId } =
    body;

  if (!questionText || !correctAnswer || !selectedAnswer) {
    return Response.json(
      { error: "Missing required fields: questionText, correctAnswer, selectedAnswer." },
      { status: 400 }
    );
  }

  const userPrompt = [
    `Question: ${questionText}`,
    `Student chose: ${selectedAnswer}`,
    `Correct answer: ${correctAnswer}`,
    explanation ? `Standard explanation: ${explanation}` : null,
    utahCodeRef ? `Utah Code reference: ${utahCodeRef}` : null,
    categoryId ? `Topic: ${categoryId}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const explanationText = textBlock ? textBlock.text : "Unable to generate explanation.";

    return Response.json({ explanation: explanationText });
  } catch (err) {
    console.error("AI explain error:", err);
    return Response.json(
      { error: "Failed to generate explanation. Please try again." },
      { status: 500 }
    );
  }
}
