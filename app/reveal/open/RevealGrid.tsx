"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const REACTIONS = ["🥰", "😭", "🤣", "🔥", "💖", "🫶"] as const;

export interface MessageCard {
  id: string;
  content: string;
  senderName: string | null;
  isAnonymous: boolean;
  status: string;
  reactionEmoji: string | null;
  cardTheme: string | null;
}

const THEME_STYLES: Record<string, { bg: string; accent: string; glow: string }> = {
  CLASSIC:        { bg: "bg-gradient-to-br from-[#1a1a2e] to-[#16213e]",  accent: "text-gold",       glow: "rgba(242,193,78,0.25)"  },
  GOLDEN_HOUR:    { bg: "bg-gradient-to-br from-[#2d1b00] to-[#5c3200]",  accent: "text-amber-400",  glow: "rgba(251,191,36,0.25)"  },
  MIDNIGHT_STARS: { bg: "bg-gradient-to-br from-[#0a0015] to-[#1a0030]",  accent: "text-purple-400", glow: "rgba(192,132,252,0.25)" },
  BLOOM:          { bg: "bg-gradient-to-br from-[#1a0012] to-[#3d0030]",  accent: "text-rose-400",   glow: "rgba(251,113,133,0.25)" },
  RETRO:          { bg: "bg-gradient-to-br from-[#0f1500] to-[#1e2e00]",  accent: "text-lime-400",   glow: "rgba(163,230,53,0.25)"  },
  NEON:           { bg: "bg-gradient-to-br from-[#001520] to-[#002a40]",  accent: "text-cyan-400",   glow: "rgba(34,211,238,0.25)"  },
};

function launchConfetti() {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d")!;

  const colors = ["#F2C14E", "#FFD874", "#F4F1EA", "#ffffff", "#E8C547", "#FFC2E2"];
  type P = { x:number; y:number; vx:number; vy:number; w:number; h:number; color:string; angle:number; spin:number; alpha:number };

  const particles: P[] = Array.from({ length: 150 }, () => ({
    x:     Math.random() * canvas.width,
    y:     -20 - Math.random() * canvas.height * 0.25,
    vx:    (Math.random() - 0.5) * 5,
    vy:    Math.random() * 4 + 2,
    w:     Math.random() * 11 + 5,
    h:     Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.15,
    alpha: 1,
  }));

  let frame = 0;
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
      if (frame > 80) p.alpha -= 0.012;
      if (p.alpha > 0 && p.y < canvas.height) alive = true;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) requestAnimationFrame(tick);
    else canvas.remove();
  }
  requestAnimationFrame(tick);
}

export default function RevealGrid({ messages }: { messages: MessageCard[] }) {
  const [flipped, setFlipped] = useState<Set<string>>(
    () => new Set(messages.filter((m) => m.status === "REVEALED").map((m) => m.id))
  );
  const [reactions, setReactions] = useState<Record<string, string>>(
    () => Object.fromEntries(messages.filter((m) => m.reactionEmoji).map((m) => [m.id, m.reactionEmoji!]))
  );
  const [celebrated, setCelebrated] = useState(false);

  const revealCard = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/messages/${id}/reveal`, { method: "PATCH" }),
  });

  const reactToCard = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      fetch(`/api/messages/${id}/react`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      }),
  });

  const flipCard = useCallback(
    (id: string) => {
      if (flipped.has(id)) return;
      const next = new Set(flipped);
      next.add(id);
      setFlipped(next);

      if (next.size === messages.length && !celebrated) {
        setTimeout(() => {
          setCelebrated(true);
          launchConfetti();
        }, 650);
      }

      revealCard.mutate(id);
    },
    // revealCard.mutate is a stable reference from useMutation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flipped, messages.length, celebrated]
  );

  const pickReaction = useCallback((id: string, emoji: string) => {
    setReactions((prev) => ({ ...prev, [id]: emoji }));
    reactToCard.mutate({ id, emoji });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (messages.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-fraunces text-2xl font-bold text-cream mb-2">No whispers yet</p>
        <p className="text-stone text-sm">Share your birthday link to collect messages.</p>
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence>
        {celebrated && (
          <motion.div
            key="banner"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-8 bg-gradient-to-r from-gold to-gold-bright rounded-2xl p-6 text-center"
          >
            <p className="font-fraunces text-2xl font-bold text-canvas">
              You&apos;ve read all your whispers!
            </p>
            <p className="text-canvas/70 text-sm mt-1">Happy Birthday 🎂</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {messages.map((msg, i) => {
          const isFlipped  = flipped.has(msg.id);
          const reaction   = reactions[msg.id];
          const theme      = THEME_STYLES[msg.cardTheme ?? "CLASSIC"] ?? THEME_STYLES.CLASSIC;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              style={{ perspective: "1000px", minHeight: "220px" }}
              className="relative"
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  transformStyle: "preserve-3d",
                  position: "relative",
                  minHeight: "220px",
                  height: "100%",
                }}
              >
                {/* ── Front (sealed, themed) ── */}
                <div
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    boxShadow: `0 0 24px ${theme.glow}`,
                  }}
                  onClick={() => flipCard(msg.id)}
                  className={`absolute inset-0 ${theme.bg} border border-[rgba(255,255,255,0.08)] rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[rgba(255,255,255,0.18)] transition-all group`}
                >
                  <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] flex items-center justify-center animate-lantern">
                    <Gift className={`w-7 h-7 ${theme.accent}`} />
                  </div>
                  <p className="text-white/40 text-xs group-hover:text-white/60 transition-colors">
                    Tap to open
                  </p>
                </div>

                {/* ── Back (message) ── */}
                <div
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  className="absolute inset-0 glass rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
                >
                  <p className="text-cream text-sm leading-relaxed flex-1 overflow-y-auto">
                    {msg.content}
                  </p>

                  <div className="border-t border-[rgba(242,193,78,0.08)] pt-3 flex-shrink-0">
                    <p className="text-ghost text-xs mb-2">
                      — {msg.isAnonymous ? "Anonymous" : (msg.senderName ?? "Anonymous")}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => pickReaction(msg.id, emoji)}
                          className={cn(
                            "text-base leading-none rounded-lg px-1.5 py-1 transition-all",
                            reaction === emoji
                              ? "bg-[rgba(242,193,78,0.2)] ring-1 ring-[rgba(242,193,78,0.5)] scale-110"
                              : "hover:bg-[rgba(242,193,78,0.1)] hover:scale-110"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
