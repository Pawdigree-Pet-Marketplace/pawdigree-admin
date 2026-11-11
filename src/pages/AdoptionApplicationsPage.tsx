import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { adminApi, type AdoptionApplication } from "../services/adminApi";
import { ApiError } from "../services/api";
import "./auth/AdminManagement.css";
import "./AccountPages.css";

const errorText = (error: unknown) => error instanceof ApiError ? error.message : "Could not load adoption applications.";
const readable = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());

export function AdoptionApplicationsPage() {
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdoptionApplication | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setApplications(await adminApi.getAdoptionApplications());
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function submitDecision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(selected.application_id);
    setError("");
    try {
      await adminApi.decideAdoptionApplication(selected.application_id, decision, reason.trim());
      setSelected(null);
      setReason("");
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not update the application.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="admin-management-page">
      <section className="admin-management-heading">
        <div>
          <p className="admin-management-breadcrumb">Admin / Marketplace Operations</p>
          <h1>Adoption Applications</h1>
          <p className="admin-management-description">Review applications for pets across the marketplace.</p>
        </div>
        <button type="button" className="admin-refresh-button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} /> {loading ? "Loading…" : "Refresh"}
        </button>
      </section>

      {error && <div className="login-error" role="alert">{error}</div>}

      <section className="admin-management-table-card">
        <div className="admin-table-heading"><div><h2>Applications</h2><p>{applications.length} applications returned by the marketplace API.</p></div></div>
        <div className="admin-management-table-wrapper">
          <table className="admin-management-table">
            <thead><tr><th>Applicant</th><th>Pet</th><th>Home</th><th>Experience</th><th>Status</th><th>Submitted</th><th>Decision</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="admin-empty-cell">Loading applications…</td></tr> : applications.length === 0 ? <tr><td colSpan={7} className="admin-empty-cell">No adoption applications found.</td></tr> : applications.map((application) => {
                const actionable = application.status === "PENDING" || application.status === "INFO_REQUESTED";
                return <tr key={application.application_id}>
                  <td><div className="admin-person-cell"><div><strong>{application.customer_username}</strong><span>{application.customer_email}</span></div></div></td>
                  <td><strong>{application.pet_name || `Pet #${application.pet}`}</strong><span className="admin-table-secondary">{application.has_other_pets ? `Other pets: ${application.other_pets_details || "Yes"}` : "No other pets"}</span></td>
                  <td>{readable(application.home_type)}{application.has_outdoor_space ? " · Outdoor space" : ""}</td>
                  <td>{readable(application.previous_pet_experience)}</td>
                  <td><span className={`admin-status-label ${actionable ? "is-inactive" : "is-active"}`}>{readable(application.status)}</span></td>
                  <td>{application.created_at ? new Date(application.created_at).toLocaleDateString() : "—"}</td>
                  <td>{actionable ? <div className="admin-row-actions">
                    <button type="button" className="admin-row-action" aria-label={`Approve application from ${application.customer_username}`} onClick={() => { setSelected(application); setDecision("APPROVED"); setReason(""); }}><Check size={16} /></button>
                    <button type="button" className="admin-row-action" aria-label={`Reject application from ${application.customer_username}`} onClick={() => { setSelected(application); setDecision("REJECTED"); setReason(""); }}><X size={16} /></button>
                  </div> : application.decision_reason || "—"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selected && <div className="admin-modal-backdrop"><section className="admin-edit-modal" role="dialog" aria-modal="true" aria-labelledby="adoption-decision-title">
        <div className="admin-edit-modal-heading"><div><h2 id="adoption-decision-title">{decision === "APPROVED" ? "Approve" : "Reject"} application</h2><p>{selected.customer_username} · {selected.pet_name || `Pet #${selected.pet}`}</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button></div>
        <p className="adoption-applicant-message">{selected.message}</p>
        <form onSubmit={submitDecision}>
          <label>Decision reason <span>(optional)</span><textarea rows={4} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
          <div className="admin-form-actions"><button type="submit" className={`admin-btn ${decision === "APPROVED" ? "admin-btn-save" : "admin-btn-cancel"}`} disabled={Boolean(busy)}>{busy ? "Saving…" : `Confirm ${decision === "APPROVED" ? "approval" : "rejection"}`}</button><button type="button" className="admin-btn admin-btn-cancel" onClick={() => setSelected(null)} disabled={Boolean(busy)}>Cancel</button></div>
        </form>
      </section></div>}
    </main>
  );
}
