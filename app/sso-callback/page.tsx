"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function SSOCallback() {
  return <AuthenticateWithRedirectCallback />;
}

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <Suspense
        fallback={
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        }
      >
        <SSOCallback />
      </Suspense>
    </div>
  );
}
