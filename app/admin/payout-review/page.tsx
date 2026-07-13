import PayoutReviewActions from "./PayoutReviewActions";

export default function AdminPayoutReviewPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-2">Payout Review</h1>
        <p className="text-accent-700 text-sm">
          Accounts whose name only partially matched the user&apos;s profile name — confirm these are
          genuinely theirs before approving.
        </p>
      </div>
      <PayoutReviewActions />
    </div>
  );
}
