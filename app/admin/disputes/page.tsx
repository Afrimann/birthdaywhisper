import AdminDisputesList from "./AdminDisputesList";

export default function AdminDisputesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-2">Disputes</h1>
        <p className="text-accent-700 text-sm">
          A dispute can arrive after a gift has already been disbursed — clearing it here is a manual
          decision, not automatic.
        </p>
      </div>
      <AdminDisputesList />
    </div>
  );
}
