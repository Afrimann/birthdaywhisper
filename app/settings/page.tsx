export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./SettingsForm";
import SignOutButton from "@/app/_components/SignOutButton";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      displayName:   true,
      birthdayMonth: true,
      birthdayDay:   true,
      username:      true,
    },
  }).catch(() => null);

  if (!user) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-canvas text-cream">
      {/* Nav */}
      <nav className="border-b border-[rgba(242,193,78,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="text-gold w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-cream tracking-tight">Settings</span>
        </div>
        <Link
          href="/dashboard"
          className="text-stone hover:text-cream text-sm transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8 animate-fade-rise">
          <h1 className="font-fraunces text-2xl font-bold text-cream mb-2">Your Profile</h1>
          <p className="text-stone text-sm">Update your display name, birthday, or public link.</p>
        </div>

        <div className="animate-fade-rise" style={{ animationDelay: "60ms" }}>
          <SettingsForm initialData={user} />
        </div>

        <div className="mt-10 pt-8 border-t border-[rgba(242,193,78,0.08)] animate-fade-rise" style={{ animationDelay: "120ms" }}>
          <p className="text-ghost text-xs uppercase tracking-wider mb-4">Account</p>
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}
