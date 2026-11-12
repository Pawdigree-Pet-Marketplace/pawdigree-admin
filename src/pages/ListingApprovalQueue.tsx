import { useEffect, useMemo, useState } from "react";
import { Check, Search, X, RefreshCw, PawPrint, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi, type PendingPet } from "../services/adminApi";
import { ApiError } from "../services/api";
import "./AdminManagement.css";

const PAGE_SIZE = 20;
const messageFor = (error: unknown) => error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
const display = (value: unknown, fallback = "—") => value == null || value === "" ? fallback : String(value);
const petName = (pet: PendingPet) => display(pet.name, "Unnamed pet");
const petBreed = (pet: PendingPet) => display(pet.breed || pet.species);
const petVendor = (pet: PendingPet) => `Vendor #${pet.vendor}`;
const submittedDate = (value: string) => new Date(value).toLocaleDateString();

export function ListingApprovalQueue() {
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [pets, setPets] = useState<PendingPet[]>([]);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<PendingPet["pet_id"] | null>(null);
  const [details, setDetails] = useState<PendingPet | null>(null);
  const [rejecting, setRejecting] = useState<PendingPet | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let mounted = true;
    adminApi.getPendingPetPage(page)
      .then((result) => {
        if (!mounted) return;
        setPets(result.results);
        setCount(result.count);
        setHasNext(Boolean(result.next));
        setHasPrevious(Boolean(result.previous));
        setError("");
      })
      .catch((cause: unknown) => { if (mounted) setError(messageFor(cause)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [page, reload]);

  const visible = useMemo(() => pets.filter((pet) => `${petName(pet)} ${petBreed(pet)} ${petVendor(pet)}`.toLowerCase().includes(query.trim().toLowerCase())), [pets, query]);

  const removeFromQueue = (pet: PendingPet) => {
    setPets((items) => items.filter((item) => item.pet_id !== pet.pet_id));
    setCount((total) => Math.max(0, total - 1));
    setDetails((current) => current?.pet_id === pet.pet_id ? null : current);
    if (pets.length === 1 && page > 1 && hasPrevious) setPage((current) => current - 1);
  };

  const approve = async (pet: PendingPet) => {
    setBusyId(pet.pet_id);
    setError("");
    setSuccess("");
    try {
      await adminApi.approvePet(pet.pet_id);
      removeFromQueue(pet);
      setSuccess(`${petName(pet)} was approved and is now live.`);
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rejecting) return;
    setBusyId(rejecting.pet_id);
    setError("");
    setSuccess("");
    try {
      await adminApi.rejectPet(rejecting.pet_id, reason.trim());
      const rejectedPet = rejecting;
      setRejecting(null);
      setReason("");
      removeFromQueue(rejectedPet);
      setSuccess(`${petName(rejectedPet)} was rejected. The reason was sent to the vendor.`);
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusyId(null);
    }
  };

  const refresh = () => { setLoading(true); setError(""); setSuccess(""); setReload((value) => value + 1); };
  const changePage = (nextPage: number) => { setLoading(true); setError(""); setPage(nextPage); };

  return <section className="management-page">
    <div className="management-intro"><div><span className="management-eyebrow">LISTINGS</span><h2>Pet Listing Review</h2><p>Review submitted pet listings before they appear in the marketplace.</p></div><button type="button" className="management-secondary" onClick={refresh} disabled={loading}><RefreshCw size={16} /> Refresh</button></div>
    {error && <div className="management-alert" role="alert">{error}</div>}
    {success && <div className="management-success" role="status">{success}</div>}
    <div className="management-toolbar"><div className="management-search"><Search size={17} /><input aria-label="Search pending listings" placeholder="Search pets or vendors" value={query} onChange={(event) => setQuery(event.target.value)} /></div><span className="management-count">{count} awaiting review</span></div>
    <div className="management-card">
      {loading ? <div className="management-state" role="status">Loading pending listings…</div> : visible.length === 0 ? <div className="management-state"><PawPrint size={28} /><strong>{query ? "No matching listings" : "Queue is clear"}</strong><span>{query ? "Try another search." : "There are no pet listings awaiting review."}</span></div> :
        <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Pet</th><th>Breed / type</th><th>Vendor</th><th>Submitted</th><th><span className="visually-hidden">Review actions</span></th></tr></thead><tbody>{visible.map((pet) => <tr key={pet.pet_id}>
          <td className="management-name">{petName(pet)}</td><td>{petBreed(pet)}</td><td>{petVendor(pet)}</td><td>{submittedDate(pet.created_at)}</td>
          <td><div className="management-actions"><button type="button" className="management-icon-button" aria-label={`View ${petName(pet)} details`} onClick={() => setDetails(pet)}><Eye size={16} /></button><button type="button" className="management-approve" disabled={busyId === pet.pet_id} onClick={() => void approve(pet)}><Check size={15} /> Approve</button><button type="button" className="management-reject" disabled={busyId === pet.pet_id} onClick={() => { setRejecting(pet); setReason(""); }}><X size={15} /> Reject</button></div></td>
        </tr>)}</tbody></table></div>}
    </div>
    <div className="admin-table-footer admin-directory-footer"><span>Page {page} · {count ? `${Math.min((page - 1) * PAGE_SIZE + 1, count)}–${Math.min(page * PAGE_SIZE, count)} of ${count}` : "0 listings"}</span><div className="admin-pagination"><button type="button" onClick={() => changePage(Math.max(1, page - 1))} disabled={!hasPrevious || loading}><ChevronLeft size={17} />Previous</button><button type="button" onClick={() => changePage(page + 1)} disabled={!hasNext || loading}>Next<ChevronRight size={17} /></button></div></div>

    {details && <div className="management-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetails(null); }}><section className="management-modal management-pet-details" role="dialog" aria-modal="true" aria-labelledby="pet-details-title">
      <div className="management-modal-head"><div><span className="management-eyebrow">SUBMITTED LISTING · #{details.pet_id}</span><h3 id="pet-details-title">{petName(details)}</h3></div><button type="button" className="management-icon-button" onClick={() => setDetails(null)} aria-label="Close details"><X size={19} /></button></div>
      <dl className="management-pet-grid"><div><dt>Species / breed</dt><dd>{display(details.species)} / {display(details.breed, "Not specified")}</dd></div><div><dt>Listing type</dt><dd>{details.listing_type === "SALE" ? "For sale" : "Adoption"}</dd></div><div><dt>Vendor</dt><dd>{petVendor(details)}</dd></div><div><dt>Business ID</dt><dd>{display(details.business)}</dd></div><div><dt>Age</dt><dd>{details.age} months</dd></div><div><dt>Gender / size</dt><dd>{display(details.gender)} / {display(details.size)}</dd></div><div><dt>Price</dt><dd>{details.price ? `UGX ${details.price}` : "Not applicable"}</dd></div><div><dt>Adoption status</dt><dd>{display(details.adoption_status)}</dd></div><div><dt>Submitted</dt><dd>{submittedDate(details.created_at)}</dd></div></dl>
      <div className="management-pet-description"><strong>Description</strong><p>{details.description || "No description provided."}</p></div>
      {details.images.length > 0 && <div className="management-pet-images"><strong>Photos</strong><div>{details.images.map((image) => <img key={image.image_id} src={image.image} alt={`${petName(details)} listing`} />)}</div></div>}
      <div className="management-modal-actions"><button type="button" className="management-secondary" onClick={() => setDetails(null)}>Close</button><button type="button" className="management-approve" disabled={busyId === details.pet_id} onClick={() => void approve(details)}><Check size={15} /> Approve listing</button><button type="button" className="management-reject" disabled={busyId === details.pet_id} onClick={() => { setRejecting(details); setDetails(null); setReason(""); }}><X size={15} /> Reject</button></div>
    </section></div>}

    {rejecting && <div className="management-modal-backdrop"><form className="management-modal" onSubmit={reject}><div className="management-modal-head"><div><span className="management-eyebrow">REJECT LISTING</span><h3>{petName(rejecting)}</h3></div><button type="button" className="management-icon-button" onClick={() => setRejecting(null)} aria-label="Close rejection form"><X size={19} /></button></div><label>Reason for rejection<textarea required rows={4} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain what needs to be corrected" /></label><div className="management-modal-actions"><button type="button" className="management-secondary" onClick={() => setRejecting(null)}>Cancel</button><button className="management-reject" disabled={busyId === rejecting.pet_id || !reason.trim()}>{busyId === rejecting.pet_id ? "Submitting…" : "Reject listing"}</button></div></form></div>}
  </section>;
}
