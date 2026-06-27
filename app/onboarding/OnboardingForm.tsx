"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function getDaysInMonth(month: number) {
  // Use a leap year for February to show 29 days
  return new Date(2000, month, 0).getDate();
}

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [loading, setLoading] = useState(false);

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

  const checkUsername = async (value: string) => {
    setUsername(value);
    if (value.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    await new Promise(r => setTimeout(r, 500));
    // TODO: replace with real API check
    setUsernameStatus("available");
  };

  const handleFinish = async () => {
    if (!username || usernameStatus !== "available") return;
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          birthdayMonth: parseInt(month),
          birthdayDay: parseInt(day),
          username,
        }),
      });
      if (res.ok) router.push("/dashboard");
    } finally {
      setLoading(false);
    }
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
                <select
                  value={month}
                  onChange={e => { setMonth(e.target.value); setDay(""); }}
                  className="bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-3 text-cream outline-none transition-all min-h-[44px]"
                >
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select
                  value={day}
                  onChange={e => setDay(e.target.value)}
                  disabled={!month}
                  className="bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] disabled:opacity-40 rounded-xl px-4 py-3 text-cream outline-none transition-all min-h-[44px]"
                >
                  <option value="">Day</option>
                  {month && [...Array(getDaysInMonth(parseInt(month)))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
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
                  onChange={e => checkUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
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
              <button
                onClick={handleFinish}
                disabled={usernameStatus !== "available" || username.length < 3 || loading}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-bright disabled:opacity-40 disabled:cursor-not-allowed text-canvas font-semibold py-3 rounded-xl transition-all min-h-[44px]"
              >
                {loading ? "Setting up..." : "Finish Setup"}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
