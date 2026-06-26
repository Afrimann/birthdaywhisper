import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  const { displayName, birthdayMonth, birthdayDay, username } = await req.json();

  if (!displayName || !birthdayMonth || !birthdayDay || !username) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: "Username taken" }, { status: 409 });

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { displayName, birthdayMonth, birthdayDay, username },
    create: {
      clerkId: userId,
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
      displayName,
      birthdayMonth,
      birthdayDay,
      username,
      avatarUrl: clerkUser?.imageUrl ?? null,
    },
  });

  return NextResponse.json({ user });
}
