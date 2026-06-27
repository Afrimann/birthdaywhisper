"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Gift, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();
  const isLoading = fetchStatus === "fetching";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || isLoading) return;
    setError("");

    const { error: pwErr } = await signIn.password({
      identifier: email,
      password,
    });

    if (pwErr) {
      setError(
        pwErr.longMessage ??
          pwErr.message ??
          "Sign-in failed. Please try again.",
      );
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const dest = decorateUrl("/dashboard");
          if (dest.startsWith("https://")) window.location.assign(dest);
          else router.push(dest);
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[rgba(242,193,78,0.04)] rounded-full blur-3xl pointer-events-none" />

      {/* Logo + heading */}
      <div className="relative z-10 mb-8 text-center animate-fade-rise">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <Gift className="text-gold w-6 h-6" />
          <span className="font-fraunces text-2xl font-bold text-cream tracking-tight">
            BirthdayWhisper
          </span>
        </Link>
        <h1 className="font-fraunces text-xl font-bold text-cream mb-1">
          Welcome back
        </h1>
        <p className="text-stone text-sm">Sign in to see your whispers</p>
      </div>

      {/* Form card */}
      <div
        className="relative z-10 w-full max-w-sm animate-fade-rise"
        style={{ animationDelay: "60ms" }}
      >
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] focus:shadow-[0_0_0_3px_rgba(242,193,78,0.07)] rounded-xl px-4 py-3 text-cream placeholder-ghost outline-none transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] focus:shadow-[0_0_0_3px_rgba(242,193,78,0.07)] rounded-xl px-4 py-3 pr-11 text-cream placeholder-ghost outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost hover:text-stone transition-colors"
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[rgba(251,113,133,0.08)] border border-rose-400/25 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-bright disabled:opacity-50 disabled:cursor-not-allowed text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[rgba(242,193,78,0.08)] text-center">
            <p className="text-stone text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-gold hover:text-gold-bright transition-colors font-medium"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
