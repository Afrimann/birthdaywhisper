"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star, ExternalLink, Check } from "lucide-react";

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  priceRange: string | null;
  isPurchased: boolean;
}

interface Props {
  items: WishlistItem[];
  firstName: string;
  isOwnProfile: boolean;
}

export default function WishlistSection({ items: initial, firstName, isOwnProfile }: Props) {
  const [items, setItems] = useState(initial);
  // Tracks which items THIS browser claimed during the current visit, so an
  // undo button never appears for a claim that belongs to someone else.
  // Session-only (not persisted): server-side ownership (see the claim API
  // route) is the actual security boundary, not this — this is just so a
  // stranger doesn't see an undo button that isn't theirs to use.
  const [claimedByMe, setClaimedByMe] = useState<Set<string>>(new Set());

  const claimMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/wishlist/${id}/claim`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Could not claim this item");
      return res.json();
    },
    onMutate: (id) => {
      const snapshot = items;
      setItems((cur) => cur.map((i) => (i.id === id ? { ...i, isPurchased: true } : i)));
      return { prev: snapshot };
    },
    onSuccess: (_data, id) => setClaimedByMe((cur) => new Set(cur).add(id)),
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) setItems(ctx.prev);
    },
  });

  const unclaimMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/wishlist/${id}/claim`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Could not undo this claim");
      return res.json();
    },
    onMutate: (id) => {
      const snapshot = items;
      setItems((cur) => cur.map((i) => (i.id === id ? { ...i, isPurchased: false } : i)));
      return { prev: snapshot };
    },
    onSuccess: (_data, id) =>
      setClaimedByMe((cur) => {
        const next = new Set(cur);
        next.delete(id);
        return next;
      }),
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) setItems(ctx.prev);
    },
  });

  return (
    <div className="mb-10 animate-fade-rise" style={{ animationDelay: "120ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-accent-500" />
        <h2 className="text-accent-900 font-semibold text-sm uppercase tracking-wider">
          {firstName}&apos;s Wishlist
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isClaiming =
            (claimMutation.isPending && claimMutation.variables === item.id) ||
            (unclaimMutation.isPending && unclaimMutation.variables === item.id);

          return (
            <div key={item.id} className="card rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-accent-900 font-medium text-sm">{item.title}</p>
                  {item.isPurchased && !isOwnProfile && (
                    <span className="text-xs bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.25)] text-green-400 px-2 py-0.5 rounded-full">
                      Someone&apos;s getting this!
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-accent-700 text-xs mt-1">{item.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {item.priceRange && (
                    <span className="text-accent-500 text-xs font-medium">{item.priceRange}</span>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-accent-700 hover:text-accent-600 text-xs transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                </div>
              </div>

              {/* Owners see items without claim status to preserve surprise.
                  A claimed item only shows an undo button to the browser
                  that claimed it — anyone else just sees the badge above. */}
              {!isOwnProfile && (
                <div className="shrink-0">
                  {item.isPurchased && claimedByMe.has(item.id) ? (
                    <button
                      onClick={() => unclaimMutation.mutate(item.id)}
                      disabled={isClaiming}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.25)] text-green-400 text-xs font-medium rounded-xl transition-all hover:bg-[rgba(74,222,128,0.18)] disabled:opacity-50 touch-manipulation"
                    >
                      <Check className="w-3 h-3" /> Undo &mdash; I claimed this
                    </button>
                  ) : !item.isPurchased ? (
                    <button
                      onClick={() => claimMutation.mutate(item.id)}
                      disabled={isClaiming}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(193,97,61,0.08)] border border-[rgba(193,97,61,0.2)] text-accent-500 text-xs font-medium rounded-xl transition-all hover:bg-[rgba(193,97,61,0.15)] disabled:opacity-50 touch-manipulation"
                    >
                      I&apos;ll get it
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
