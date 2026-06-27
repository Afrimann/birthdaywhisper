"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Gift, Eye, EyeOff, Loader2, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

type Step = "create" | "verify";

export default function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const isLoading = fetchStatus === "fetching";

  const [step, setStep]         = useState<Step>("create");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [code, setCode]         = useState("");
  const [error, setError]       = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || isLoading) return;
    setError("");

    const { error: pwErr } = await signUp.password({ emailAddress: email, password });
    if (pwErr) {
      setError(pwErr.longMessage ?? pwErr.message ?? "Sign-up failed. Please try again.");
      return;
    }

    // Email verification required
    const { error: sendErr } = await signUp.verifications.sendEmailCode();
    if (sendErr) {
      setError(sendErr.longMessage ?? sendErr.message ?? "Couldn't send verification code.");
      return;
    }

    setStep("verify");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || isLoading) return;
    setError("");

    const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code });
    if (verifyErr) {
      setError(verifyErr.longMessage ?? verifyErr.message ?? "Invalid code. Please try again.");
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const dest = decorateUrl("/onboarding");
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
        {step === "create" ? (
          <>
            <h1 className="font-fraunces text-xl font-bold text-cream mb-1">
              Create your account
            </h1>
            <p className="text-stone text-sm">Your birthday page is waiting</p>
          </>
        ) : (
          <>
            <h1 className="font-fraunces text-xl font-bold text-cream mb-1">
              Check your email
            </h1>
            <p className="text-stone text-sm">
              We sent a 6-digit code to{" "}
              <span className="text-cream font-medium">{email}</span>
            </p>
          </>
        )}
      </div>

      {/* Step indicators */}
      <div className="relative z-10 flex items-center gap-2 mb-6">
        {(["create", "verify"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                step === s
                  ? "bg-gold text-canvas"
                  : s === "create" && step === "verify"
                  ? "bg-[rgba(242,193,78,0.25)] text-gold"
                  : "bg-pitch text-ghost"
              }`}
            >
              {i + 1}
            </div>
            {i === 0 && (
              <div
                className={`w-8 h-px transition-all ${
                  step === "verify" ? "bg-gold" : "bg-pitch"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div
        className="relative z-10 w-full max-w-sm animate-fade-rise"
        style={{ animationDelay: "60ms" }}
      >
        <div className="glass rounded-2xl p-8">
          {step === "create" ? (
            <form onSubmit={handleCreate} className="space-y-5">
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
                    placeholder="Min. 8 characters"
                    required
                    autoComplete="new-password"
                    className="w-full bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] focus:shadow-[0_0_0_3px_rgba(242,193,78,0.07)] rounded-xl px-4 py-3 pr-11 text-cream placeholder-ghost outline-none transition-all text-sm"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost hover:text-stone transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-ghost text-xs mt-1.5">
                  Use 8+ characters with a mix of letters and numbers.
                </p>
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
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              {/* Icon */}
              <div className="flex justify-center mb-2">
                <div className="w-14 h-14 rounded-2xl bg-[rgba(242,193,78,0.08)] border border-[rgba(242,193,78,0.2)] flex items-center justify-center animate-lantern">
                  <Mail className="w-6 h-6 text-gold" />
                </div>
              </div>

              {/* Code */}
              <div>
                <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] focus:shadow-[0_0_0_3px_rgba(242,193,78,0.07)] rounded-xl px-4 py-3 text-cream placeholder-ghost outline-none transition-all text-center tracking-[0.5em] font-mono text-lg"
                />
                <p className="text-ghost text-xs mt-1.5 text-center">
                  Check spam if it doesn&apos;t arrive within a minute.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-[rgba(251,113,133,0.08)] border border-rose-400/25 rounded-xl px-4 py-3">
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}

              {/* Verify */}
              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-bright disabled:opacity-50 disabled:cursor-not-allowed text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px]"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                ) : (
                  "Verify Email"
                )}
              </button>

              {/* Back */}
              <button
                type="button"
                onClick={() => { setStep("create"); setCode(""); setError(""); }}
                className="w-full flex items-center justify-center gap-2 text-stone hover:text-cream text-sm transition-colors min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </form>
          )}

          {step === "create" && (
            <div className="mt-6 pt-5 border-t border-[rgba(242,193,78,0.08)] text-center">
              <p className="text-stone text-sm">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className="text-gold hover:text-gold-bright transition-colors font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
