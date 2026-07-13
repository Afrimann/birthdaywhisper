import AdminBirthdaysMonthPicker from "./AdminBirthdaysMonthPicker";

export default function AdminBirthdaysPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-2">Birthdays This Month</h1>
        <p className="text-accent-700 text-sm">Who&apos;s got a birthday coming, and how much is waiting for them.</p>
      </div>
      <AdminBirthdaysMonthPicker />
    </div>
  );
}
