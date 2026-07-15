"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Search } from "lucide-react";
import CustomSelect from "@/app/_components/CustomSelect";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(month: number) {
  return new Date(2000, month, 0).getDate();
}

interface UserRow {
  id: string;
  username: string;
  displayName: string;
  birthdayMonth: number;
  birthdayDay: number;
}

function EditableUserRow({ user }: { user: UserRow }) {
  const qc = useQueryClient();
  const [month, setMonth] = useState(String(user.birthdayMonth));
  const [day, setDay] = useState(String(user.birthdayDay));
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthdayMonth: parseInt(month), birthdayDay: parseInt(day) }),
      }).then(async (r) => {
        const json = await r.json().catch(() => ({})) as { error?: string };
        if (!r.ok) throw new Error(json.error ?? "Could not update birthday");
        return json;
      }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["admin-user-search"] });
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const changed = month !== String(user.birthdayMonth) || day !== String(user.birthdayDay);

  return (
    <div className="p-4 space-y-3">
      <p className="text-accent-900 font-medium text-sm">
        {user.displayName} <span className="text-ghost">@{user.username}</span>
      </p>
      <div className="flex items-center gap-2">
        <CustomSelect
          value={month}
          onChange={(v) => { setMonth(v); setDay(""); }}
          options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
          className="w-40"
        />
        <CustomSelect
          value={day}
          onChange={setDay}
          options={
            month
              ? [...Array(getDaysInMonth(parseInt(month)))].map((_, i) => ({ value: String(i + 1), label: String(i + 1) }))
              : []
          }
          className="w-24"
          disabled={!month}
        />
        <button
          onClick={() => save.mutate()}
          disabled={!changed || save.isPending || !month || !day}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-canvas text-sm font-medium rounded-xl transition-all"
        >
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save
        </button>
      </div>
      {saved && <p className="text-accent-500 text-xs">Birthday updated.</p>}
      {save.error && <p className="text-rose-400 text-xs">{(save.error as Error).message}</p>}
    </div>
  );
}

export default function AdminUserSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useQuery<{ users: UserRow[] }>({
    queryKey: ["admin-user-search", debounced],
    queryFn: () => fetch(`/api/admin/users?username=${encodeURIComponent(debounced)}`).then((r) => r.json()),
    enabled: debounced.length >= 2,
  });

  return (
    <div>
      <div className="relative mb-6 max-w-sm">
        <Search className="w-4 h-4 text-ghost absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full bg-[rgba(255,255,255,0.8)] border border-blush focus:border-[rgba(193,97,61,0.45)] rounded-xl pl-11 pr-4 py-3 text-accent-900 placeholder-ghost outline-none transition-all text-sm"
        />
      </div>

      {debounced.length >= 2 && (
        <div className="card rounded-xl overflow-hidden">
          {isFetching ? (
            <p className="text-accent-700 text-sm p-6">Searching...</p>
          ) : !data || data.users.length === 0 ? (
            <p className="text-accent-700 text-sm p-6">No matching users.</p>
          ) : (
            <div className="divide-y divide-[rgba(193,97,61,0.08)]">
              {data.users.map((user) => (
                <EditableUserRow key={user.id} user={user} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
