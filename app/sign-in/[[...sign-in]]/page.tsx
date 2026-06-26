"use client";
import { SignIn } from "@clerk/nextjs";
import { Gift } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-navy-800 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <Gift className="text-violet-500 w-6 h-6" />
          <span className="font-playfair text-2xl font-bold text-white">BirthdayWhisper</span>
        </Link>
        <p className="text-slate-400 text-sm">Welcome back</p>
      </div>
      <SignIn />
    </div>
  );
}
