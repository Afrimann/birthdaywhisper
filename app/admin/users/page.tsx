import AdminUserSearch from "./AdminUserSearch";

export default function AdminUsersPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-2">Users</h1>
        <p className="text-accent-700 text-sm">
          Birthdays are locked after signup — this is the support path for correcting one.
        </p>
      </div>
      <AdminUserSearch />
    </div>
  );
}
