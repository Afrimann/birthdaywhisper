import { notFound } from "next/navigation";
import { Gift, Bell } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isBirthdayToday, daysUntilBirthday, formatBirthday, getBirthdayYear } from "@/lib/utils";
import MessageForm from "./MessageForm";
import FollowButton from "./FollowButton";
import WishlistSection from "./WishlistSection";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user
    .findUnique({ where: { username }, select: { displayName: true } })
    .catch(() => null);

  if (!user) return { title: "Not Found" };

  const title = `Send ${user.displayName} a birthday whisper`;
  const description = `Leave ${user.displayName} a secret birthday message — sealed until their birthday. Only they can open it on their special day.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} 🎂`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} 🎂`,
      description,
    },
  };
}

export default async function PublicBirthdayPage({ params }: Props) {
  const { username } = await params;
  const { userId } = await auth();
  const isSignedIn = !!userId;

  const [user, viewerDb] = await Promise.all([
    prisma.user
      .findUnique({
        where: { username },
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
          birthdayMonth: true,
          birthdayDay: true,
          showWishlist: true,
        },
      })
      .catch(() => null),
    userId
      ? prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } }).catch(() => null)
      : null,
  ]);

  if (!user) notFound();

  const isOwnProfile = viewerDb?.id === user.id;

  const wishlistItems = user.showWishlist
    ? await prisma.wishlistItem.findMany({
        where: { userId: user.id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }).catch(() => [])
    : [];

  const initialFollowing = isSignedIn && !isOwnProfile && viewerDb
    ? await prisma.birthdayFollow
        .findUnique({
          where: { followerId_followedId: { followerId: viewerDb.id, followedId: user.id } },
        })
        .then((f) => !!f)
        .catch(() => false)
    : false;

  const isToday = isBirthdayToday(user.birthdayMonth, user.birthdayDay);
  const days = daysUntilBirthday(user.birthdayMonth, user.birthdayDay);
  const birthdayLabel = formatBirthday(user.birthdayMonth, user.birthdayDay);
  const birthdayYear = getBirthdayYear(user.birthdayMonth, user.birthdayDay);
  const firstName = user.displayName.split(" ")[0];
  const initials = user.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-canvas text-cream">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-[rgba(242,193,78,0.08)]">
        <Link href="/" className="flex items-center gap-2">
          <Gift className="text-gold w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-cream tracking-tight">
            BirthdayWhisper
          </span>
        </Link>
        {isSignedIn ? (
          <Link href="/dashboard" className="text-stone hover:text-cream text-sm transition-colors">
            Dashboard →
          </Link>
        ) : (
          <Link href="/sign-up" className="text-stone hover:text-cream text-sm transition-colors">
            Create your page →
          </Link>
        )}
      </nav>

      <main className="max-w-lg mx-auto px-6 py-12">
        {/* Birthday today banner */}
        {isToday && (
          <div className="bg-gradient-to-r from-gold to-gold-bright rounded-2xl p-4 text-center mb-8 animate-fade-rise">
            <p className="text-canvas font-bold text-lg">
              🎂 It&apos;s {firstName}&apos;s birthday today!
            </p>
          </div>
        )}

        {/* Profile header */}
        <div className="text-center mb-10 animate-fade-rise">
          <div className="w-20 h-20 rounded-full bg-[rgba(242,193,78,0.12)] border-2 border-[rgba(242,193,78,0.28)] flex items-center justify-center mx-auto mb-4">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="font-fraunces text-2xl font-bold text-gold">{initials}</span>
            )}
          </div>

          <h1 className="font-fraunces text-3xl font-bold text-cream mb-2">
            {user.displayName}
          </h1>

          {isToday ? (
            <p className="text-gold font-semibold">Their birthday is today!</p>
          ) : (
            <p className="text-stone text-sm">
              Birthday: <span className="text-cream">{birthdayLabel}</span>
              {" · "}
              <span className="text-gold font-semibold">{days} day{days !== 1 ? "s" : ""} away</span>
            </p>
          )}

          {isSignedIn && !isOwnProfile && (
            <div className="mt-4 flex justify-center">
              <FollowButton username={username} initialFollowing={initialFollowing} />
            </div>
          )}
        </div>

        {/* Wishlist */}
        {user.showWishlist && wishlistItems.length > 0 && (
          <WishlistSection
            items={wishlistItems}
            firstName={firstName}
            isOwnProfile={isOwnProfile}
          />
        )}

        {/* Message form */}
        <MessageForm
          recipientId={user.id}
          recipientName={user.displayName}
          birthdayYear={birthdayYear}
          isToday={isToday}
          isSignedIn={isSignedIn}
        />

        {/* Reaction notification hint */}
        {!isOwnProfile && (
          <div className="mt-4 animate-fade-rise" style={{ animationDelay: "180ms" }}>
            {isSignedIn ? (
              <div className="flex items-start gap-3 glass rounded-2xl px-4 py-3">
                <Bell className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <p className="text-stone text-xs leading-relaxed">
                  When {firstName} reacts to your whisper, you&apos;ll get a notification — check the bell icon on your dashboard.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 glass rounded-2xl px-4 py-3">
                <Bell className="w-4 h-4 text-ghost flex-shrink-0 mt-0.5" />
                <p className="text-ghost text-xs leading-relaxed">
                  <Link href="/sign-up" className="text-gold hover:text-gold-bright underline underline-offset-2 transition-colors">
                    Create a free account
                  </Link>{" "}
                  to be notified when {firstName} reacts to your whisper.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
