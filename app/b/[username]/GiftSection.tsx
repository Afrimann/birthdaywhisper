"use client";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Gift as GiftIcon, Check } from "lucide-react";
import { avatarDataUri, GIFT_AVATARS, type AvatarGender } from "@/lib/avatars";
import { GIFT_AMOUNT_PRESETS_KOBO, MIN_GIFT_KOBO, MAX_GIFT_KOBO, calculatePlatformFeeKobo } from "@/lib/constants";
import { koboToNaira } from "@/lib/utils";

const NOTE_MAX_CHARS = 300;
const NAME_MAX_CHARS = 40;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  recipientId: string;
  recipientName: string;
}

export default function GiftSection({ recipientId, recipientName }: Props) {
  const [gender, setGender] = useState<AvatarGender>("FEMININE");
  const [avatarSeed, setAvatarSeed] = useState(GIFT_AVATARS.find((a) => a.gender === "FEMININE")!.seed);
  const [amountKobo, setAmountKobo] = useState<number | null>(GIFT_AMOUNT_PRESETS_KOBO[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const firstName = recipientName.split(" ")[0];
  const avatarsForGender = useMemo(
    () =>
      GIFT_AVATARS.filter((a) => a.gender === gender).map((a) => ({
        seed: a.seed,
        dataUri: avatarDataUri(a.seed),
      })),
    [gender],
  );

  const effectiveAmountKobo = customAmount
    ? Math.round(parseFloat(customAmount) * 100)
    : amountKobo;
  const validAmount =
    typeof effectiveAmountKobo === "number" &&
    Number.isFinite(effectiveAmountKobo) &&
    effectiveAmountKobo >= MIN_GIFT_KOBO &&
    effectiveAmountKobo <= MAX_GIFT_KOBO;
  const platformFeeKobo = validAmount ? calculatePlatformFeeKobo(effectiveAmountKobo!) : 0;
  const totalKobo = validAmount ? effectiveAmountKobo! + platformFeeKobo : 0;

  const sendGift = useMutation({
    mutationFn: () =>
      fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          amountKobo: effectiveAmountKobo,
          avatarSeed,
          senderName: senderName.trim() || null,
          senderEmail: senderEmail.trim(),
          note: note.trim() || null,
        }),
      }),
    onSuccess: async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const { authorizationUrl } = await res.json() as { authorizationUrl: string };
      window.location.href = authorizationUrl;
    },
    onError: () => setError("Something went wrong. Please try again."),
  });

  const canSubmit = validAmount && EMAIL_RE.test(senderEmail) && !sendGift.isPending;

  return (
    <div className="card rounded-xl p-6 animate-fade-rise" style={{ animationDelay: "90ms" }}>
      <h2 className="font-fraunces text-xl font-bold text-accent-900 mb-1">
        Send {firstName} a gift
      </h2>
      <p className="text-accent-700 text-sm mb-5">
        Held sealed with the whispers until {firstName}&apos;s birthday, then theirs to withdraw.
      </p>

      {/* Amount presets */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {GIFT_AMOUNT_PRESETS_KOBO.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => { setAmountKobo(preset); setCustomAmount(""); }}
            className={`py-2.5 rounded-xl text-sm font-medium border transition-all min-h-[44px] touch-manipulation ${
              !customAmount && amountKobo === preset
                ? "border-accent-500 bg-[rgba(193,97,61,0.1)] text-accent-500"
                : "border-blush text-accent-700 hover:border-[rgba(193,97,61,0.4)]"
            }`}
          >
            {koboToNaira(preset)}
          </button>
        ))}
      </div>
      <input
        type="number"
        inputMode="decimal"
        min={MIN_GIFT_KOBO / 100}
        max={MAX_GIFT_KOBO / 100}
        value={customAmount}
        onChange={(e) => { setCustomAmount(e.target.value); setAmountKobo(null); }}
        placeholder="Or enter a custom amount (₦)"
        className="w-full bg-[rgba(255,255,255,0.7)] border border-blush focus:border-[rgba(193,97,61,0.45)] rounded-xl px-4 py-3 text-accent-900 placeholder-ghost outline-none transition-all text-sm mb-4"
      />

      {/* Avatar picker */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-accent-700">Pick an avatar</p>
          <div className="flex rounded-full border border-blush overflow-hidden">
            {(["FEMININE", "MASCULINE"] as AvatarGender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => { setGender(g); setAvatarSeed(GIFT_AVATARS.find((a) => a.gender === g)!.seed); }}
                className={`px-3 py-1 text-xs font-medium transition-all touch-manipulation ${
                  gender === g ? "bg-accent-500 text-canvas" : "text-accent-700"
                }`}
              >
                {g === "FEMININE" ? "Feminine" : "Masculine"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {avatarsForGender.map((a, i) => (
            <button
              key={a.seed}
              type="button"
              onClick={() => setAvatarSeed(a.seed)}
              aria-label={`Avatar option ${i + 1}`}
              aria-pressed={avatarSeed === a.seed}
              className={`relative rounded-full overflow-hidden border-2 transition-all aspect-square ${
                avatarSeed === a.seed ? "border-accent-500 scale-105" : "border-transparent hover:border-blush"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.dataUri} alt="" className="w-full h-full" />
            </button>
          ))}
        </div>
      </div>

      {/* Name + email */}
      <input
        type="text"
        value={senderName}
        onChange={(e) => setSenderName(e.target.value.slice(0, NAME_MAX_CHARS))}
        placeholder="Your name (optional, shown to them)"
        className="w-full bg-[rgba(255,255,255,0.7)] border border-blush focus:border-[rgba(193,97,61,0.45)] rounded-xl px-4 py-3 text-accent-900 placeholder-ghost outline-none transition-all text-sm mb-3"
      />
      <input
        type="email"
        value={senderEmail}
        onChange={(e) => setSenderEmail(e.target.value)}
        placeholder="Your email (for payment receipt, kept private)"
        className="w-full bg-[rgba(255,255,255,0.7)] border border-blush focus:border-[rgba(193,97,61,0.45)] rounded-xl px-4 py-3 text-accent-900 placeholder-ghost outline-none transition-all text-sm mb-3"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_CHARS))}
        placeholder="Add a short note (optional)"
        rows={2}
        className="w-full bg-[rgba(255,255,255,0.7)] border border-blush focus:border-[rgba(193,97,61,0.45)] rounded-xl px-4 py-3 text-accent-900 placeholder-ghost outline-none transition-all resize-none text-sm mb-4"
      />

      {/* Fee breakdown */}
      {validAmount && (
        <div className="rounded-xl border border-blush px-4 py-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between text-accent-700">
            <span>Gift to {firstName}</span>
            <span>{koboToNaira(effectiveAmountKobo!)}</span>
          </div>
          <div className="flex justify-between text-accent-700">
            <span>Platform fee</span>
            <span>{koboToNaira(platformFeeKobo)}</span>
          </div>
          <div className="flex justify-between text-accent-900 font-semibold pt-1 border-t border-blush">
            <span>Total</span>
            <span>{koboToNaira(totalKobo)}</span>
          </div>
        </div>
      )}

      {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}

      <button
        type="button"
        onClick={() => { setError(""); sendGift.mutate(); }}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px]"
      >
        {sendGift.isPending ? "Starting payment..." : (
          <>
            <GiftIcon className="w-4 h-4" />
            {validAmount ? `Gift ${koboToNaira(totalKobo)}` : "Gift"}
          </>
        )}
      </button>

      <p className="text-ghost text-xs text-center mt-4 flex items-center justify-center gap-1">
        <Check className="w-3 h-3" /> Held sealed until {firstName}&apos;s birthday
      </p>
    </div>
  );
}
