"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Zap,
  Brain,
  Target,
  Shield,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

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

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // If already logged in, skip to dashboard
  useEffect(() => {
    async function check() {
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
          // Not logged in
        }
      }
      setChecking(false);
    }
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">🐝</span>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-b from-amber-50 to-white">
        <div className="max-w-lg mx-auto px-6 pt-12 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-6xl block mb-4">🐝</span>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              BeehiveDrive
            </h1>
            <p className="mt-3 text-lg text-gray-600 leading-relaxed">
              Pass your Utah driver&apos;s license test on the first try.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              AI-powered, gamified test prep built specifically for Utah.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 space-y-3"
          >
            <Button
              size="lg"
              className="w-full text-base"
              onClick={() => router.push("/auth/signup")}
            >
              Get Started Free
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/auth/login")}
                className="font-semibold text-amber-600 hover:text-amber-700"
              >
                Sign in
              </button>
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Two Tests */}
      <section className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Two tests. One app.
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          BeehiveDrive covers both exams you need to pass.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            <Target size={28} className="mx-auto text-amber-600 mb-2" />
            <p className="font-bold text-gray-900 text-sm">Written Knowledge</p>
            <p className="text-xs text-gray-600 mt-1">50 questions</p>
            <p className="text-xs font-semibold text-amber-700 mt-1">Need 80%</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <Shield size={28} className="mx-auto text-red-500 mb-2" />
            <p className="font-bold text-gray-900 text-sm">Traffic Safety</p>
            <p className="text-xs text-gray-600 mt-1">40 questions</p>
            <p className="text-xs font-semibold text-red-600 mt-1">Must get 100%</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-6">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">
            Why BeehiveDrive works
          </h2>

          <div className="space-y-6">
            {[
              {
                icon: <Brain size={24} className="text-purple-500" />,
                title: "Spaced repetition that adapts to you",
                desc: "Our learning engine tracks what you know and what you don't. It focuses your study time on the questions you're most likely to miss.",
              },
              {
                icon: <Zap size={24} className="text-amber-500" />,
                title: "150+ Utah-specific questions",
                desc: "Every question is based on real Utah law, not generic national content. Covers the 0.05% BAC limit, 25/65/15 insurance, canyon R2 traction, and more.",
              },
              {
                icon: <Target size={24} className="text-blue-500" />,
                title: "Exam simulator with real timing",
                desc: "Practice with a full 50-question timed test that mirrors the actual DLD exam experience. Know exactly what to expect.",
              },
              {
                icon: <Star size={24} className="text-green-500" />,
                title: "AI tutor explains what you miss",
                desc: "Get a wrong answer? Bee Brain explains it in plain English and answers your follow-up questions. Like having a driving instructor in your pocket.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {feature.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Utah-specific callout */}
      <section className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
          Built for Utah, not "Utah-labeled"
        </h2>

        <div className="space-y-3">
          {[
            "Utah's 0.05% BAC limit (lowest in the US)",
            "25/65/15 insurance minimums + mandatory PIP",
            "Canyon R2 traction requirements",
            "80 MPH interstate speed limits",
            "GDL restrictions for teen drivers",
            "Move-over law (includes disabled vehicles)",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-linear-to-b from-amber-50 to-amber-100 py-16">
        <div className="max-w-lg mx-auto px-6 text-center">
          <span className="text-4xl block mb-3">🐝</span>
          <h2 className="text-2xl font-bold text-gray-900">
            Ready to pass your test?
          </h2>
          <p className="text-gray-600 mt-2 mb-6">
            Free to start. No credit card required.
          </p>
          <Button
            size="lg"
            className="w-full text-base"
            onClick={() => router.push("/auth/signup")}
          >
            Create Free Account
            <ArrowRight size={20} className="ml-2" />
          </Button>
          <p className="text-sm text-gray-500 mt-3">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/auth/login")}
              className="font-semibold text-amber-600 hover:text-amber-700"
            >
              Sign in
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
