import AdminLedgerFilters from "./AdminLedgerFilters";

export default function AdminLedgerPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-2">Gift Ledger</h1>
        <p className="text-accent-700 text-sm">Every gift, filterable by status and recipient.</p>
      </div>
      <AdminLedgerFilters />
    </div>
  );
}
