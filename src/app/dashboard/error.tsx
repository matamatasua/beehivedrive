"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <span className="text-5xl block mb-4">🐝</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Dashboard Error
        </h2>
        <p className="text-gray-500 mb-6">
          We couldn&apos;t load your dashboard. Your progress is safe.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
        >
          Reload Dashboard
        </button>
      </div>
    </div>
  );
}
