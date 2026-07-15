import { notFound } from "next/navigation";
import { Gift, Bell } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isBirthdayToday, daysUntilBirthday, formatBirthday, getBirthdayYear } from "@/lib/utils";
import { fallbackAvatarDataUri } from "@/lib/avatars";
import { GIFTING_ENABLED } from "@/lib/feature-flags";
import MessageForm from "./MessageForm";
import GiftSection from "./GiftSection";
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
        // Explicit select: this ships to any anonymous visitor's browser as
        // page props, so claimedByFingerprint (an identity-adjacent hash)
        // must never be included here.
        select: { id: true, title: true, description: true, url: true, priceRange: true, isPurchased: true },
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

  return (
    <div className="min-h-screen bg-canvas text-accent-900">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-sand">
        <Link href="/" className="flex items-center gap-2">
          <Gift className="text-accent-500 w-5 h-5" />
          <span className="font-fraunces text-xl font-bold text-accent-900 tracking-tight">
            BirthdayWhisper
          </span>
        </Link>
        {isSignedIn ? (
          <Link href="/dashboard" className="text-accent-700 hover:text-accent-900 text-sm transition-colors">
            Dashboard →
          </Link>
        ) : (
          <Link href="/sign-up" className="text-accent-700 hover:text-accent-900 text-sm transition-colors">
            Create your page →
          </Link>
        )}
      </nav>

      <main className="max-w-lg mx-auto px-6 py-12">
        {/* Birthday today banner */}
        {isToday && (
          <div className="bg-gradient-to-r from-accent-500 to-accent-400 rounded-xl p-4 text-center mb-8 animate-fade-rise">
            <p className="text-canvas font-bold text-lg">
              🎂 It&apos;s {firstName}&apos;s birthday today!
            </p>
          </div>
        )}

        {/* Profile header */}
        <div className="text-center mb-10 animate-fade-rise">
          <div className="w-20 h-20 rounded-full bg-[rgba(193,97,61,0.12)] border-2 border-[rgba(193,97,61,0.28)] flex items-center justify-center mx-auto mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl || fallbackAvatarDataUri(user.id)}
              alt={user.displayName}
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          <h1 className="font-fraunces text-4xl md:text-5xl font-bold text-accent-900 mb-2">
            {user.displayName}
          </h1>

          {isToday ? (
            <p className="text-accent-500 font-semibold">Their birthday is today!</p>
          ) : (
            <p className="text-accent-700 text-sm">
              Birthday: <span className="text-accent-900">{birthdayLabel}</span>
              {" · "}
              <span className="text-accent-500 font-semibold">{days} day{days !== 1 ? "s" : ""} away</span>
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

        {/* Gift */}
        {GIFTING_ENABLED && !isOwnProfile && (
          <div className="mt-4">
            <GiftSection recipientId={user.id} recipientName={user.displayName} />
          </div>
        )}

        {/* Reaction notification hint */}
        {!isOwnProfile && (
          <div className="mt-4 animate-fade-rise" style={{ animationDelay: "180ms" }}>
            {isSignedIn ? (
              <div className="flex items-start gap-3 card rounded-xl px-4 py-3">
                <Bell className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                <p className="text-accent-700 text-xs leading-relaxed">
                  When {firstName} reacts to your whisper, you&apos;ll get a notification — check the bell icon on your dashboard.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 card rounded-xl px-4 py-3">
                <Bell className="w-4 h-4 text-ghost flex-shrink-0 mt-0.5" />
                <p className="text-ghost text-xs leading-relaxed">
                  <Link href="/sign-up" className="text-accent-500 hover:text-accent-600 underline underline-offset-2 transition-colors">
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
