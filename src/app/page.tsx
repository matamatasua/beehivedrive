"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns true when Supabase env vars look like real values (not placeholders).
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

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function resolve() {
      // 1. If Supabase is configured, check for an authenticated session.
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            router.replace("/dashboard");
            return;
          }
        } catch {
          // Supabase call failed — fall through to localStorage check.
        }
      }

      // 2. Check localStorage for anonymous onboarding.
      const onboarded = localStorage.getItem("beehive_onboarding");
      if (onboarded) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }

    resolve();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <span className="text-4xl">🐝</span>
        <p className="text-gray-500 mt-2">Loading...</p>
      </div>
    </div>
  );
}
