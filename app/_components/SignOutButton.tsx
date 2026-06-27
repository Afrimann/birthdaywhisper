"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

interface Props {
  variant?: "full" | "icon";
}

export default function SignOutButton({ variant = "full" }: Props) {
  const { signOut } = useClerk();

  const handleSignOut = () => signOut({ redirectUrl: "/" });

  if (variant === "icon") {
    return (
      <button
        onClick={handleSignOut}
        aria-label="Sign out"
        className="p-1.5 text-stone hover:text-rose-400 transition-colors rounded-lg hover:bg-[rgba(251,113,133,0.06)]"
      >
        <LogOut className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center justify-center gap-2 border border-[rgba(251,113,133,0.2)] hover:border-rose-400/40 hover:bg-[rgba(251,113,133,0.06)] text-stone hover:text-rose-400 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px]"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}
