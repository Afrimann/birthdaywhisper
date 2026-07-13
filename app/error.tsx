"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-canvas text-accent-900 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[rgba(212,83,126,0.045)] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/4 w-56 h-56 bg-[rgba(212,83,126,0.025)] rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-md animate-fade-rise">
        <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[rgba(212,83,126,0.15)] to-[rgba(255,255,255,0.8)] border border-[rgba(212,83,126,0.2)] flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-accent-500 opacity-60" />
        </div>

        <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-3">
          Something went wrong
        </h1>
        <p className="text-accent-700 text-sm leading-relaxed mb-10">
          That&apos;s on us, not you. Nothing was lost — try again, or head back somewhere familiar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-canvas font-semibold px-6 py-3.5 rounded-2xl transition-all min-h-[52px] text-sm"
          >
            <RotateCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 border border-[rgba(212,83,126,0.2)] hover:border-[rgba(212,83,126,0.4)] bg-[rgba(255,255,255,0.5)] text-accent-700 hover:text-accent-900 px-6 py-3.5 rounded-2xl transition-all min-h-[52px] text-sm"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
