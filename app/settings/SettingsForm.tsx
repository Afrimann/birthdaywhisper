"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Check, ChevronRight, Loader2, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomSelect from "@/app/_components/CustomSelect";
import { fallbackAvatarDataUri } from "@/lib/avatars";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

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
  id: string;
  displayName: string;
  birthdayMonth: number;
  birthdayDay: number;
  username: string;
  avatarUrl: string | null;
  notifPrefs: NotifPrefs;
}

export default function SettingsForm({ initialData, baseUrl }: { initialData: InitialData; baseUrl: string }) {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const [displayName, setDisplayName] = useState(initialData.displayName);
  // Birthday selects are disabled below — the value can't change after
  // signup (see PATCH /api/settings), so these are plain derived constants,
  // not state.
  const month = String(initialData.birthdayMonth);
  const day   = String(initialData.birthdayDay);
  const [username, setUsername]       = useState(initialData.username);
  const [debouncedUsername, setDebouncedUsername] = useState(initialData.username);
  const [notifPrefs, setNotifPrefs]   = useState<NotifPrefs>(initialData.notifPrefs);

  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username]);

  const usernameChanged = username !== initialData.username;
  const debouncedChanged = debouncedUsername !== initialData.username;

  const { data: usernameCheckData, isFetching: isCheckingUsername, isError: usernameCheckError } = useQuery<{ available: boolean }>({
    queryKey: ["username-check", debouncedUsername],
    queryFn: () =>
      fetch(`/api/username/check?username=${encodeURIComponent(debouncedUsername)}`).then((r) => r.json()),
    enabled: debouncedChanged && debouncedUsername.length >= 3,
  });

  const isTyping = username !== debouncedUsername;
  const usernameStatus: "idle" | "checking" | "available" | "taken" =
    !usernameChanged ? "idle" :
    username.length < 3 ? "idle" :
    isTyping || isCheckingUsername ? "checking" :
    usernameCheckError || usernameCheckData == null ? "idle" :
    usernameCheckData.available ? "available" :
    "taken";

  const usernameOk = !usernameChanged || (usernameStatus === "available" && username.length >= 3);

  const save = useMutation({
    mutationFn: () =>
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          birthdayMonth: parseInt(month),
          birthdayDay: parseInt(day),
          username,
          notifPrefs,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }).then(async (r) => {
        const json = await r.json().catch(() => ({})) as { error?: string };
        if (!r.ok) throw Object.assign(new Error(json.error ?? "save failed"), { status: r.status });
        return json;
      }),
    onSuccess: () => {
      setSuccess(true);
      setError("");
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    },
    onError: (err: Error & { status?: number }) => {
      if (err.status === 409) setError("That username is already taken.");
      else setError("Something went wrong. Please try again.");
    },
  });

  const persistAvatarUrl = (url: string | null) =>
    fetch("/api/settings/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: url }),
    });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !clerkUser) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be under 5MB.");
      return;
    }

    setAvatarError("");
    setAvatarUploading(true);
    try {
      const image = await clerkUser.setProfileImage({ file });
      const url = image.publicUrl ?? clerkUser.imageUrl;
      await persistAvatarUrl(url);
      setAvatarUrl(url);
      router.refresh();
    } catch {
      setAvatarError("Couldn't update your photo. Try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!clerkUser) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      await clerkUser.setProfileImage({ file: null });
      await persistAvatarUrl(null);
      setAvatarUrl(null);
      router.refresh();
    } catch {
      setAvatarError("Couldn't remove your photo. Try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const canSave =
    displayName.trim().length >= 2 &&
    month !== "" &&
    day !== "" &&
    username.length >= 3 &&
    usernameOk &&
    !save.isPending;

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 bg-[rgba(193,97,61,0.1)] border border-[rgba(193,97,61,0.3)] rounded-xl px-4 py-3 animate-fade-rise">
          <Check className="w-4 h-4 text-accent-500 flex-shrink-0" />
          <p className="text-accent-500 text-sm font-medium">Changes saved successfully.</p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-[rgba(251,113,133,0.1)] border border-rose-400/30 rounded-xl px-4 py-3">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {/* Profile photo */}
      <div className="card rounded-xl p-6">
        <label className="block text-accent-700 text-xs font-semibold uppercase tracking-wider mb-4">
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl || fallbackAvatarDataUri(initialData.id)}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-blush"
            />
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-[rgba(255,255,255,0.7)] flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-accent-500 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="flex items-center gap-1.5 text-accent-500 hover:text-accent-600 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
              >
                <Camera className="w-4 h-4" /> {avatarUrl ? "Change photo" : "Add photo"}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={avatarUploading}
                  className="flex items-center gap-1 text-ghost hover:text-rose-400 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-ghost text-xs mt-1.5">JPG or PNG, up to 5MB.</p>
          </div>
        </div>
        {avatarError && <p className="text-rose-400 text-xs mt-3">{avatarError}</p>}
      </div>

      {/* Display name */}
      <div className="card rounded-xl p-6">
        <label className="block text-accent-700 text-xs font-semibold uppercase tracking-wider mb-3">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name..."
          className="w-full bg-[rgba(255,255,255,0.8)] border border-blush focus:border-[rgba(193,97,61,0.45)] focus:shadow-[0_0_0_3px_rgba(193,97,61,0.07)] rounded-xl px-4 py-3 text-accent-900 placeholder-ghost outline-none transition-all"
        />
        <p className="text-ghost text-xs mt-2">
          Shown on your birthday page and in messages.
        </p>
      </div>

      {/* Birthday */}
      <div className="card rounded-xl p-6 relative z-10">
        <label className="block text-accent-700 text-xs font-semibold uppercase tracking-wider mb-3">
          Birthday
        </label>
        <div className="grid grid-cols-2 gap-3">
          <CustomSelect
            value={month}
            onChange={() => {}}
            options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
            placeholder="Month"
            disabled
          />
          <CustomSelect
            value={day}
            onChange={() => {}}
            options={
              month
                ? [...Array(getDaysInMonth(parseInt(month)))].map((_, i) => ({
                    value: String(i + 1),
                    label: String(i + 1),
                  }))
                : []
            }
            placeholder="Day"
            disabled
          />
        </div>
        <p className="text-ghost text-xs mt-2">
          Contact support to change your birthday.
        </p>
      </div>

      {/* Username */}
      <div className="card rounded-xl p-6">
        <label className="block text-accent-700 text-xs font-semibold uppercase tracking-wider mb-3">
          Username
        </label>
        <div className="bg-[rgba(255,255,255,0.8)] border border-blush focus-within:border-[rgba(193,97,61,0.45)] focus-within:shadow-[0_0_0_3px_rgba(193,97,61,0.07)] rounded-xl px-4 py-3 flex items-center gap-1.5 transition-all">
          <span className="text-ghost text-sm whitespace-nowrap select-none">/b/</span>
          <input
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            className="flex-1 bg-transparent text-accent-900 outline-none min-w-0"
          />
        </div>
        <p className="text-ghost text-xs mt-1.5 truncate">
          {baseUrl}/b/<span className="text-accent-700">{username || "your-username"}</span>
        </p>
        <div className="mt-1 h-5 text-xs">
          {usernameChanged && usernameStatus === "checking" && (
            <span className="text-accent-700 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Checking...
            </span>
          )}
          {usernameChanged && usernameStatus === "available" && username.length >= 3 && (
            <span className="text-accent-500 flex items-center gap-1">
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
      <div className="card rounded-xl p-6">
        <label className="block text-accent-700 text-xs font-semibold uppercase tracking-wider mb-4">
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
                <p className="text-accent-900 text-sm font-medium">{label}</p>
                <p className="text-ghost text-xs">{desc}</p>
              </div>
              <div
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                  notifPrefs[key] ? "bg-accent-500" : "bg-blush border border-[rgba(193,97,61,0.2)]"
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
        onClick={() => save.mutate()}
        disabled={!canSave}
        className={cn(
          "w-full flex items-center justify-center gap-2 text-base font-semibold py-4 rounded-2xl transition-all min-h-[56px]",
          canSave
            ? "bg-accent-500 hover:bg-accent-600 text-canvas"
            : "bg-blush text-ghost cursor-not-allowed"
        )}
      >
        {save.isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
        ) : (
          <><ChevronRight className="w-5 h-5" /> Save Changes</>
        )}
      </button>
    </div>
  );
}
