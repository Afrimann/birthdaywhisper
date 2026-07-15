"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2 } from "lucide-react";

interface PendingAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  nameMatchStrength: string | null;
  createdAt: string;
  user: { id: string; username: string; displayName: string };
}

export default function PayoutReviewActions() {
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isPending } = useQuery<{ accounts: PendingAccount[] }>({
    queryKey: ["admin-payout-review"],
    queryFn: () => fetch("/api/admin/payout-accounts").then((r) => r.json()),
  });

  const review = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string }) =>
      fetch(`/api/admin/payout-accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      }).then(async (r) => {
        const json = await r.json().catch(() => ({})) as { error?: string };
        if (!r.ok) throw new Error(json.error ?? "Action failed");
        return json;
      }),
    onSuccess: () => {
      setRejectingId(null);
      setRejectionReason("");
      qc.invalidateQueries({ queryKey: ["admin-payout-review"] });
    },
  });

  return (
    <div className="card rounded-xl overflow-hidden">
      {isPending ? (
        <p className="text-accent-700 text-sm p-6">Loading...</p>
      ) : !data || data.accounts.length === 0 ? (
        <p className="text-accent-700 text-sm p-6">Nothing waiting for review.</p>
      ) : (
        <div className="divide-y divide-[rgba(193,97,61,0.08)]">
          {data.accounts.map((account) => (
            <div key={account.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="text-accent-900 font-medium truncate">
                    {account.user.displayName} (@{account.user.username})
                  </p>
                  <p className="text-ghost text-xs mt-0.5">
                    Bank record: &ldquo;{account.accountName}&rdquo; · {account.bankName} · {account.accountNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => review.mutate({ id: account.id, action: "approve" })}
                    disabled={review.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-canvas text-xs font-medium rounded-lg transition-all"
                  >
                    {review.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectingId(rejectingId === account.id ? null : account.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-400/30 text-rose-400 hover:bg-[rgba(251,113,133,0.08)] text-xs font-medium rounded-lg transition-all"
                  >
                    <X className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>

              {rejectingId === account.id && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason (shown to no one but recorded for audit)"
                    className="flex-1 bg-[rgba(255,255,255,0.8)] border border-blush rounded-lg px-3 py-2 text-accent-900 placeholder-ghost outline-none text-xs"
                  />
                  <button
                    onClick={() => review.mutate({ id: account.id, action: "reject", reason: rejectionReason })}
                    disabled={review.isPending}
                    className="px-3 py-2 bg-rose-400 text-canvas text-xs font-medium rounded-lg disabled:opacity-50"
                  >
                    Confirm reject
                  </button>
                </div>
              )}

              {review.error && <p className="text-rose-400 text-xs">{(review.error as Error).message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
