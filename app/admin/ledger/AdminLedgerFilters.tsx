"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import CustomSelect from "@/app/_components/CustomSelect";
import { koboToNaira } from "@/lib/utils";

interface GiftRow {
  id: string;
  senderName: string | null;
  senderEmail: string;
  amountKobo: number;
  status: string;
  isDisputed: boolean;
  failureReason: string | null;
  createdAt: string;
  recipient: { username: string; displayName: string };
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING_PAYMENT", label: "Pending payment" },
  { value: "HELD", label: "Held" },
  { value: "DISBURSED", label: "Disbursed" },
  { value: "FAILED", label: "Failed" },
  { value: "EXPIRED", label: "Expired" },
];

export default function AdminLedgerFilters() {
  const [status, setStatus] = useState("");
  const [disputedOnly, setDisputedOnly] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [page, setPage] = useState(1);

  const { data, isPending } = useQuery<{ gifts: GiftRow[]; total: number; pageSize: number }>({
    queryKey: ["admin-gifts", status, disputedOnly, recipient, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (disputedOnly) params.set("disputed", "true");
      if (recipient) params.set("recipient", recipient);
      params.set("page", String(page));
      return fetch(`/api/admin/gifts?${params}`).then((r) => r.json());
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <CustomSelect
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={STATUS_OPTIONS}
          className="w-48"
        />
        <input
          type="text"
          value={recipient}
          onChange={(e) => { setRecipient(e.target.value); setPage(1); }}
          placeholder="Search recipient..."
          className="bg-[rgba(255,255,255,0.8)] border border-blush focus:border-[rgba(193,97,61,0.45)] rounded-xl px-4 py-3 text-accent-900 placeholder-ghost outline-none transition-all text-sm w-56"
        />
        <button
          onClick={() => { setDisputedOnly((d) => !d); setPage(1); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            disputedOnly
              ? "border-[rgba(193,97,61,0.4)] bg-[rgba(193,97,61,0.1)] text-accent-500"
              : "border-blush text-accent-700"
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Disputed only
        </button>
      </div>

      <div className="card rounded-xl overflow-hidden">
        {isPending ? (
          <p className="text-accent-700 text-sm p-6">Loading...</p>
        ) : !data || data.gifts.length === 0 ? (
          <p className="text-accent-700 text-sm p-6">No gifts match these filters.</p>
        ) : (
          <div className="divide-y divide-[rgba(193,97,61,0.08)]">
            {data.gifts.map((gift) => (
              <div key={gift.id} className="p-4 flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="text-accent-900 font-medium truncate">
                    {gift.senderName ?? "Anonymous"} → {gift.recipient.displayName} (@{gift.recipient.username})
                  </p>
                  <p className="text-ghost text-xs mt-0.5">
                    {new Date(gift.createdAt).toLocaleString()}
                    {gift.failureReason && ` · ${gift.failureReason}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {gift.isDisputed && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                  <span className="text-accent-700 text-xs px-2 py-1 rounded-full bg-[rgba(193,97,61,0.08)]">
                    {gift.status}
                  </span>
                  <span className="text-accent-900 font-semibold">{koboToNaira(gift.amountKobo)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 text-accent-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-accent-700 text-xs">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 text-accent-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
