"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Wallet, Gift as GiftIcon, Clock } from "lucide-react";
import CustomSelect from "@/app/_components/CustomSelect";
import { koboToNaira } from "@/lib/utils";

interface PayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verificationStatus?: "AUTO_APPROVED" | "PENDING_REVIEW" | "MANUALLY_APPROVED" | "REJECTED";
}

interface GiftReceived {
  id: string;
  senderName: string | null;
  amountKobo: number;
  note: string | null;
  status: "HELD" | "DISBURSED";
  processing: boolean;
  createdAt: string;
}

export default function PayoutAccountForm({ initialAccount }: { initialAccount: PayoutAccount | null }) {
  const qc = useQueryClient();
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const { data: banksData } = useQuery<{ banks: { name: string; code: string }[] }>({
    queryKey: ["banks"],
    queryFn: () => fetch("/api/banks").then((r) => r.json()),
  });

  const { data: giftsData } = useQuery<{
    gifts: GiftReceived[];
    heldTotalKobo: number;
    disbursedTotalKobo: number;
    withdrawableKobo: number;
  }>({
    queryKey: ["gifts-received"],
    queryFn: () => fetch("/api/gifts/received").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const withdraw = useMutation({
    mutationFn: () =>
      fetch("/api/payouts/withdraw", { method: "POST" }).then(async (r) => {
        const json = await r.json().catch(() => ({})) as { error?: string; withdrawnKobo?: number };
        if (!r.ok) throw new Error(json.error ?? "Could not withdraw right now.");
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gifts-received"] }),
  });

  const bankName = banksData?.banks.find((b) => b.code === bankCode)?.name ?? "";

  const save = useMutation({
    mutationFn: () =>
      fetch("/api/payout-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankCode, bankName, accountNumber }),
      }).then(async (r) => {
        const json = await r.json().catch(() => ({})) as {
          error?: string;
          accountName?: string;
          pendingReview?: boolean;
          message?: string;
        };
        if (!r.ok) throw new Error(json.error ?? "Could not verify this account");
        return json;
      }),
    onSuccess: (result) => {
      setSuccess(
        result.pendingReview
          ? (result.message ?? "Saved — pending manual review.")
          : `Saved — payouts will go to ${result.accountName}.`,
      );
      qc.invalidateQueries({ queryKey: ["payout-account"] });
    },
  });

  const account = save.isSuccess
    ? {
        bankCode, bankName, accountNumber,
        accountName: save.data.accountName ?? "",
        verificationStatus: save.data.pendingReview ? ("PENDING_REVIEW" as const) : ("AUTO_APPROVED" as const),
      }
    : initialAccount;
  const isPendingReview = account?.verificationStatus === "PENDING_REVIEW";
  const canSave = bankCode && /^\d{10}$/.test(accountNumber) && !save.isPending;

  return (
    <div className="space-y-6">
      {/* Payout account */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-accent-500" />
          <label className="block text-accent-700 text-xs font-semibold uppercase tracking-wider">
            Payout Account
          </label>
        </div>

        {account && (
          <div
            className={
              isPendingReview
                ? "flex items-center gap-3 bg-[rgba(250,199,117,0.15)] border border-[rgba(250,199,117,0.4)] rounded-xl px-4 py-3 mb-4"
                : "flex items-center gap-3 bg-[rgba(212,83,126,0.08)] border border-[rgba(212,83,126,0.2)] rounded-xl px-4 py-3 mb-4"
            }
          >
            {isPendingReview ? (
              <Clock className="w-4 h-4 text-[#B8863C] flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-accent-500 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-accent-900 text-sm font-medium truncate">{account.accountName}</p>
              <p className="text-accent-700 text-xs">
                {account.bankName} · {account.accountNumber}
                {isPendingReview && " · Pending review"}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <CustomSelect
            value={bankCode}
            onChange={setBankCode}
            options={(banksData?.banks ?? []).map((b) => ({ value: b.code, label: b.name }))}
            placeholder="Select your bank"
          />
          <input
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit account number"
            className="w-full bg-[rgba(255,255,255,0.8)] border border-blush focus:border-[rgba(212,83,126,0.45)] rounded-xl px-4 py-3 text-accent-900 placeholder-ghost outline-none transition-all text-sm"
          />
        </div>

        {save.error && (
          <p className="text-rose-400 text-xs mt-3">{(save.error as Error).message}</p>
        )}
        {success && (
          <p className="text-accent-500 text-xs mt-3">{success}</p>
        )}

        <button
          onClick={() => { setSuccess(null); save.mutate(); }}
          disabled={!canSave}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px]"
        >
          {save.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Verify & Save"}
        </button>

        <p className="text-ghost text-xs mt-3">
          The name on the account must match your profile name — update it in Settings if it&apos;s out of date.
        </p>
      </div>

      {/* Gifts received */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <GiftIcon className="w-4 h-4 text-accent-500" />
          <label className="block text-accent-700 text-xs font-semibold uppercase tracking-wider">
            Gifts Received
          </label>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-accent-700 text-xs">Held, waiting for your birthday</p>
            <p className="font-fraunces text-2xl font-bold text-accent-900">
              {koboToNaira(giftsData?.heldTotalKobo ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-accent-700 text-xs">Paid out</p>
            <p className="font-fraunces text-2xl font-bold text-accent-900">
              {koboToNaira(giftsData?.disbursedTotalKobo ?? 0)}
            </p>
          </div>
        </div>

        {giftsData && giftsData.gifts.length === 0 && (
          <p className="text-accent-700 text-sm">No gifts yet — share your birthday link!</p>
        )}

        {(giftsData?.withdrawableKobo ?? 0) > 0 && (
          <div className="mb-4">
            {withdraw.error && (
              <p className="text-rose-400 text-xs mb-2">{(withdraw.error as Error).message}</p>
            )}
            {withdraw.isSuccess && (
              <p className="text-accent-500 text-xs mb-2">
                Withdrew {koboToNaira(withdraw.data.withdrawnKobo ?? 0)} — it&apos;s on its way to your bank.
              </p>
            )}
            <button
              onClick={() => withdraw.mutate()}
              disabled={withdraw.isPending}
              className="w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px]"
            >
              {withdraw.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Withdrawing...</>
              ) : (
                `Withdraw ${koboToNaira(giftsData!.withdrawableKobo)}`
              )}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {giftsData?.gifts.map((gift) => (
            <div key={gift.id} className="flex items-center justify-between text-sm">
              <span className="text-accent-700">{gift.senderName ?? "Someone"}</span>
              <span className={gift.status === "DISBURSED" ? "text-accent-700" : "text-accent-500 font-medium"}>
                {koboToNaira(gift.amountKobo)}
                {gift.processing && <span className="text-ghost text-xs ml-1">(processing)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
