import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import Link from "next/link";

export default async function WishlistPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-canvas text-cream">
      <nav className="border-b border-[rgba(242,193,78,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="text-gold w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-cream tracking-tight">Wishlist</span>
        </div>
        <Link href="/dashboard" className="text-stone hover:text-cream text-sm transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[rgba(242,193,78,0.07)] border border-[rgba(242,193,78,0.15)] flex items-center justify-center mx-auto mb-6">
          <Star className="w-9 h-9 text-gold opacity-60" />
        </div>
        <h1 className="font-fraunces text-2xl font-bold text-cream mb-3">Wishlist coming soon</h1>
        <p className="text-stone text-sm mb-8">
          Soon you&apos;ll be able to share what you&apos;d love for your birthday — and let friends
          mark items without spoiling the surprise.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gold hover:text-gold-bright text-sm transition-colors underline underline-offset-2"
        >
          Back to Dashboard
        </Link>
      </main>
    </div>
  );
}
