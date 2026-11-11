import type { ReactNode } from "react";
import { isSuperAdmin } from "../../services/adminRoles";

export function SuperAdminRoute({ children }: { children: ReactNode }) {
  if (!isSuperAdmin()) {
    return (
      <main className="admin-access-denied" role="alert">
        <p>403 · ACCESS DENIED</p>
        <h1>You can’t access this page</h1>
        <p>This page is available to Super Admin accounts only.</p>
      </main>
    );
  }

  return children;
}
