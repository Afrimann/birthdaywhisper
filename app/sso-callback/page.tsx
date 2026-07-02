"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function SSOCallback() {
  // New Google users arrive here without a session (the sign-in → sign-up
  // "transfer" path) — without explicit URLs Clerk falls back to defaults
  // and the flow can stall or strand them on the landing page.
  return (
    <AuthenticateWithRedirectCallback
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/onboarding"
    />
  );
}

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <Suspense
        fallback={
          <Loader2 className="w-6 h-6 text-accent-500 animate-spin" />
        }
      >
        <SSOCallback />
      </Suspense>
    </div>
  );
}
