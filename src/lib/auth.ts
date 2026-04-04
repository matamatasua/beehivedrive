import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Check if Supabase is properly configured (not placeholder values).
 */
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url !== "your_supabase_project_url" &&
      key !== "your_supabase_anon_key" &&
      url.startsWith("https://")
  );
}

/**
 * Returns the current authenticated user, or null if not logged in.
 * Returns null if Supabase is not configured.
 */
export async function getUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Requires an authenticated user. Redirects to /auth/login if not found.
 * If Supabase is not configured, redirects to /auth/login.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}
