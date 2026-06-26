import Link from "next/link";
import { Gift, Star, Lock, BookOpen, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-800 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-navy-800/80 backdrop-blur-md border-b border-navy-600/30">
        <div className="flex items-center gap-2">
          <Gift className="text-violet-500 w-6 h-6" />
          <span className="font-playfair text-xl font-bold text-white">BirthdayWhisper</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-slate-300 hover:text-white text-sm transition-colors">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm px-4 py-1.5 rounded-full mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Your birthday, reimagined</span>
          </div>

          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            The messages they&apos;ll{" "}
            <span className="text-violet-400">never expect.</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Create your birthday page. Share the link. Let people leave you secret messages —
            sealed until your special day.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all hover:shadow-glow"
            >
              Create My Birthday Page
            </Link>
            <Link
              href="#how-it-works"
              className="border border-navy-600 hover:border-violet-500 text-slate-300 hover:text-white font-medium px-8 py-4 rounded-full text-lg transition-all"
            >
              See How It Works
            </Link>
          </div>

          <p className="text-slate-500 text-sm mt-8">
            Free to use · No card required · Beautiful on mobile
          </p>
        </div>

        {/* Preview card */}
        <div className="relative z-10 mt-20 max-w-sm mx-auto">
          <div className="bg-navy-700 border border-navy-600 rounded-2xl p-6 shadow-card text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">A</div>
              <div>
                <p className="text-white font-semibold text-sm">Amara&apos;s Birthday</p>
                <p className="text-violet-400 text-xs">Opens in 12 days</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>17 whispers sealed &amp; waiting</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gradient-to-br from-violet-700 to-violet-900 border border-violet-600/40"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-playfair text-4xl font-bold text-center text-white mb-4">
            How it works
          </h2>
          <p className="text-slate-400 text-center mb-16">Ready in under a minute.</p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", icon: Gift, title: "Set your birthday", desc: "Create your page and set your birthday month and day." },
              { step: "2", icon: Star, title: "Share your link", desc: "Post it on WhatsApp, Instagram, or anywhere you like." },
              { step: "3", icon: Lock, title: "Messages are sealed", desc: "Friends leave whispers — you won't see them until your day." },
              { step: "4", icon: BookOpen, title: "Open on your birthday", desc: "Enjoy a cinematic reveal with card flips and confetti." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <div className="text-violet-500 text-xs font-bold mb-2">STEP {step}</div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-playfair text-4xl font-bold text-white mb-4">
            Your birthday is coming.
          </h2>
          <p className="text-slate-400 mb-8">Be ready. Start collecting whispers today.</p>
          <Link
            href="/sign-up"
            className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-semibold px-10 py-4 rounded-full text-lg transition-all hover:shadow-glow"
          >
            Create My Birthday Page Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-600/40 py-8 px-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gift className="w-4 h-4 text-violet-500" />
          <span className="font-playfair text-white">BirthdayWhisper</span>
        </div>
        <p>Made with care · &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
