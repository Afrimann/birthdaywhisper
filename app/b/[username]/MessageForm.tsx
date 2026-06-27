"use client";
import { useState } from "react";
import { Send, User, EyeOff, Check, Lock } from "lucide-react";

const MAX_CHARS = 500;

const THEMES = [
  { id: "CLASSIC",        label: "Classic",        bg: "from-[#1a1a2e] to-[#16213e]",   accent: "bg-gold",            border: "border-gold/40" },
  { id: "GOLDEN_HOUR",   label: "Golden Hour",    bg: "from-[#2d1b00] to-[#5c3200]",   accent: "bg-amber-400",       border: "border-amber-400/40" },
  { id: "MIDNIGHT_STARS",label: "Midnight Stars", bg: "from-[#0a0015] to-[#1a0030]",   accent: "bg-purple-400",      border: "border-purple-400/40" },
  { id: "BLOOM",          label: "Bloom",          bg: "from-[#1a0012] to-[#3d0030]",   accent: "bg-rose-400",        border: "border-rose-400/40" },
  { id: "RETRO",          label: "Retro",          bg: "from-[#0f1500] to-[#1e2e00]",   accent: "bg-lime-400",        border: "border-lime-400/40" },
  { id: "NEON",           label: "Neon",           bg: "from-[#001520] to-[#002a40]",   accent: "bg-cyan-400",        border: "border-cyan-400/40" },
] as const;

type ThemeId = typeof THEMES[number]["id"];

interface Props {
  recipientId: string;
  recipientName: string;
  birthdayYear: number;
  isToday: boolean;
  isSignedIn: boolean;
}

export default function MessageForm({ recipientId, recipientName, birthdayYear, isToday, isSignedIn }: Props) {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [senderName, setSenderName] = useState("");
  const [cardTheme, setCardTheme] = useState<ThemeId>("CLASSIC");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [error, setError] = useState("");

  const firstName = recipientName.split(" ")[0];
  const remaining = MAX_CHARS - content.length;

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          content: content.trim(),
          isAnonymous,
          senderName: isAnonymous ? null : senderName.trim() || null,
          birthdayYear,
          cardTheme,
        }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({})) as { needsAccount?: boolean };
        if (data.needsAccount) {
          setNeedsAccount(true);
        } else {
          setRateLimited(true);
        }
        return;
      }
      if (res.status === 422) {
        setError("Your message contains inappropriate content. Please revise it.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  // Account gate — guest tried to send a second message
  if (needsAccount) {
    return (
      <div className="glass rounded-2xl p-8 text-center animate-fade-rise">
        <div className="w-16 h-16 rounded-full bg-[rgba(242,193,78,0.06)] border border-[rgba(242,193,78,0.18)] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-gold" />
        </div>
        <h2 className="font-fraunces text-xl font-bold text-cream mb-2">
          Create a free account to send more
        </h2>
        <p className="text-stone text-sm mb-6">
          You&apos;ve already sent {firstName} a whisper. Sign up free to send
          another — it only takes a moment.
        </p>
        <a
          href="/sign-up"
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-bright text-canvas font-semibold px-6 py-3 rounded-xl transition-all min-h-[44px]"
        >
          Create Free Account
        </a>
        <p className="text-ghost text-xs mt-4">
          Already have one?{" "}
          <a href="/sign-in" className="text-gold hover:text-gold-bright transition-colors underline underline-offset-2">
            Sign in
          </a>
        </p>
      </div>
    );
  }

  // IP rate limit (signed-in users hitting the 5/hour cap)
  if (rateLimited) {
    return (
      <div className="glass rounded-2xl p-8 text-center animate-fade-rise">
        <div className="w-16 h-16 rounded-full bg-[rgba(242,193,78,0.06)] border border-[rgba(242,193,78,0.18)] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-gold" />
        </div>
        <h2 className="font-fraunces text-xl font-bold text-cream mb-2">
          Message limit reached
        </h2>
        <p className="text-stone text-sm mb-6">
          You&apos;ve hit the hourly limit for whispers to {firstName}. Try again in an hour.
        </p>
        <p className="text-ghost text-xs">You can try again in about an hour</p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="glass rounded-2xl p-8 text-center animate-fade-rise">
        <div className="w-16 h-16 rounded-full bg-[rgba(242,193,78,0.12)] border border-[rgba(242,193,78,0.28)] flex items-center justify-center mx-auto mb-4 animate-lantern">
          <Check className="w-8 h-8 text-gold" />
        </div>
        <h2 className="font-fraunces text-2xl font-bold text-cream mb-2">Whisper sent!</h2>
        <p className="text-stone text-sm mb-2">
          {firstName} won&apos;t see this until{" "}
          {isToday ? "they open their messages today" : "their birthday"}.
          {" "}Your message is sealed 🔒
        </p>
        <p className="text-ghost text-xs mb-6">
          {isAnonymous ? "Sent anonymously" : `Sent as ${senderName || "you"}`}
        </p>

        {isSignedIn ? (
          <button
            onClick={() => { setContent(""); setSent(false); }}
            className="text-gold hover:text-gold-bright text-sm transition-colors underline underline-offset-2"
          >
            Send another message
          </button>
        ) : (
          <div className="space-y-3">
            <a
              href="/sign-up"
              className="block w-full bg-gold hover:bg-gold-bright text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px] flex items-center justify-center text-sm"
            >
              Create free account to send more
            </a>
            <button
              onClick={() => { setContent(""); setSent(false); }}
              className="text-ghost hover:text-stone text-xs transition-colors underline underline-offset-2"
            >
              Send another (guests limited to 1 per person)
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 animate-fade-rise" style={{ animationDelay: "60ms" }}>
      <h2 className="font-fraunces text-xl font-bold text-cream mb-1">
        Leave {firstName} a whisper
      </h2>
      <p className="text-stone text-sm mb-5">
        {isToday
          ? "They can open it right now!"
          : "Sealed until their birthday. They won't see a thing."}
      </p>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
        placeholder={`Write something heartfelt for ${firstName}...`}
        rows={4}
        className="w-full bg-[rgba(11,11,13,0.7)] border border-pitch focus:border-[rgba(242,193,78,0.45)] focus:shadow-[0_0_0_3px_rgba(242,193,78,0.07)] rounded-xl px-4 py-3 text-cream placeholder-ghost outline-none transition-all resize-none text-sm leading-relaxed mb-1"
      />
      <div className="flex justify-end mb-4">
        <span className={`text-xs ${remaining < 50 ? "text-gold" : "text-ghost"}`}>
          {remaining} remaining
        </span>
      </div>

      {/* Card theme picker */}
      <div className="mb-4">
        <p className="text-xs text-stone mb-2">Card theme</p>
        <div className="grid grid-cols-6 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setCardTheme(t.id)}
              title={t.label}
              className={`relative h-10 rounded-lg bg-gradient-to-br ${t.bg} border transition-all ${
                cardTheme === t.id ? `${t.border} ring-2 ring-offset-1 ring-offset-canvas ring-current scale-105` : "border-pitch hover:scale-105"
              }`}
            >
              <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${t.accent}`} />
            </button>
          ))}
        </div>
        <p className="text-xs text-ghost mt-1">{THEMES.find((t) => t.id === cardTheme)?.label}</p>
      </div>

      {/* Anonymous toggle */}
      <button
        type="button"
        onClick={() => setIsAnonymous((a) => !a)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all mb-4 text-left ${
          isAnonymous
            ? "border-[rgba(242,193,78,0.22)] bg-[rgba(242,193,78,0.05)]"
            : "border-pitch bg-[rgba(11,11,13,0.4)]"
        }`}
      >
        {isAnonymous
          ? <EyeOff className="w-4 h-4 text-gold flex-shrink-0" />
          : <User className="w-4 h-4 text-stone flex-shrink-0" />
        }
        <div>
          <p className="text-sm font-medium text-cream leading-none mb-0.5">
            {isAnonymous ? "Sending anonymously" : "Sending with your name"}
          </p>
          <p className="text-xs text-stone">
            {isAnonymous ? "Tap to add your name" : "Tap to go anonymous"}
          </p>
        </div>
      </button>

      {/* Name field when not anonymous */}
      {!isAnonymous && (
        <input
          type="text"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full bg-[rgba(11,11,13,0.7)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-3 text-cream placeholder-ghost outline-none transition-all text-sm mb-4"
        />
      )}

      {/* Error */}
      {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!content.trim() || loading}
        className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-bright disabled:opacity-40 disabled:cursor-not-allowed text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px]"
      >
        {loading ? "Sending..." : (
          <>
            <Send className="w-4 h-4" />
            Send Whisper
          </>
        )}
      </button>

      <p className="text-ghost text-xs text-center mt-4">
        🔒 Sealed until {isToday ? "opened today" : "their birthday"}
      </p>
    </div>
  );
}
