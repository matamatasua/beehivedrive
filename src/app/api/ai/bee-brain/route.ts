import { type NextRequest } from "next/server";
import { getAIClient } from "@/lib/ai/client";
import { checkRateLimit } from "@/lib/ai/rate-limit";

const SYSTEM_PROMPT = `You are Bee Brain, a friendly and enthusiastic study buddy helping someone prepare for the Utah driver's license test. You explain driving concepts in simple, everyday language. You're encouraging, use analogies, and relate everything back to the Utah driving test. Keep responses to 2-3 sentences unless the user asks for more detail. Never use em dashes, en dashes, or " - " in your responses. Use periods, commas, or parentheses instead.`;

export async function POST(request: NextRequest) {
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

  const client = getAIClient();
  if (!client) {
    return Response.json(
      { error: "AI features are not configured." },
      { status: 503 }
    );
  }

  let body: {
    acronym?: string;
    acronymFull?: string;
    acronymBrief?: string;
    message?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { acronym, acronymFull, acronymBrief, message, history } = body;

  if (!acronym || !acronymFull) {
    return Response.json(
      { error: "Missing required fields: acronym, acronymFull." },
      { status: 400 }
    );
  }

  // Build messages array
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (!message) {
    // Initial explanation request
    messages.push({
      role: "user",
      content: `Please explain the acronym "${acronym}" (${acronymFull}) to me. Brief definition: ${acronymBrief ?? "N/A"}. Start with "Let me break down ${acronym} for you..." and relate it to the Utah driving test.`,
    });
  } else {
    // Follow-up: include history then the new message
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    // Only add the new user message if it's not already the last message in history
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== message) {
      messages.push({ role: "user", content: message });
    }
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const responseText = textBlock
      ? textBlock.text
      : "Hmm, I couldn't come up with an explanation right now. Try again!";

    return Response.json({ response: responseText });
  } catch (err) {
    console.error("Bee Brain AI error:", err);
    return Response.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
