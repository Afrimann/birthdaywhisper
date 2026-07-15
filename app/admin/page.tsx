export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Wallet, CheckCircle2, AlertTriangle, Clock, ShieldAlert, UserCheck } from "lucide-react";
import { koboToNaira } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const [byStatus, disputedCount, pendingReviewCount, stuckCount] = await Promise.all([
    prisma.gift.groupBy({ by: ["status"], _sum: { amountKobo: true }, _count: true }),
    prisma.gift.count({ where: { isDisputed: true } }),
    prisma.payoutAccount.count({ where: { verificationStatus: "PENDING_REVIEW" } }),
    prisma.gift.count({ where: { status: "HELD", failureReason: { not: null } } }),
  ]);

  const byStatusMap = Object.fromEntries(
    byStatus.map((row) => [row.status, { count: row._count, kobo: row._sum.amountKobo ?? 0 }]),
  ) as Record<string, { count: number; kobo: number }>;

  const held = byStatusMap.HELD ?? { count: 0, kobo: 0 };
  const disbursed = byStatusMap.DISBURSED ?? { count: 0, kobo: 0 };
  const pendingPayment = byStatusMap.PENDING_PAYMENT ?? { count: 0, kobo: 0 };
  const failed = byStatusMap.FAILED ?? { count: 0, kobo: 0 };
  const expired = byStatusMap.EXPIRED ?? { count: 0, kobo: 0 };

  const cards = [
    { label: "Held", value: koboToNaira(held.kobo), sub: `${held.count} gift${held.count !== 1 ? "s" : ""}`, icon: Wallet },
    { label: "Disbursed", value: koboToNaira(disbursed.kobo), sub: `${disbursed.count} gift${disbursed.count !== 1 ? "s" : ""}`, icon: CheckCircle2 },
    { label: "Stuck transfers", value: String(stuckCount), sub: "held, last attempt failed", icon: AlertTriangle },
    { label: "Disputed", value: String(disputedCount), sub: "needs review", icon: ShieldAlert },
    { label: "Payout review queue", value: String(pendingReviewCount), sub: "weak name matches", icon: UserCheck },
    { label: "Pending payment", value: String(pendingPayment.count), sub: "checkout not yet completed", icon: Clock },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-2">Overview</h1>
        <p className="text-accent-700 text-sm">
          {failed.count > 0 && `${failed.count} payment${failed.count !== 1 ? "s" : ""} failed to start. `}
          {expired.count} abandoned checkout{expired.count !== 1 ? "s" : ""} expired.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-accent-500" />
              <p className="text-accent-700 text-xs font-semibold uppercase tracking-wider">{label}</p>
            </div>
            <p className="font-fraunces text-3xl font-bold text-accent-900">{value}</p>
            <p className="text-ghost text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
