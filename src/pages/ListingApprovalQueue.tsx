import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Search, X, RefreshCw, PawPrint } from "lucide-react";
import { adminApi, type PendingPet } from "../services/adminApi";
import { ApiError } from "../services/api";
import "./AdminManagement.css";

const messageFor = (error: unknown) => error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
const display = (value: unknown, fallback = "—") => value == null || value === "" ? fallback : String(value);
const petName = (pet: PendingPet) => display(pet.name || pet.pet_name || pet.title, "Unnamed pet");
const petBreed = (pet: PendingPet) => display(pet.breed || pet.breed_name || pet.species);
const petOwner = (pet: PendingPet) => {
  const owner = pet.owner || pet.user || pet.seller;
  if (owner && typeof owner === "object") { const record = owner as Record<string, unknown>; return display(record.full_name || record.name || record.email); }
  return display(owner || pet.owner_name || pet.seller_name);
};

export function ListingApprovalQueue() {
  const [pets, setPets] = useState<PendingPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<PendingPet["id"] | null>(null);
  const [rejecting, setRejecting] = useState<PendingPet | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try { setPets(await adminApi.getPendingPets()); setError(""); } catch (cause) { setError(messageFor(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let mounted = true;
    adminApi.getPendingPets().then((items) => { if (mounted) { setPets(items); setError(""); } }).catch((cause: unknown) => { if (mounted) setError(messageFor(cause)); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  const visible = useMemo(() => pets.filter((pet) => `${petName(pet)} ${petBreed(pet)} ${petOwner(pet)}`.toLowerCase().includes(query.toLowerCase())), [pets, query]);

  const approve = async (pet: PendingPet) => {
    setBusyId(pet.id); setError("");
    try { await adminApi.approvePet(pet.id); setPets((items) => items.filter((item) => item.id !== pet.id)); }
    catch (cause) { setError(messageFor(cause)); }
    finally { setBusyId(null); }
  };
  const reject = async (event: React.FormEvent) => {
    event.preventDefault(); if (!rejecting) return;
    setBusyId(rejecting.id); setError("");
    try { await adminApi.rejectPet(rejecting.id, reason.trim()); setPets((items) => items.filter((item) => item.id !== rejecting.id)); setRejecting(null); setReason(""); }
    catch (cause) { setError(messageFor(cause)); }
    finally { setBusyId(null); }
  };

  return <section className="management-page">
    <div className="management-intro"><div><span className="management-eyebrow">LISTINGS</span><h2>Listing Approval Queue</h2><p>Review pet listings before they appear in the marketplace.</p></div><button className="management-secondary" onClick={() => { setLoading(true); setError(""); void load(); }}><RefreshCw size={16} /> Refresh</button></div>
    {error && <div className="management-alert" role="alert">{error}</div>}
    <div className="management-toolbar"><div className="management-search"><Search size={17} /><input aria-label="Search pending listings" placeholder="Search pets or owners" value={query} onChange={(event) => setQuery(event.target.value)} /></div><span className="management-count">{pets.length} awaiting review</span></div>
    <div className="management-card">{loading ? <div className="management-state">Loading pending listings…</div> : visible.length === 0 ? <div className="management-state"><PawPrint size={28} /><strong>{query ? "No matching listings" : "Queue is clear"}</strong><span>{query ? "Try another search." : "There are no pet listings awaiting review."}</span></div> :
      <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Pet</th><th>Breed / type</th><th>Owner</th><th>Submitted</th><th><span className="visually-hidden">Review actions</span></th></tr></thead><tbody>{visible.map((pet) => <tr key={pet.id}><td className="management-name">{petName(pet)}</td><td>{petBreed(pet)}</td><td>{petOwner(pet)}</td><td>{display(pet.created_at || pet.submitted_at || pet.date_created)}</td><td><div className="management-actions"><button className="management-approve" disabled={busyId === pet.id} onClick={() => void approve(pet)}><Check size={15} /> Approve</button><button className="management-reject" disabled={busyId === pet.id} onClick={() => { setRejecting(pet); setReason(""); }}><X size={15} /> Reject</button></div></td></tr>)}</tbody></table></div>}
    </div>
    {rejecting && <div className="management-modal-backdrop"><form className="management-modal" onSubmit={reject}><div className="management-modal-head"><div><span className="management-eyebrow">REJECT LISTING</span><h3>{petName(rejecting)}</h3></div><button type="button" className="management-icon-button" onClick={() => setRejecting(null)} aria-label="Close"><X size={19} /></button></div><label>Reason for rejection<textarea required rows={4} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain what needs to be corrected" /></label><div className="management-modal-actions"><button type="button" className="management-secondary" onClick={() => setRejecting(null)}>Cancel</button><button className="management-reject" disabled={busyId === rejecting.id || !reason.trim()}>{busyId === rejecting.id ? "Submitting…" : "Reject listing"}</button></div></form></div>}
  </section>;
}





