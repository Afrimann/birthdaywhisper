"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import ClearDisputeButton from "./ClearDisputeButton";
import { koboToNaira } from "@/lib/utils";

interface GiftRow {
  id: string;
  senderName: string | null;
  senderEmail: string;
  amountKobo: number;
  status: string;
  disputeNote: string | null;
  createdAt: string;
  recipient: { username: string; displayName: string };
}

export default function AdminDisputesList() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery<{ gifts: GiftRow[] }>({
    queryKey: ["admin-disputes"],
    queryFn: () => fetch("/api/admin/gifts?disputed=true").then((r) => r.json()),
  });

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {isPending ? (
        <p className="text-accent-700 text-sm p-6">Loading...</p>
      ) : !data || data.gifts.length === 0 ? (
        <p className="text-accent-700 text-sm p-6">No open disputes.</p>
      ) : (
        <div className="divide-y divide-[rgba(212,83,126,0.08)]">
          {data.gifts.map((gift) => (
            <div key={gift.id} className="p-4 flex items-center justify-between gap-4 text-sm">
              <div className="min-w-0 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-accent-900 font-medium truncate">
                    {gift.senderName ?? "Anonymous"} ({gift.senderEmail}) → {gift.recipient.displayName}
                  </p>
                  <p className="text-ghost text-xs mt-0.5">
                    {gift.status} · {new Date(gift.createdAt).toLocaleString()}
                    {gift.disputeNote && ` · ${gift.disputeNote}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-accent-900 font-semibold">{koboToNaira(gift.amountKobo)}</span>
                <ClearDisputeButton giftId={gift.id} onCleared={() => qc.invalidateQueries({ queryKey: ["admin-disputes"] })} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
