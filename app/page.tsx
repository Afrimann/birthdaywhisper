import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Star, Lock, BookOpen, Sparkles, LayoutDashboard, Heart, Zap } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import LandingNav from "./_components/LandingNav";
import ConfettiBackground from "./_components/ConfettiBackground";

export const metadata: Metadata = {
  title: {
    absolute: "BirthdayWhisper — The messages they'll never expect",
  },
  description:
    "Create your birthday page, share the link, and let people leave you secret messages — sealed and revealed only on your birthday. Free forever.",
  alternates: { canonical: "/" },
};

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="min-h-screen bg-canvas text-accent-900 overflow-x-hidden">
      <ConfettiBackground />
      <LandingNav isSignedIn={isSignedIn} />

      {/* Hero */}
      <section className="relative min-h-screen px-6 pt-32 pb-20 flex items-center">
        {/* Ambient glow — one, subtle */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-[rgba(193,97,61,0.04)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 items-center gap-16 w-full">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[rgba(193,97,61,0.08)] border border-[rgba(193,97,61,0.2)] text-accent-500 text-sm px-4 py-1.5 rounded-full mb-8 animate-fade-rise">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Your birthday, reimagined</span>
            </div>

            <h1
              className="font-fraunces text-5xl md:text-7xl font-bold text-accent-900 mb-6 leading-[1.1] animate-fade-rise"
              style={{ animationDelay: "60ms" }}
            >
              The messages they&apos;ll{" "}
              <span className="text-accent-500 italic">never expect.</span>
            </h1>

            <p
              className="text-accent-700 text-lg md:text-xl mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-rise"
              style={{ animationDelay: "120ms" }}
            >
              Create your birthday page. Share the link. Let people leave you secret messages —
              sealed until your special day.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-rise"
              style={{ animationDelay: "180ms" }}
            >
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="bg-accent-500 hover:bg-accent-600 text-canvas font-semibold px-8 py-4 rounded-full text-lg transition-all hover:shadow-accent min-h-[56px] flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Go to My Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="bg-accent-500 hover:bg-accent-600 text-canvas font-semibold px-8 py-4 rounded-full text-lg transition-all hover:shadow-accent min-h-[56px] flex items-center justify-center"
                  >
                    Create My Birthday Page
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="border border-sand bg-[rgba(255,255,255,0.6)] text-accent-700 hover:text-accent-900 font-medium px-8 py-4 rounded-full text-lg transition-all min-h-[56px] flex items-center justify-center"
                  >
                    See How It Works
                  </Link>
                </>
              )}
            </div>

            {!isSignedIn && (
              <p
                className="text-ghost text-sm mt-8 animate-fade-rise"
                style={{ animationDelay: "240ms" }}
              >
                Free to use · No card required · Beautiful on mobile
              </p>
            )}
          </div>

          {/* Right: stacked preview cards */}
          <div
            className="relative mx-auto lg:mx-0 max-w-sm w-full animate-fade-rise"
            style={{ animationDelay: "300ms" }}
          >
            {/* Card peeking out behind, for depth */}
            <div className="absolute inset-0 card rounded-xl rotate-3 translate-x-3 translate-y-3" />

            <div className="relative card rounded-xl p-6 text-left shadow-[0_12px_40px_rgba(20,15,15,0.08)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(193,97,61,0.15)] border border-[rgba(193,97,61,0.3)] flex items-center justify-center text-accent-500 font-bold text-sm font-fraunces">
                  A
                </div>
                <div>
                  <p className="text-accent-900 font-semibold text-sm">Amara&apos;s Birthday</p>
                  <p className="text-accent-500 text-xs">Opens in 12 days</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-accent-700 text-sm mb-4">
                <Lock className="w-3.5 h-3.5 text-accent-500" />
                <span>17 whispers sealed &amp; waiting</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-gradient-to-br from-[rgba(193,97,61,0.14)] to-[rgba(193,97,61,0.04)] border border-[rgba(193,97,61,0.1)]"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Thin divider glow */}
      <div className="h-px bg-gradient-to-r from-transparent via-[rgba(193,97,61,0.15)] to-transparent" />

      {/* How it works */}
      <section id="how-it-works" className="py-28 px-6 relative">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[rgba(193,97,61,0.08)] border border-[rgba(193,97,61,0.2)] text-accent-500 text-sm px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simple by design</span>
            </div>
            <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-accent-900 mb-4">
              How it works
            </h2>
            <p className="text-accent-700 text-lg max-w-sm mx-auto">
              Four steps. Zero effort. One unforgettable birthday.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            {[
              {
                step: "01",
                icon: Gift,
                title: "Set your birthday",
                desc: "Create your page in under a minute. Tell us your birthday and pick a username.",
                accent: "60 seconds flat",
              },
              {
                step: "02",
                icon: Star,
                title: "Share your link",
                desc: "Drop it on WhatsApp, Instagram, your bio — anywhere your people actually are.",
                accent: "One link, infinite love",
              },
              {
                step: "03",
                icon: Lock,
                title: "Messages stay sealed",
                desc: "Friends write whispers but you literally cannot see them. The wait is the gift.",
                accent: "The suspense is delicious",
              },
              {
                step: "04",
                icon: BookOpen,
                title: "Reveal on your day",
                desc: "Wake up to a cinematic unboxing. Flip each card, read every word, feel everything.",
                accent: "This is the moment",
              },
            ].map(({ step, icon: Icon, title, desc, accent }, i) => {
              const gold = i % 2 === 1;
              return (
              <div
                key={step}
                className={`card rounded-xl p-6 flex flex-col gap-4 transition-all duration-300 group ${gold ? "hover:border-[rgba(111,122,74,0.28)]" : "hover:border-[rgba(193,97,61,0.28)]"}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    gold
                      ? "bg-[rgba(111,122,74,0.1)] border border-[rgba(111,122,74,0.2)] group-hover:bg-[rgba(111,122,74,0.16)]"
                      : "bg-[rgba(193,97,61,0.1)] border border-[rgba(193,97,61,0.2)] group-hover:bg-[rgba(193,97,61,0.16)]"
                  }`}>
                    <Icon className={`w-5 h-5 ${gold ? "text-gold" : "text-accent-500"}`} />
                  </div>
                  <span className={`font-fraunces text-4xl font-bold transition-colors select-none ${
                    gold
                      ? "text-[rgba(111,122,74,0.12)] group-hover:text-[rgba(111,122,74,0.22)]"
                      : "text-[rgba(193,97,61,0.1)] group-hover:text-[rgba(193,97,61,0.2)]"
                  }`}>
                    {step}
                  </span>
                </div>
                <div>
                  <h3 className="text-accent-900 font-semibold mb-2 text-sm">{title}</h3>
                  <p className="text-accent-700 text-sm leading-relaxed">{desc}</p>
                </div>
                <p className="text-accent-500 text-xs font-medium mt-auto italic opacity-80">{accent}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features / Why BirthdayWhisper */}
      <section className="py-28 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-accent-900 mb-4">
              Built for the feeling
            </h2>
            <p className="text-accent-700 text-lg">Not just another birthday tool. A whole vibe.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Tall card — The secret */}
            <div className="card rounded-xl p-8 md:row-span-2 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-[rgba(193,97,61,0.1)] border border-[rgba(193,97,61,0.2)] flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-accent-500" />
              </div>
              <h3 className="font-fraunces text-2xl font-bold text-accent-900 mb-3">
                The secret stays safe
              </h3>
              <p className="text-accent-700 leading-relaxed mb-4">
                You literally cannot see the messages until your birthday. No peeking, no spoilers —
                just the sweet anticipation of knowing they&apos;re there, sealed and waiting for you.
              </p>
              <p className="text-accent-700 leading-relaxed">
                It&apos;s like knowing your presents are under the tree but not being allowed to shake them.
                Except these gifts are words, and words last forever.
              </p>
              <div className="mt-auto pt-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-accent-700 text-xs">Messages sealed</span>
                  <span className="text-accent-500 text-sm font-semibold">17 whispers</span>
                </div>
                <div className="h-2 rounded-full bg-[rgba(193,97,61,0.08)] overflow-hidden">
                  <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-accent-700 via-accent-500 to-accent-300" />
                </div>
                <p className="text-ghost text-xs mt-2">Opens on your birthday</p>
              </div>
            </div>

            {/* Cinematic reveal */}
            <div className="card rounded-xl p-8">
              <div className="w-12 h-12 rounded-xl bg-[rgba(111,122,74,0.1)] border border-[rgba(111,122,74,0.2)] flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-fraunces text-xl font-bold text-accent-900 mb-2">Cinematic reveal</h3>
              <p className="text-accent-700 text-sm leading-relaxed">
                Flip through each whisper like opening presents — one by one. Confetti rains down.
                You laugh, you cry, you screenshot everything. It&apos;s a whole production.
              </p>
            </div>

            {/* Zero friction */}
            <div className="card rounded-xl p-8">
              <div className="w-12 h-12 rounded-xl bg-[rgba(193,97,61,0.1)] border border-[rgba(193,97,61,0.2)] flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-accent-500" />
              </div>
              <h3 className="font-fraunces text-xl font-bold text-accent-900 mb-2">
                Zero friction for friends
              </h3>
              <p className="text-accent-700 text-sm leading-relaxed">
                No app download. No sign-up required. Your friends click the link, type their message,
                and they&apos;re done. The simpler it is, the more whispers you get.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Whispers */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(193,97,61,0.015)] to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[rgba(193,97,61,0.08)] border border-[rgba(193,97,61,0.2)] text-accent-500 text-sm px-4 py-1.5 rounded-full mb-6">
              <Heart className="w-3.5 h-3.5" />
              <span>Sample whispers</span>
            </div>
            <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-accent-900 mb-4">
              What a whisper feels like
            </h2>
            <p className="text-accent-700 text-lg">The kind of words you never knew you needed to hear.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                from: "Your bestie, Zoe",
                initial: "Z",
                msg: "You carry sunshine in your back pocket and you don't even know it. Happy birthday to the most genuinely kind person I know.",
                emoji: "☀️",
              },
              {
                from: "Anonymous",
                initial: "?",
                msg: "Watching you grow this year has been one of my greatest joys. You're becoming exactly who you're meant to be. I'm so proud of you.",
                emoji: "🌱",
              },
              {
                from: "Mom",
                initial: "M",
                msg: "23 years ago you changed everything. Every single day since then has been better because of you. I love you more than words can hold.",
                emoji: "🤍",
              },
            ].map(({ from, initial, msg, emoji }) => (
              <div
                key={from}
                className="card rounded-xl p-6 flex flex-col gap-4 hover:border-[rgba(193,97,61,0.22)] transition-all duration-300"
              >
                <div className="text-3xl">{emoji}</div>
                <p className="text-accent-900 text-sm leading-relaxed flex-1 italic">
                  &ldquo;{msg}&rdquo;
                </p>
                <div className="flex items-center gap-2 pt-4 border-t border-sand">
                  <div className="w-8 h-8 rounded-full bg-[rgba(193,97,61,0.12)] border border-[rgba(193,97,61,0.25)] flex items-center justify-center text-xs font-bold text-accent-500 font-fraunces flex-shrink-0">
                    {initial}
                  </div>
                  <span className="text-accent-700 text-xs">{from}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — only show to logged-out visitors */}
      {!isSignedIn && (
        <section className="py-28 px-6 text-center relative">
          <div className="max-w-2xl mx-auto relative z-10">
            <div className="text-6xl mb-6 animate-float inline-block">🎂</div>
            <h2 className="font-fraunces text-4xl md:text-6xl font-bold text-accent-900 mb-4">
              Your birthday is coming.
            </h2>
            <p className="text-accent-700 text-lg mb-2">Will you let it pass like any other day?</p>
            <p className="text-accent-500 font-medium text-lg mb-10">Or will you make it unforgettable?</p>

            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-canvas font-semibold px-12 py-4 rounded-full text-lg transition-all hover:shadow-accent min-h-[56px] group"
            >
              <Gift className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Create My Birthday Page Free
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-accent-700 text-sm">
              {["Free forever", "No card required", "Beautiful on mobile"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[rgba(193,97,61,0.15)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-sand py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-accent-500" />
          <span className="font-fraunces text-accent-900 text-base font-bold">BirthdayWhisper</span>
        </div>
        <p className="text-ghost text-sm mb-1">Birthdays worth remembering.</p>
        <p className="text-ghost text-sm">Made with care · &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
