import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";

const activeRoleKey = "pawdigree_active_role";
const signedOutRole = "SIGNED_OUT";

type AuthState = "admin" | "denied" | "signed-out";

function readAuthState(): AuthState {
  const allowedRoles = ["ADMIN", "SYSTEM_ADMIN"];

  const activeRole = localStorage.getItem(activeRoleKey);
  const role = activeRole ?? localStorage.getItem("role");

  const token =
    localStorage.getItem("token") ??
    localStorage.getItem("access") ??
    localStorage.getItem("accessToken");

  if (activeRole === signedOutRole) return "signed-out";

  if (role && !allowedRoles.includes(role.toUpperCase())) {
    return "denied";
  }

  if (!token || !role) return "signed-out";

  return activeRole === null ||
    allowedRoles.includes(activeRole.toUpperCase())
    ? "admin"
    : "denied";
}

export default function AdminAccessGate({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState(readAuthState);

  useEffect(() => {
    const syncAuthState = () => setAuthState(readAuthState());
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("focus", syncAuthState);
    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("focus", syncAuthState);
    };
  }, []);

  if (authState === "signed-out") {
    return <Navigate to="/login" replace />;
  }

  if (authState === "denied") {
    return (
      <main className="admin-access-denied" role="alert">
        <p>403 · ACCESS DENIED</p>
        <h1>You can’t access this page</h1>
        <p>Your active account does not have administrator access.</p>
      </main>
    );
  }

  return children;
}
