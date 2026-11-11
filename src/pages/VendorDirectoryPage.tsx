import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Store } from "lucide-react";
import { adminApi, type PaginatedVendorApplications } from "../services/adminApi";
import { ApiError } from "../services/api";
import "./auth/AdminManagement.css";

export function VendorDirectoryPage() {
  const [data, setData] = useState<PaginatedVendorApplications | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi.getVendorApplications("approved", page));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not load approved vendors.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return <main className="admin-management-page">
    <section className="admin-management-heading"><div><p className="admin-management-breadcrumb">Admin / User Management</p><h1>Vendors</h1><p className="admin-management-description">Approved businesses and vendor contact details.</p></div><button type="button" className="admin-refresh-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> {loading ? "Loading…" : "Refresh"}</button></section>
    {error && <div className="login-error" role="alert">{error}</div>}
    <section className="admin-management-table-card"><div className="admin-table-heading"><div><h2>Approved vendors</h2><p>{data?.count ?? 0} businesses</p></div></div>
      <div className="admin-management-table-wrapper"><table className="admin-management-table"><thead><tr><th>Business</th><th>Vendor</th><th>Contact</th><th>Business type</th><th>Location</th><th>Approved</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={6} className="admin-empty-cell">Loading vendors…</td></tr> : !data?.results.length ? <tr><td colSpan={6} className="admin-empty-cell"><div className="admin-empty-state"><span className="admin-empty-icon"><Store size={24} /></span><h3>No approved vendors found</h3></div></td></tr> : data.results.map((vendor) => <tr key={vendor.id}><td><strong>{vendor.name}</strong><span className="admin-table-secondary">{vendor.description || ""}</span></td><td><strong>{vendor.vendor_username || "—"}</strong><span className="admin-table-secondary">{vendor.vendor_email || ""}</span></td><td>{vendor.contact || vendor.email || "—"}</td><td>{vendor.business_type?.replaceAll("_", " ") || "—"}</td><td>{[vendor.city_district, vendor.address].filter(Boolean).join(", ") || "—"}</td><td>{vendor.reviewed_at ? new Date(vendor.reviewed_at).toLocaleDateString() : "—"}</td></tr>)}
      </tbody></table></div>
      <div className="admin-table-footer admin-directory-footer"><span>Page {page}</span><div className="admin-pagination"><button type="button" aria-label="Previous page" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={!data?.previous || loading}><ChevronLeft size={17} />Previous</button><button type="button" aria-label="Next page" onClick={() => setPage((value) => value + 1)} disabled={!data?.next || loading}>Next<ChevronRight size={17} /></button></div></div>
    </section>
  </main>;
}
