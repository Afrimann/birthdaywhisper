export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./SettingsForm";
import SignOutButton from "@/app/_components/SignOutButton";
import { getBaseUrl } from "@/lib/url";

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
      notifPrefs: {
        select: {
          emailOnBirthdayUnlock: true,
          emailReminders:        true,
          emailReactions:        true,
        },
      },
    },
  }).catch(() => null);

  if (!user) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-canvas text-accent-900">
      {/* Nav */}
      <nav className="border-b border-[rgba(212,83,126,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="text-accent-500 w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-accent-900 tracking-tight">Settings</span>
        </div>
        <Link
          href="/dashboard"
          className="text-accent-700 hover:text-accent-900 text-sm transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8 animate-fade-rise">
          <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-2">Your Profile</h1>
          <p className="text-accent-700 text-sm">Update your display name, birthday, or public link.</p>
        </div>

        <div className="animate-fade-rise" style={{ animationDelay: "60ms" }}>
          <SettingsForm
            initialData={{
              displayName:   user.displayName,
              birthdayMonth: user.birthdayMonth,
              birthdayDay:   user.birthdayDay,
              username:      user.username,
              notifPrefs: {
                emailOnBirthdayUnlock: user.notifPrefs?.emailOnBirthdayUnlock ?? true,
                emailReminders:        user.notifPrefs?.emailReminders ?? true,
                emailReactions:        user.notifPrefs?.emailReactions ?? true,
              },
            }}
            baseUrl={getBaseUrl()}
          />
        </div>

        <div className="mt-10 pt-8 border-t border-[rgba(212,83,126,0.08)] animate-fade-rise" style={{ animationDelay: "120ms" }}>
          <p className="text-ghost text-xs uppercase tracking-wider mb-4">Account</p>
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}
