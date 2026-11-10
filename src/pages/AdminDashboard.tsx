import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  ChartNoAxesCombined,
  Layers,
  PawPrint,
  ShieldCheck,
  Store,
} from "lucide-react";
import { adminApi, type PendingPet, type VendorApplicationApi } from "../services/adminApi";
import { ApiError } from "../services/api";
import "./AdminDashboard.css";

const errorMessage = (error: unknown) => error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
const petName = (pet: PendingPet) => String(pet.name || pet.pet_name || pet.title || "Unnamed pet");
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString() : "Date not provided";

export const AdminDashboard = () => {
  const [vendors, setVendors] = useState<VendorApplicationApi[]>([]);
  const [vendorCount, setVendorCount] = useState<number | null>(null);
  const [pets, setPets] = useState<PendingPet[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingPets, setLoadingPets] = useState(true);
  const [vendorError, setVendorError] = useState("");
  const [petError, setPetError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
   let active = true;

    adminApi.getVendorApplications("pending", 1)
      .then((result) => {
        if (!active) return;
        setVendors(result.results ?? []);
        setVendorCount(result.count ?? result.results?.length ?? 0);
      })
      .catch((error: unknown) => { if (active) setVendorError(errorMessage(error)); })
      .finally(() => { if (active) setLoadingVendors(false); });
    adminApi.getPendingPets()
      .then((result) => { if (active) setPets(result); })
      .catch((error: unknown) => { if (active) setPetError(errorMessage(error)); })
      .finally(() => { if (active) setLoadingPets(false); });

    return () => { active = false; };
  }, [reload]);

  const handleRefresh = () => {
  setLoadingVendors(true);
  setLoadingPets(true);
  setVendorError("");
  setPetError("");

  setReload((value) => value + 1);
};

  const reviewItems = useMemo(() => [
    ...vendors.slice(0, 5).map((vendor) => ({
      id: `vendor-${vendor.id}`,
      name: vendor.name || "Unnamed business",
      type: "Vendor application",
      submitted: formatDate(vendor.created_at),
      href: "/admin/vendors",
      Icon: Store,
    })),
    ...pets.slice(0, 5).map((pet) => ({
      id: `pet-${pet.id}`,
      name: petName(pet),
      type: "Pet listing",
      submitted: formatDate(pet.created_at),
      href: "/admin/listings/approval",
      Icon: PawPrint,
    })),
  ], [vendors, pets]);

  return (
    <main className="dash-page">
      <section className="dash-welcome-card">
        <span className="dash-paw-trails" aria-hidden="true">
          <PawPrint className="dash-paw-drift dash-paw-one" size={18} />
          <PawPrint className="dash-paw-drift dash-paw-two" size={14} />
        </span>
        <div className="dash-welcome-copy">
          <span className="dash-eyebrow">PAWDIGREE ADMIN</span>
          <h2>Welcome back, Admin</h2>
          <p>Here’s what needs your attention today.</p>
        </div>
        <div className="dash-welcome-actions">
          <button className="dash-refresh" onClick={handleRefresh}></button>
          <span className="dash-welcome-icon" aria-hidden="true"><ShieldCheck size={26} /></span>
        </div>
      </section>

      <section className="dash-stats-grid" aria-label="Administration overview">
        <article className="dash-stat-card">
          <span className="dash-stat-icon"><Store size={18} /></span>
          <strong className="dash-stat-value">{loadingVendors ? "…" : vendorError ? "—" : vendorCount ?? 0}</strong>
          <span className="dash-stat-label">Pending vendor applications</span>
        </article>
        <article className="dash-stat-card">
          <span className="dash-stat-icon dash-coral"><PawPrint size={18} /></span>
          <strong className="dash-stat-value">{loadingPets ? "…" : petError ? "—" : pets.length}</strong>
          <span className="dash-stat-label">Pet listings awaiting review</span>
        </article>
        <Link className="dash-stat-card" to="/admin/vendors">
          <span className="dash-stat-icon dash-sand"><BadgeCheck size={18} /></span>
          <strong className="dash-stat-action">Open queue <ArrowRight size={15} /></strong>
          <span className="dash-stat-label">Vendor applications</span>
        </Link>
        <Link className="dash-stat-card" to="/admin/listings/categories">
          <span className="dash-stat-icon dash-coral"><Layers size={18} /></span>
          <strong className="dash-stat-action">Manage <ArrowRight size={15} /></strong>
          <span className="dash-stat-label">Vendor categories</span>
        </Link>
      </section>

      {(vendorError || petError) && (
        <div className="dash-error-banner" role="alert">
          {[vendorError && `Vendor applications: ${vendorError}`, petError && `Pet listings: ${petError}`].filter(Boolean).join(" ")}
        </div>
      )}

      <section className="dash-analytics-grid" aria-label="Administration analytics">
        <article className="dash-panel dash-chart-panel">
          <div className="dash-panel-heading">
            <div><span className="dash-panel-kicker"><ChartNoAxesCombined size={14} /> VENDOR REVIEW</span><h3>Application activity</h3></div>
            <span className="dash-panel-period">Last 7 days</span>
          </div>
          <div className="dash-empty-panel">
            <span className="dash-empty-icon"><ChartNoAxesCombined size={20} /></span>
            <p>Application history will appear here when activity data is available.</p>
          </div>
        </article>

        <article className="dash-panel dash-insights-panel">
          <div className="dash-panel-heading">
            <div><span className="dash-panel-kicker"><Activity size={14} /> LISTING REVIEW</span><h3>Queue activity</h3></div>
          </div>
          <div className="dash-empty-panel">
            <span className="dash-empty-icon dash-empty-coral"><Activity size={20} /></span>
            <p>Queue trends will appear here when analytics are available.</p>
          </div>
        </article>
      </section>

      <section className="dash-panel dash-queue-panel" aria-labelledby="dash-queue-title">
        <div className="dash-queue-heading">
          <div>
            <span className="dash-panel-kicker"><BadgeCheck size={14} /> ADMIN REVIEW</span>
            <h3 id="dash-queue-title">Items awaiting review</h3>
            <p>Recent vendor applications and pet listings from the Pawdigree backend.</p>
          </div>
          <span className="dash-queue-count">{loadingVendors || loadingPets ? "…" : reviewItems.length} items</span>
        </div>
        <div className="dash-table-wrapper">
          <table className="dash-review-table">
            <thead><tr><th>ITEM</th><th>QUEUE</th><th>DATE SUBMITTED</th><th>STATUS</th><th aria-label="Open item" /></tr></thead>
            <tbody>
              {loadingVendors || loadingPets ? (
                <tr><td colSpan={5} className="dash-table-state">Loading review items…</td></tr>
              ) : reviewItems.length === 0 ? (
                <tr><td colSpan={5} className="dash-table-state">There are no items awaiting review right now.</td></tr>
              ) : reviewItems.map((item) => (
                <tr key={item.id}>
                  <td><span className="dash-review-item"><span className="dash-review-icon"><item.Icon size={16} /></span><strong>{item.name}</strong></span></td>
                  <td>{item.type}</td>
                  <td>{item.submitted}</td>
                  <td><span className="dash-status">Pending</span></td>
                  <td><Link className="dash-row-link" to={item.href} aria-label={`Open ${item.type} queue`}><ArrowRight size={16} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
