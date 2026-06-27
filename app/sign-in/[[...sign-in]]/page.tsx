"use client";
import { SignIn } from "@clerk/nextjs";
import { Gift } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[rgba(242,193,78,0.04)] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mb-8 text-center animate-fade-rise">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <Gift className="text-gold w-6 h-6" />
          <span className="font-fraunces text-2xl font-bold text-cream tracking-tight">BirthdayWhisper</span>
        </Link>
        <p className="text-stone text-sm">Welcome back</p>
      </div>

      <div className="relative z-10 animate-fade-rise" style={{ animationDelay: "60ms" }}>
        <SignIn />
      </div>
    </div>
  );
}
