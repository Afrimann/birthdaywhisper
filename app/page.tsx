import Link from "next/link";
import { Gift, Star, Lock, BookOpen, Sparkles, LayoutDashboard } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import LandingNav from "./_components/LandingNav";

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="min-h-screen bg-canvas text-cream overflow-x-hidden">
      <LandingNav isSignedIn={isSignedIn} />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-[rgba(242,193,78,0.055)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-2/3 left-1/4 w-64 h-64 bg-[rgba(242,193,78,0.03)] rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgba(242,193,78,0.08)] border border-[rgba(242,193,78,0.2)] text-gold text-sm px-4 py-1.5 rounded-full mb-8 animate-fade-rise">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Your birthday, reimagined</span>
          </div>

          <h1
            className="font-fraunces text-5xl md:text-7xl font-bold text-cream mb-6 leading-[1.1] animate-fade-rise"
            style={{ animationDelay: "60ms" }}
          >
            The messages they&apos;ll{" "}
            <span className="text-gold italic">never expect.</span>
          </h1>

          <p
            className="text-stone text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed animate-fade-rise"
            style={{ animationDelay: "120ms" }}
          >
            Create your birthday page. Share the link. Let people leave you secret messages —
            sealed until your special day.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-rise"
            style={{ animationDelay: "180ms" }}
          >
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="bg-gold hover:bg-gold-bright text-canvas font-semibold px-8 py-4 rounded-full text-lg transition-all hover:shadow-gold min-h-[56px] flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                Go to My Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="bg-gold hover:bg-gold-bright text-canvas font-semibold px-8 py-4 rounded-full text-lg transition-all hover:shadow-gold min-h-[56px] flex items-center justify-center"
                >
                  Create My Birthday Page
                </Link>
                <Link
                  href="#how-it-works"
                  className="border border-[rgba(242,193,78,0.2)] bg-[rgba(22,21,25,0.45)] backdrop-blur-sm text-stone hover:text-cream font-medium px-8 py-4 rounded-full text-lg transition-all min-h-[56px] flex items-center justify-center"
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

        {/* Preview card */}
        <div
          className="relative z-10 mt-20 max-w-sm w-full mx-auto animate-fade-rise"
          style={{ animationDelay: "300ms" }}
        >
          <div className="glass rounded-2xl p-6 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[rgba(242,193,78,0.15)] border border-[rgba(242,193,78,0.3)] flex items-center justify-center text-gold font-bold text-sm font-fraunces">
                A
              </div>
              <div>
                <p className="text-cream font-semibold text-sm">Amara&apos;s Birthday</p>
                <p className="text-gold text-xs">Opens in 12 days</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-stone text-sm mb-4">
              <Lock className="w-3.5 h-3.5 text-gold" />
              <span>17 whispers sealed &amp; waiting</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gradient-to-br from-[rgba(242,193,78,0.14)] to-[rgba(242,193,78,0.04)] border border-[rgba(242,193,78,0.1)]"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-fraunces text-4xl font-bold text-center text-cream mb-4">
            How it works
          </h2>
          <p className="text-stone text-center mb-16">Ready in under a minute.</p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", icon: Gift,     title: "Set your birthday",      desc: "Create your page and set your birthday month and day." },
              { step: "2", icon: Star,     title: "Share your link",        desc: "Post it on WhatsApp, Instagram, or anywhere you like." },
              { step: "3", icon: Lock,     title: "Messages are sealed",    desc: "Friends leave whispers — you won't see them until your day." },
              { step: "4", icon: BookOpen, title: "Open on your birthday",  desc: "Enjoy a cinematic reveal with card flips and confetti." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[rgba(242,193,78,0.08)] border border-[rgba(242,193,78,0.2)] flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <div className="text-gold text-xs font-bold mb-2 tracking-widest">STEP {step}</div>
                <h3 className="text-cream font-semibold mb-2">{title}</h3>
                <p className="text-stone text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — only show to logged-out visitors */}
      {!isSignedIn && (
        <section className="py-24 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="font-fraunces text-4xl font-bold text-cream mb-4">
              Your birthday is coming.
            </h2>
            <p className="text-stone mb-8">Be ready. Start collecting whispers today.</p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center bg-gold hover:bg-gold-bright text-canvas font-semibold px-10 py-4 rounded-full text-lg transition-all hover:shadow-gold min-h-[56px]"
            >
              Create My Birthday Page Free
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[rgba(242,193,78,0.08)] py-8 px-6 text-center text-ghost text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gift className="w-4 h-4 text-gold" />
          <span className="font-fraunces text-cream">BirthdayWhisper</span>
        </div>
        <p>Made with care · &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
