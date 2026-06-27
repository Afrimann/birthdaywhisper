import Link from "next/link";
import { Gift, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas text-cream flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[rgba(242,193,78,0.045)] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/4 w-56 h-56 bg-[rgba(242,193,78,0.025)] rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-md animate-fade-rise">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[rgba(242,193,78,0.15)] to-[rgba(22,21,25,0.8)] border border-[rgba(242,193,78,0.2)] flex items-center justify-center">
          <Gift className="w-10 h-10 text-gold opacity-60" />
        </div>

        {/* 404 */}
        <p className="font-fraunces text-[7rem] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-b from-[rgba(242,193,78,0.6)] to-[rgba(242,193,78,0.1)] select-none mb-2">
          404
        </p>

        <h1 className="font-fraunces text-2xl font-bold text-cream mb-3">
          This page got lost in the dark
        </h1>
        <p className="text-stone text-sm leading-relaxed mb-10">
          The page you&apos;re looking for doesn&apos;t exist, or it may have been moved.
          Let&apos;s get you back somewhere familiar.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-gold hover:bg-gold-bright text-canvas font-semibold px-6 py-3.5 rounded-2xl transition-all min-h-[52px] text-sm"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 border border-[rgba(242,193,78,0.2)] hover:border-[rgba(242,193,78,0.4)] bg-[rgba(22,21,25,0.5)] text-stone hover:text-cream px-6 py-3.5 rounded-2xl transition-all min-h-[52px] text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
