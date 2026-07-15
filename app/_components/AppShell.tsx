"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, LayoutDashboard, BookOpen, Star, Bell, Settings, Wallet } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { GIFTING_ENABLED } from "@/lib/feature-flags";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jar", icon: BookOpen, label: "Memory Jar" },
  { href: "/wishlist", icon: Star, label: "Wishlist" },
  ...(GIFTING_ENABLED ? [{ href: "/payouts", icon: Wallet, label: "Payouts" }] : []),
  { href: "/following", icon: Bell, label: "Following" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-canvas text-accent-900 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-shrink-0 md:flex-col md:fixed md:inset-y-0 border-r border-sand bg-canvas">
        <Link href="/dashboard" className="flex items-center gap-2 px-6 py-6">
          <Gift className="text-accent-500 w-5 h-5" />
          <span className="font-fraunces text-xl font-bold text-accent-900 tracking-tight">BirthdayWhisper</span>
        </Link>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-2",
                  active
                    ? "bg-[rgba(193,97,61,0.08)] border-accent-500 text-accent-700"
                    : "border-transparent text-ghost hover:text-accent-900 hover:bg-[rgba(20,15,15,0.02)]"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between px-6 py-5 border-t border-sand">
          <UserButton />
          <NotificationBell />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between border-b border-sand px-5 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Gift className="text-accent-500 w-5 h-5" />
          <span className="font-fraunces text-xl font-bold text-accent-900 tracking-tight">BirthdayWhisper</span>
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <UserButton />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 md:ml-60">
        <main className="px-6 md:px-10 py-8 md:py-12 max-w-5xl mx-auto pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-sand bg-canvas/95 backdrop-blur-sm flex items-center justify-around py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium min-w-[56px] touch-manipulation",
                active ? "text-accent-500" : "text-ghost"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
