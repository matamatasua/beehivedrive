import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(new URL("/onboarding", origin));
      }
    } catch {
      // Fall through to the error redirect below.
    }
  }

  // If there's no code or an error occurred, redirect to login.
  return NextResponse.redirect(new URL("/auth/login", request.url));
}
