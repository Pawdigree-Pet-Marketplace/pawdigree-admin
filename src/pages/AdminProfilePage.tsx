import { useCallback, useEffect, useState } from "react";
import { RefreshCw, UserRound } from "lucide-react";
import { adminApi, type CurrentAdminUser } from "../services/adminApi";
import { ApiError } from "../services/api";
import "./auth/AdminManagement.css";
import "./AccountPages.css";

export function AdminProfilePage() {
  const [user, setUser] = useState<CurrentAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUser(await adminApi.getCurrentAdminUser());
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return <main className="admin-management-page">
    <section className="admin-management-heading"><div><p className="admin-management-breadcrumb">Admin / Personal</p><h1>My Profile</h1><p className="admin-management-description">Account details for the signed-in administrator.</p></div><button type="button" className="admin-refresh-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> {loading ? "Loading…" : "Refresh"}</button></section>
    {error && <div className="login-error" role="alert">{error}</div>}
    {loading ? <section className="admin-card">Loading profile…</section> : user && <section className="admin-profile-card"><div className="admin-profile-avatar"><UserRound size={25} /></div><div className="admin-profile-grid">
      <div><span>First name</span><strong>{user.first_name || "—"}</strong></div><div><span>Last name</span><strong>{user.last_name || "—"}</strong></div><div><span>Email</span><strong>{user.email}</strong></div><div><span>Username</span><strong>{user.username}</strong></div><div><span>Phone</span><strong>{user.phone || "—"}</strong></div><div><span>Role</span><strong>{user.role === "SYSTEM_ADMIN" ? "Super Admin" : "Admin"}</strong></div><div><span>Account status</span><strong>{user.accountStatus || (user.isActive ? "Active" : "Inactive")}</strong></div><div><span>Email verified</span><strong>{user.is_email_verified ? "Yes" : "No"}</strong></div>
    </div><p className="admin-profile-note">Profile editing is not available through the admin API. Use the account recovery flow to change your password.</p></section>}
  </main>;
}
