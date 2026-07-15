export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./SettingsForm";
import SignOutButton from "@/app/_components/SignOutButton";
import AppShell from "@/app/_components/AppShell";
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
    <AppShell>
      <div className="max-w-lg">
        <div className="mb-8 animate-fade-rise">
          <h1 className="font-fraunces text-3xl md:text-4xl font-bold text-accent-900 mb-2">Your Profile</h1>
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

        <div className="mt-10 pt-8 border-t border-sand animate-fade-rise" style={{ animationDelay: "120ms" }}>
          <p className="text-ghost text-xs uppercase tracking-wider mb-4">Account</p>
          <SignOutButton />
        </div>
      </div>
    </AppShell>
  );
}
