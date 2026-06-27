"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getDaysInMonth(month: number) {
  return new Date(2000, month, 0).getDate();
}

interface NotifPrefs {
  emailOnBirthdayUnlock: boolean;
  emailReminders: boolean;
  emailReactions: boolean;
}

interface InitialData {
  displayName: string;
  birthdayMonth: number;
  birthdayDay: number;
  username: string;
  notifPrefs: NotifPrefs;
}

export default function SettingsForm({ initialData, baseUrl }: { initialData: InitialData; baseUrl: string }) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initialData.displayName);
  const [month, setMonth]             = useState(String(initialData.birthdayMonth));
  const [day, setDay]                 = useState(String(initialData.birthdayDay));
  const [username, setUsername]       = useState(initialData.username);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [notifPrefs, setNotifPrefs]   = useState<NotifPrefs>(initialData.notifPrefs);

  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  const usernameChanged = username !== initialData.username;
  const usernameOk = !usernameChanged || (usernameStatus === "available" && username.length >= 3);
  const canSave =
    displayName.trim().length >= 2 &&
    month !== "" &&
    day !== "" &&
    username.length >= 3 &&
    usernameOk &&
    !saving;

  // Real-time username check (only when changed)
  useEffect(() => {
    if (!usernameChanged) { setUsernameStatus("idle"); return; }
    if (username.length < 3) { setUsernameStatus("idle"); return; }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, usernameChanged]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          birthdayMonth: parseInt(month),
          birthdayDay: parseInt(day),
          username,
          notifPrefs,
        }),
      });

      if (res.status === 409) { setError("That username is already taken."); return; }
      if (!res.ok)            { setError("Something went wrong. Please try again."); return; }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 bg-[rgba(242,193,78,0.1)] border border-[rgba(242,193,78,0.3)] rounded-xl px-4 py-3 animate-fade-rise">
          <Check className="w-4 h-4 text-gold flex-shrink-0" />
          <p className="text-gold text-sm font-medium">Changes saved successfully.</p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-[rgba(251,113,133,0.1)] border border-rose-400/30 rounded-xl px-4 py-3">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {/* Display name */}
      <div className="glass rounded-2xl p-6">
        <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-3">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name..."
          className="w-full bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] focus:shadow-[0_0_0_3px_rgba(242,193,78,0.07)] rounded-xl px-4 py-3 text-cream placeholder-ghost outline-none transition-all"
        />
        <p className="text-ghost text-xs mt-2">
          Shown on your birthday page and in messages.
        </p>
      </div>

      {/* Birthday */}
      <div className="glass rounded-2xl p-6">
        <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-3">
          Birthday
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={month}
            onChange={(e) => { setMonth(e.target.value); setDay(""); }}
            className="bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-3 text-cream outline-none transition-all min-h-[44px]"
          >
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            disabled={!month}
            className="bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] disabled:opacity-40 rounded-xl px-4 py-3 text-cream outline-none transition-all min-h-[44px]"
          >
            <option value="">Day</option>
            {month && [...Array(getDaysInMonth(parseInt(month)))].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        <p className="text-ghost text-xs mt-2">
          Only the day and month are stored — no year.
        </p>
      </div>

      {/* Username */}
      <div className="glass rounded-2xl p-6">
        <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-3">
          Username
        </label>
        <div className="bg-[rgba(11,11,13,0.8)] border border-pitch focus-within:border-[rgba(242,193,78,0.45)] focus-within:shadow-[0_0_0_3px_rgba(242,193,78,0.07)] rounded-xl px-4 py-3 flex items-center gap-1.5 transition-all">
          <span className="text-ghost text-sm whitespace-nowrap select-none">/b/</span>
          <input
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            className="flex-1 bg-transparent text-cream outline-none min-w-0"
          />
        </div>
        <p className="text-ghost text-xs mt-1.5 truncate">
          {baseUrl}/b/<span className="text-stone">{username || "your-username"}</span>
        </p>
        <div className="mt-1 h-5 text-xs">
          {usernameChanged && usernameStatus === "checking" && (
            <span className="text-stone flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Checking...
            </span>
          )}
          {usernameChanged && usernameStatus === "available" && username.length >= 3 && (
            <span className="text-gold flex items-center gap-1">
              <Check className="w-3 h-3" /> @{username} is available
            </span>
          )}
          {usernameChanged && usernameStatus === "taken" && (
            <span className="text-rose-400">@{username} is taken — try another</span>
          )}
          {!usernameChanged && (
            <span className="text-ghost">This is your current username.</span>
          )}
        </div>
        <p className="text-ghost text-xs mt-1">
          3–30 characters. Letters, numbers, and underscores only.
        </p>
      </div>

      {/* Notification preferences */}
      <div className="glass rounded-2xl p-6">
        <label className="block text-stone text-xs font-semibold uppercase tracking-wider mb-4">
          Email Notifications
        </label>
        <div className="space-y-4">
          {(
            [
              { key: "emailOnBirthdayUnlock", label: "Birthday unlock", desc: "When your birthday messages are ready to open" },
              { key: "emailReminders",        label: "Reminder emails",  desc: "Get reminded 3 days before a followed birthday" },
              { key: "emailReactions",        label: "Reaction alerts",  desc: "When someone reacts to your birthday message" },
            ] as { key: keyof NotifPrefs; label: string; desc: string }[]
          ).map(({ key, label, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))}
              className="w-full flex items-center justify-between gap-4 text-left"
            >
              <div>
                <p className="text-cream text-sm font-medium">{label}</p>
                <p className="text-ghost text-xs">{desc}</p>
              </div>
              <div
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                  notifPrefs[key] ? "bg-gold" : "bg-pitch border border-[rgba(242,193,78,0.2)]"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-canvas transition-all ${
                    notifPrefs[key] ? "left-5" : "left-1"
                  }`}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!canSave}
        className={cn(
          "w-full flex items-center justify-center gap-2 text-base font-semibold py-4 rounded-2xl transition-all min-h-[56px]",
          canSave
            ? "bg-gold hover:bg-gold-bright text-canvas"
            : "bg-pitch text-ghost cursor-not-allowed"
        )}
      >
        {saving ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
        ) : (
          <><ChevronRight className="w-5 h-5" /> Save Changes</>
        )}
      </button>
    </div>
  );
}
