import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Check if user has already onboarded (returning Google user)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if user profile exists in our users table
          const { data: profile } = await supabase
            .from("users")
            .select("onboarding_complete")
            .eq("id", user.id)
            .single();

          if (profile?.onboarding_complete) {
            return NextResponse.redirect(new URL("/dashboard", origin));
          }
        }

        return NextResponse.redirect(new URL(next, origin));
      }
    } catch {
      // Fall through to error redirect
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=auth_failed", origin));
}
