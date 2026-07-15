"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift, LayoutDashboard, Menu, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface Props {
  isSignedIn: boolean;
}

export default function LandingNav({ isSignedIn }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(255,255,255,0.85)] backdrop-blur-md border-b border-sand">
      {/* Main bar */}
      <div className="flex items-center justify-between px-5 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Gift className="text-accent-500 w-5 h-5 flex-shrink-0" />
          <span className="font-fraunces text-xl font-bold text-accent-900 tracking-tight">
            BirthdayWhisper
          </span>
        </Link>

        {/* ── Desktop nav (sm+) ───────────────────────────── */}
        <div className="hidden sm:flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-accent-700 hover:text-accent-900 text-sm transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-accent-700 hover:text-accent-900 text-sm transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-accent-500 hover:bg-accent-600 text-canvas text-sm font-semibold px-4 py-2 rounded-full transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile right slot (< sm) ─────────────────────── */}
        <div className="flex sm:hidden items-center gap-2">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-accent-700 hover:text-accent-900 text-sm transition-colors mr-1"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
              <UserButton />
            </>
          ) : (
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="p-1.5 text-accent-700 hover:text-accent-900 transition-colors rounded-lg hover:bg-[rgba(193,97,61,0.06)]"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile dropdown ──────────────────────────────────── */}
      {!isSignedIn && (
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
          } border-t border-sand`}
        >
          <div className="px-5 py-4 flex flex-col gap-3">
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="w-full text-center border border-[rgba(193,97,61,0.2)] text-accent-700 hover:text-accent-900 hover:border-[rgba(193,97,61,0.4)] py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] flex items-center justify-center"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setOpen(false)}
              className="w-full text-center bg-accent-500 hover:bg-accent-600 text-canvas font-semibold py-3 rounded-xl text-sm transition-all min-h-[44px] flex items-center justify-center"
            >
              Get Started — It&apos;s Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
