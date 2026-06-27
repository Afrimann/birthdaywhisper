export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Skip onboarding if the user already has a profile
  const existing = await prisma.user
    .findUnique({ where: { clerkId: userId }, select: { id: true } })
    .catch(() => null);

  if (existing) redirect("/dashboard");

  return <OnboardingForm />;
}
