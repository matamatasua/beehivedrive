"use client";

import { useRouter } from "next/navigation";
import { ChallengeMode } from "@/components/challenge/ChallengeMode";

export default function ChallengePage() {
  const router = useRouter();

  function handleComplete() {
    router.push("/dashboard");
  }

  function handleExit() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-lg mx-auto px-4 py-6">
        <ChallengeMode onComplete={handleComplete} onExit={handleExit} />
      </main>
    </div>
  );
}
