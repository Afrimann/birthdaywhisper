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

export default function OnboardingPage() {
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
    <div className="min-h-screen bg-navy-800 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Gift className="text-violet-500 w-6 h-6" />
          <span className="font-playfair text-2xl font-bold text-white">BirthdayWhisper</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-all",
                step > n
                  ? "bg-violet-600 border-violet-600 text-white"
                  : step === n
                  ? "border-violet-500 text-violet-400 bg-violet-600/10"
                  : "border-navy-600 text-slate-500"
              )}>
                {step > n ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={cn("text-xs hidden sm:block", step === n ? "text-violet-400" : "text-slate-500")}>
                {label}
              </span>
              {n < 3 && <div className={cn("w-8 h-px", step > n ? "bg-violet-600" : "bg-navy-600")} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-navy-700 border border-navy-600 rounded-2xl p-8">

          {step === 1 && (
            <div>
              <h2 className="font-playfair text-2xl font-bold text-white mb-2">What should we call you?</h2>
              <p className="text-slate-400 text-sm mb-6">This is how you&apos;ll appear on your birthday page.</p>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleNameNext()}
                placeholder="Your name..."
                className="w-full bg-navy-800 border border-navy-600 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors text-lg"
                autoFocus
              />
              <button
                onClick={handleNameNext}
                disabled={displayName.trim().length < 2}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-playfair text-2xl font-bold text-white mb-2">When&apos;s your birthday?</h2>
              <p className="text-slate-400 text-sm mb-6">We only need the day and month — no year required.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <select
                  value={month}
                  onChange={e => { setMonth(e.target.value); setDay(""); }}
                  className="bg-navy-800 border border-navy-600 focus:border-violet-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                >
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select
                  value={day}
                  onChange={e => setDay(e.target.value)}
                  disabled={!month}
                  className="bg-navy-800 border border-navy-600 focus:border-violet-500 disabled:opacity-40 rounded-xl px-4 py-3 text-white outline-none transition-colors"
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
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-playfair text-2xl font-bold text-white mb-2">Choose your link</h2>
              <p className="text-slate-400 text-sm mb-6">This is your permanent birthday page URL.</p>
              <div className="bg-navy-800 border border-navy-600 focus-within:border-violet-500 rounded-xl px-4 py-3 flex items-center gap-2 transition-colors">
                <span className="text-slate-500 text-sm whitespace-nowrap">birthdaywhisper.com/b/</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => checkUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourname"
                  className="flex-1 bg-transparent text-white outline-none min-w-0"
                  autoFocus
                />
              </div>
              <div className="mt-2 h-5 text-xs">
                {usernameStatus === "checking" && <span className="text-slate-400">Checking...</span>}
                {usernameStatus === "available" && username.length >= 3 && (
                  <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> @{username} is available</span>
                )}
                {usernameStatus === "taken" && <span className="text-rose-400">@{username} is taken — try another</span>}
              </div>
              <button
                onClick={handleFinish}
                disabled={usernameStatus !== "available" || username.length < 3 || loading}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
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
