"use client";
import { useState } from "react";
import { Send, User, EyeOff, Check } from "lucide-react";

const MAX_CHARS = 500;

interface Props {
  recipientId: string;
  recipientName: string;
  birthdayYear: number;
  isToday: boolean;
}

export default function MessageForm({ recipientId, recipientName, birthdayYear, isToday }: Props) {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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
        }),
      });

      if (res.status === 429) {
        setError("You've sent too many messages recently. Try again in an hour.");
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
        <button
          onClick={() => { setContent(""); setSent(false); }}
          className="text-gold hover:text-gold-bright text-sm transition-colors underline underline-offset-2"
        >
          Send another message
        </button>
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
