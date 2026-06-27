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

  const claimMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/wishlist/${id}/claim`, { method: "POST" }).then((r) => r.json()),
    onMutate: (id) => {
      const snapshot = items;
      setItems((cur) => cur.map((i) => (i.id === id ? { ...i, isPurchased: true } : i)));
      return { prev: snapshot };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) setItems(ctx.prev);
    },
  });

  const unclaimMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/wishlist/${id}/claim`, { method: "DELETE" }).then((r) => r.json()),
    onMutate: (id) => {
      const snapshot = items;
      setItems((cur) => cur.map((i) => (i.id === id ? { ...i, isPurchased: false } : i)));
      return { prev: snapshot };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) setItems(ctx.prev);
    },
  });

  return (
    <div className="mb-10 animate-fade-rise" style={{ animationDelay: "120ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-gold" />
        <h2 className="text-cream font-semibold text-sm uppercase tracking-wider">
          {firstName}&apos;s Wishlist
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isClaiming =
            (claimMutation.isPending && claimMutation.variables === item.id) ||
            (unclaimMutation.isPending && unclaimMutation.variables === item.id);

          return (
            <div key={item.id} className="glass rounded-2xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-cream font-medium text-sm">{item.title}</p>
                  {item.isPurchased && !isOwnProfile && (
                    <span className="text-xs bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.25)] text-green-400 px-2 py-0.5 rounded-full">
                      Someone&apos;s getting this!
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-stone text-xs mt-1">{item.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {item.priceRange && (
                    <span className="text-gold text-xs font-medium">{item.priceRange}</span>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-stone hover:text-gold text-xs transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                </div>
              </div>

              {/* Owners see items without claim status to preserve surprise */}
              {!isOwnProfile && (
                <div className="shrink-0">
                  {item.isPurchased ? (
                    <button
                      onClick={() => unclaimMutation.mutate(item.id)}
                      disabled={isClaiming}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.25)] text-green-400 text-xs font-medium rounded-xl transition-all hover:bg-[rgba(74,222,128,0.18)] disabled:opacity-50 touch-manipulation"
                    >
                      <Check className="w-3 h-3" /> I&apos;ll get it
                    </button>
                  ) : (
                    <button
                      onClick={() => claimMutation.mutate(item.id)}
                      disabled={isClaiming}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(242,193,78,0.08)] border border-[rgba(242,193,78,0.2)] text-gold text-xs font-medium rounded-xl transition-all hover:bg-[rgba(242,193,78,0.15)] disabled:opacity-50 touch-manipulation"
                    >
                      I&apos;ll get it
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
