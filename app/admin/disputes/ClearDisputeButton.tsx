"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Check } from "lucide-react";

export default function ClearDisputeButton({ giftId, onCleared }: { giftId: string; onCleared: () => void }) {
  const clear = useMutation({
    mutationFn: () =>
      fetch(`/api/admin/gifts/${giftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-dispute" }),
      }).then((r) => {
        if (!r.ok) throw new Error("Could not clear dispute");
        return r.json();
      }),
    onSuccess: onCleared,
  });

  return (
    <button
      onClick={() => clear.mutate()}
      disabled={clear.isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-canvas text-xs font-medium rounded-lg transition-all touch-manipulation"
    >
      {clear.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      Clear dispute
    </button>
  );
}
