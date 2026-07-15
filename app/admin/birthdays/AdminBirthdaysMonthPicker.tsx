"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CustomSelect from "@/app/_components/CustomSelect";
import { koboToNaira } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface BirthdayRow {
  username: string;
  displayName: string;
  birthdayDay: number;
  heldCount: number;
  heldTotalKobo: number;
}

export default function AdminBirthdaysMonthPicker() {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));

  const { data, isPending } = useQuery<{ totalUsers: number; totalHeldKobo: number; rows: BirthdayRow[] }>({
    queryKey: ["admin-birthdays", month],
    queryFn: () => fetch(`/api/admin/birthdays?month=${month}`).then((r) => r.json()),
  });

  return (
    <div>
      <div className="mb-6 max-w-xs">
        <CustomSelect
          value={month}
          onChange={setMonth}
          options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
        />
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card rounded-xl p-5">
            <p className="text-accent-700 text-xs uppercase tracking-wider mb-1">Birthdays</p>
            <p className="font-fraunces text-3xl font-bold text-accent-900">{data.totalUsers}</p>
          </div>
          <div className="card rounded-xl p-5">
            <p className="text-accent-700 text-xs uppercase tracking-wider mb-1">Total held</p>
            <p className="font-fraunces text-3xl font-bold text-accent-900">{koboToNaira(data.totalHeldKobo)}</p>
          </div>
        </div>
      )}

      <div className="card rounded-xl overflow-hidden">
        {isPending ? (
          <p className="text-accent-700 text-sm p-6">Loading...</p>
        ) : !data || data.rows.length === 0 ? (
          <p className="text-accent-700 text-sm p-6">No birthdays this month.</p>
        ) : (
          <div className="divide-y divide-[rgba(193,97,61,0.08)]">
            {data.rows.map((row) => (
              <div key={row.username} className="p-4 flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="text-accent-900 font-medium truncate">{row.displayName}</p>
                  <p className="text-ghost text-xs mt-0.5">
                    @{row.username} · {MONTHS[Number(month) - 1]} {row.birthdayDay}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-accent-900 font-semibold">{koboToNaira(row.heldTotalKobo)}</p>
                  <p className="text-ghost text-xs">{row.heldCount} gift{row.heldCount !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
