export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { isAdminUserId } from "@/lib/admin";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/ledger", label: "Ledger" },
  { href: "/admin/birthdays", label: "Birthdays" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/payout-review", label: "Payout Review" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isAdminUserId(userId)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-canvas text-accent-900">
      <nav className="border-b border-[rgba(193,97,61,0.08)] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-accent-500 w-5 h-5" />
            <span className="font-fraunces text-lg font-bold text-accent-900 tracking-tight">Admin</span>
          </div>
          <Link href="/dashboard" className="text-accent-700 hover:text-accent-900 text-sm transition-colors">
            ← Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-accent-700 hover:text-accent-900 text-sm whitespace-nowrap transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
