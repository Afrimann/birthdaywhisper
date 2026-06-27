"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Gift, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomSelect from "@/app/_components/CustomSelect";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function getDaysInMonth(month: number) {
  return new Date(2000, month, 0).getDate();
}

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [username, setUsername] = useState("");
  const [debouncedUsername, setDebouncedUsername] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username]);

  const { data: usernameCheckData, isFetching: isCheckingUsername } = useQuery<{ available: boolean }>({
    queryKey: ["username-check", debouncedUsername],
    queryFn: () =>
      fetch(`/api/username/check?username=${encodeURIComponent(debouncedUsername)}`).then((r) => r.json()),
    enabled: debouncedUsername.length >= 3,
  });

  const isTyping = username !== debouncedUsername;
  const usernameStatus: "idle" | "checking" | "available" | "taken" =
    username.length < 3 ? "idle" :
    isTyping || isCheckingUsername ? "checking" :
    usernameCheckData == null ? "idle" :
    usernameCheckData.available ? "available" :
    "taken";

  const finish = useMutation({
    mutationFn: () =>
      fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          birthdayMonth: parseInt(month),
          birthdayDay: parseInt(day),
          username,
        }),
      }).then((r) => { if (!r.ok) throw new Error("setup failed"); return r.json(); }),
    onSuccess: () => router.push("/dashboard"),
  });

  const handleNameNext = () => {
    if (displayName.trim().length < 2) return;
    const suggested = displayName.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_]/g, "");
    setUsername(suggested);
    setStep(2);
  };

  const handleBirthdayNext = () => {
    if (!month || !day) return;
    setStep(3);
  };

  const steps = [
    { n: 1, label: "Name" },
    { n: 2, label: "Birthday" },
    { n: 3, label: "Username" },
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[rgba(242,193,78,0.04)] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Gift className="text-gold w-6 h-6" />
          <span className="font-fraunces text-2xl font-bold text-cream tracking-tight">BirthdayWhisper</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-all",
                step > n
                  ? "bg-gold border-gold text-canvas"
                  : step === n
                  ? "border-[rgba(242,193,78,0.4)] text-gold bg-[rgba(242,193,78,0.08)]"
                  : "border-pitch text-ghost"
              )}>
                {step > n ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={cn(
                "text-xs hidden sm:block",
                step === n ? "text-gold" : "text-ghost"
              )}>
                {label}
              </span>
              {n < 3 && (
                <div className={cn(
                  "w-8 h-px",
                  step > n ? "bg-gold" : "bg-pitch"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">

          {step === 1 && (
            <div>
              <h2 className="font-fraunces text-2xl font-bold text-cream mb-2">What should we call you?</h2>
              <p className="text-stone text-sm mb-6">This is how you&apos;ll appear on your birthday page.</p>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleNameNext()}
                placeholder="Your name..."
                className="w-full bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] focus:shadow-[0_0_0_3px_rgba(242,193,78,0.07)] rounded-xl px-4 py-3 text-cream placeholder-ghost outline-none transition-all text-lg"
                autoFocus
              />
              <button
                onClick={handleNameNext}
                disabled={displayName.trim().length < 2}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-bright disabled:opacity-40 disabled:cursor-not-allowed text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px]"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-fraunces text-2xl font-bold text-cream mb-2">When&apos;s your birthday?</h2>
              <p className="text-stone text-sm mb-6">We only need the day and month — no year required.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <CustomSelect
                  value={month}
                  onChange={(v) => { setMonth(v); setDay(""); }}
                  options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
                  placeholder="Month"
                />
                <CustomSelect
                  value={day}
                  onChange={setDay}
                  options={
                    month
                      ? [...Array(getDaysInMonth(parseInt(month)))].map((_, i) => ({
                          value: String(i + 1),
                          label: String(i + 1),
                        }))
                      : []
                  }
                  placeholder="Day"
                  disabled={!month}
                />
              </div>
              <button
                onClick={handleBirthdayNext}
                disabled={!month || !day}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-bright disabled:opacity-40 disabled:cursor-not-allowed text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px]"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-fraunces text-2xl font-bold text-cream mb-2">Choose your link</h2>
              <p className="text-stone text-sm mb-6">This is your permanent birthday page URL.</p>
              <div className="bg-[rgba(11,11,13,0.8)] border border-pitch focus-within:border-[rgba(242,193,78,0.45)] focus-within:shadow-[0_0_0_3px_rgba(242,193,78,0.07)] rounded-xl px-4 py-3 flex items-center gap-2 transition-all">
                <span className="text-ghost text-sm whitespace-nowrap">birthdaywhisper.com/b/</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourname"
                  className="flex-1 bg-transparent text-cream outline-none min-w-0"
                  autoFocus
                />
              </div>
              <div className="mt-2 h-5 text-xs">
                {usernameStatus === "checking" && <span className="text-stone">Checking...</span>}
                {usernameStatus === "available" && username.length >= 3 && (
                  <span className="text-gold flex items-center gap-1">
                    <Check className="w-3 h-3" /> @{username} is available
                  </span>
                )}
                {usernameStatus === "taken" && (
                  <span className="text-rose-400">@{username} is taken — try another</span>
                )}
              </div>
              {finish.isError && (
                <p className="text-rose-400 text-xs mt-2">Setup failed — please try again.</p>
              )}
              <button
                onClick={() => finish.mutate()}
                disabled={usernameStatus !== "available" || username.length < 3 || finish.isPending}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-bright disabled:opacity-40 disabled:cursor-not-allowed text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px]"
              >
                {finish.isPending ? "Setting up..." : "Finish Setup"}
                {!finish.isPending && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
