
import {useEffect, useState, type FormEvent } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PawPrint,
  X,
} from "lucide-react";
import {
  adminApi,
  type PendingPet,
  type AdminPetListingFilters,
  type AdminPetListingUpdate,
} from "../../services/adminApi";

import { ApiError } from "../../services/api";
import "./AdminManagement.css";
import "./PetListingsManagementPage.css";

const PAGE_SIZE = 20;

const errorMessage = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";

const display = (value: unknown, fallback = "—") =>
  value === null || value === undefined || value === ""
    ? fallback
    : String(value);

const formatDate = (value: string) =>
  value ? new Date(value).toLocaleDateString() : "—";

const formatPrice = (value: string | null) =>
  value ? `UGX ${Number(value).toLocaleString()}` : "—";

const emptyFilters: AdminPetListingFilters = {
  search: "",
  species: "",
  listing_type: "",
  review_status: "",
  adoption_status: "",
  is_active: "",
};

const emptyForm: AdminPetListingUpdate = {
  name: "",
  species: "",
  breed: "",
  age: 0,
  gender: "UNKNOWN",
  size: "MEDIUM",
  listing_type: "ADOPTION",
  description: "",
  price: null,
  adoption_status: "AVAILABLE",
};

export function PetListingsManagementPage() {
  const [pets, setPets] = useState<PendingPet[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [filters, setFilters] =
    useState<AdminPetListingFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<AdminPetListingFilters>(emptyFilters);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reload, setReload] = useState(0);

  const [selectedPet, setSelectedPet] = useState<PendingPet | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] =
    useState<AdminPetListingUpdate>(emptyForm);

  const [busyId, setBusyId] = useState<number | null>(null);
useEffect(() => {
  let cancelled = false;

  const fetchListings = async () => {
    try {
      const result = await adminApi.getAdminPetListings({
        ...appliedFilters,
        page,
        page_size: PAGE_SIZE,
      });

      if (cancelled) return;

      setPets(result.results);
      setCount(result.count);
      setHasNext(Boolean(result.next));
      setHasPrevious(Boolean(result.previous));
      setError("");
    } catch (cause) {
      if (!cancelled) {
        setError(errorMessage(cause));
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  void fetchListings();

  return () => {
    cancelled = true;
  };
}, [appliedFilters, page, reload]);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setAppliedFilters({ ...filters });
    setSuccess("");
  };

  const refresh = () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setReload((value) => value + 1);
  };

  const changePage = (nextPage: number) => {
    setLoading(true);
    setPage(nextPage);
  };

  const openDetails = async (pet: PendingPet) => {
    setError("");
    setSuccess("");
    try {
      const latest = await adminApi.getAdminPetListing(pet.pet_id);
      setSelectedPet(latest);
      setEditing(false);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };

  const startEditing = () => {
    if (!selectedPet) return;

    setEditForm({
      name: selectedPet.name,
      species: selectedPet.species,
      breed: selectedPet.breed,
      age: selectedPet.age,
      gender: selectedPet.gender,
      size: selectedPet.size,
      listing_type: selectedPet.listing_type,
      description: selectedPet.description,
      price: selectedPet.price,
      adoption_status: selectedPet.adoption_status,
    });

    setEditing(true);
  };

  const saveChanges = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPet) return;

    const price = editForm.listing_type === "SALE"
      ? String(editForm.price ?? "").trim()
      : null;

    if (
      editForm.listing_type === "SALE" &&
      (!price || !Number.isFinite(Number(price)) || Number(price) <= 0)
    ) {
      setError("Enter a valid sale price greater than zero.");
      return;
    }

    if (Number(editForm.age) < 0 || !Number.isFinite(Number(editForm.age))) {
      setError("Enter a valid age in months.");
      return;
    }

    setBusyId(selectedPet.pet_id);
    setError("");
    setSuccess("");

    try {
      const updated = await adminApi.updateAdminPetListing(
        selectedPet.pet_id,
        {
          ...editForm,
          age: Number(editForm.age),
          price,
        }
      );

      setSelectedPet(updated);
      setEditing(false);
      setSuccess(`${updated.name} was updated successfully.`);
      setReload((value) => value + 1);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  const deactivateListing = async (pet: PendingPet) => {
    const confirmed = window.confirm(
      `Deactivate "${pet.name}"? Customers will no longer see this listing.`
    );

    if (!confirmed) return;

    setBusyId(pet.pet_id);
    setError("");
    setSuccess("");

    try {
      await adminApi.deactivateAdminPetListing(pet.pet_id);

      setSelectedPet(null);
      setSuccess(`${pet.name} was deactivated successfully.`);
      setReload((value) => value + 1);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  const updateField = <K extends keyof AdminPetListingUpdate>(
    field: K,
    value: AdminPetListingUpdate[K]
  ) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const firstItem = count ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(page * PAGE_SIZE, count);

  return (
    <section className="management-page">
      <div className="management-intro">
        <div>
          <span className="management-eyebrow">MARKETPLACE MANAGEMENT</span>
          <h2>Pet Listings</h2>
          <p>
            Monitor and manage pet listings across the entire Pawdigree
            marketplace, including approved and previously rejected listings.
          </p>
        </div>

        <button
          type="button"
          className="management-secondary"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="management-alert" role="alert">{error}</div>}
      {success && <div className="management-success" role="status">{success}</div>}

      <form className="pet-admin-filters" onSubmit={applyFilters}>
        <div className="management-search">
          <Search size={17} />
          <input
            aria-label="Search pet listings"
            placeholder="Search pet, breed or business"
            value={filters.search ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
          />
        </div>
            <input
  aria-label="Filter by species"
  placeholder="Species (e.g. Dog)"
  value={filters.species ?? ""}
  onChange={(event) =>
    setFilters((current) => ({
      ...current,
      species: event.target.value,
    }))
  }
/>
        <select
          aria-label="Filter by species"
          value={filters.species ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              species: event.target.value,
            }))
          }
        >
          <option value="">All species</option>
          <option value="DOG">Dogs</option>
          <option value="CAT">Cats</option>
          <option value="BIRD">Birds</option>
          <option value="OTHER">Other</option>
        </select>

        <select
          aria-label="Filter by listing type"
          value={filters.listing_type ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              listing_type: event.target.value as AdminPetListingFilters["listing_type"],
            }))
          }
        >
          <option value="">All listing types</option>
          <option value="ADOPTION">Adoption</option>
          <option value="SALE">For sale</option>
        </select>

        <select
          aria-label="Filter by review status"
          value={filters.review_status ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              review_status: event.target.value as AdminPetListingFilters["review_status"],
            }))
          }
        >
          <option value="">All review statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          aria-label="Filter by adoption status"
          value={filters.adoption_status ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              adoption_status: event.target.value as AdminPetListingFilters["adoption_status"],
            }))
          }
        >
          <option value="">All availability statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="PENDING">Pending</option>
          <option value="ADOPTED">Adopted</option>
        </select>

        <select
          aria-label="Filter by active status"
          value={filters.is_active ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              is_active: event.target.value as AdminPetListingFilters["is_active"],
            }))
          }
        >
          <option value="">Active and inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>

        <button type="submit" className="management-approve" disabled={loading}>
          Apply filters
        </button>

        <button
          type="button"
          className="management-secondary"
          onClick={() => {
            setFilters(emptyFilters);
            setAppliedFilters(emptyFilters);
            setPage(1);
            setLoading(true);
            setSuccess("");
          }}
        >
          Clear
        </button>
      </form>

      <div className="management-toolbar">
        <span className="management-count">
          {count} pet listing{count === 1 ? "" : "s"} found
        </span>
      </div>

      <div className="management-card">
        {loading ? (
          <div className="management-state" role="status">
            Loading pet listings…
          </div>
        ) : error && pets.length === 0 ? (
          <div className="management-state">
            Unable to load pet listings. Check the error above and try again.
          </div>
        ) : pets.length === 0 ? (
          <div className="management-state">
            <PawPrint size={28} />
            <strong>No pet listings found</strong>
            <span>Try changing your search or filters.</span>
          </div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Pet</th>
                  <th>Business</th>
                  <th>Listing type</th>
                  <th>Review status</th>
                  <th>Availability</th>
                  <th>Active</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {pets.map((pet) => (
                  <tr key={pet.pet_id}>
                    <td className="management-name">
                      {display(pet.name, "Unnamed pet")}
                      <small>#{pet.pet_id} · {display(pet.species)}</small>
                    </td>
                    <td>{display(pet.business_name, `Business #${pet.business}`)}</td>
                    <td>{pet.listing_type === "SALE" ? "For sale" : "Adoption"}</td>
                    <td>
                      <span className={`pet-admin-status status-${pet.review_status.toLowerCase()}`}>
                        {pet.review_status}
                      </span>
                    </td>
                    <td>{pet.adoption_status}</td>
                    <td>{pet.is_active ? "Active" : "Inactive"}</td>
                    <td>{formatDate(pet.created_at)}</td>
                    <td>
                      <div className="management-actions">
                        <button
                          type="button"
                          className="management-icon-button"
                          aria-label={`View ${pet.name}`}
                          title="View details"
                          onClick={() => void openDetails(pet)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="management-icon-button"
                          aria-label={`Edit ${pet.name}`}
                          title="Edit listing"
                          onClick={() => void openDetails(pet)}
                        >
                          <Pencil size={16} />
                        </button>
                        {pet.is_active && (
                          <button
                            type="button"
                            className="management-icon-button pet-admin-delete"
                            aria-label={`Deactivate ${pet.name}`}
                            title="Deactivate listing"
                            disabled={busyId === pet.pet_id}
                            onClick={() => void deactivateListing(pet)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-table-footer admin-directory-footer">
        <span>
          Page {page} · {firstItem}–{lastItem} of {count}
        </span>
        <div className="admin-pagination">
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={!hasPrevious || loading}
          >
            <ChevronLeft size={17} /> Previous
          </button>
          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={!hasNext || loading}
          >
            Next <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {selectedPet && (
        <div
          className="management-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPet(null);
              setEditing(false);
            }
          }}
        >
          <section
            className="management-modal pet-admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pet-admin-modal-title"
          >
            <div className="management-modal-head">
              <div>
                <span className="management-eyebrow">
                  PET LISTING · #{selectedPet.pet_id}
                </span>
                <h3 id="pet-admin-modal-title">
                  {editing ? "Correct listing" : selectedPet.name}
                </h3>
              </div>
              <button
                type="button"
                className="management-icon-button"
                aria-label="Close"
                onClick={() => {
                  setSelectedPet(null);
                  setEditing(false);
                }}
              >
                <X size={19} />
              </button>
            </div>

            {editing ? (
              <form onSubmit={saveChanges}>
                <label>
                  Pet name
                  <input
                    required
                    value={editForm.name ?? ""}
                    onChange={(event) => updateField("name", event.target.value)}
                  />
                </label>

                <div className="pet-admin-form-grid">
                  <label>
                    Species
                    <input
                      required
                      value={editForm.species ?? ""}
                      onChange={(event) => updateField("species", event.target.value)}
                    />
                  </label>
                  <label>
                    Breed
                    <input
                      value={editForm.breed ?? ""}
                      onChange={(event) => updateField("breed", event.target.value)}
                    />
                  </label>
                  <label>
                    Age (months)
                    <input
                      type="number"
                      min="0"
                      required
                      value={editForm.age ?? 0}
                      onChange={(event) => updateField("age", Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Gender
                    <select
                      value={editForm.gender ?? "UNKNOWN"}
                      onChange={(event) =>
                        updateField("gender", event.target.value as AdminPetListingUpdate["gender"])
                      }
                    >
                      <option value="UNKNOWN">Unknown</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </label>
                  <label>
                    Size
                    <select
                      value={editForm.size ?? "MEDIUM"}
                      onChange={(event) =>
                        updateField("size", event.target.value as AdminPetListingUpdate["size"])
                      }
                    >
                      <option value="SMALL">Small</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LARGE">Large</option>
                    </select>
                  </label>
                  <label>
                    Listing type
                    <select
                      value={editForm.listing_type ?? "ADOPTION"}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          listing_type: event.target.value as AdminPetListingUpdate["listing_type"],
                          price: event.target.value === "ADOPTION" ? null : current.price,
                        }))
                      }
                    >
                      <option value="ADOPTION">Adoption</option>
                      <option value="SALE">For sale</option>
                    </select>
                  </label>
                  {editForm.listing_type === "SALE" && (
                    <label>
                      Price (UGX)
                      <input
                        type="number"
                        min="1"
                        required
                        value={editForm.price ?? ""}
                        onChange={(event) => updateField("price", event.target.value)}
                      />
                    </label>
                  )}
                  <label>
                    Adoption status
                    <select
                      value={editForm.adoption_status ?? "AVAILABLE"}
                      onChange={(event) =>
                        updateField(
                          "adoption_status",
                          event.target.value as AdminPetListingUpdate["adoption_status"]
                        )
                      }
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="PENDING">Pending</option>
                      <option value="ADOPTED">Adopted</option>
                    </select>
                  </label>
                </div>

                <label>
                  Description
                  <textarea
                    rows={4}
                    value={editForm.description ?? ""}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                  />
                </label>

                <p className="pet-admin-note">
                  Editing listing details does not change its review status or
                  approval decision.
                </p>

                <div className="management-modal-actions">
                  <button
                    type="button"
                    className="management-secondary"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="management-approve"
                    disabled={busyId === selectedPet.pet_id}
                  >
                    {busyId === selectedPet.pet_id ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <dl className="management-pet-grid">
                  <div><dt>Species / breed</dt><dd>{display(selectedPet.species)} / {display(selectedPet.breed)}</dd></div>
                  <div><dt>Business</dt><dd>{display(selectedPet.business_name, `Business #${selectedPet.business}`)}</dd></div>
                  <div><dt>Vendor ID</dt><dd>{display(selectedPet.vendor)}</dd></div>
                  <div><dt>Listing type</dt><dd>{selectedPet.listing_type}</dd></div>
                  <div><dt>Age</dt><dd>{selectedPet.age} months</dd></div>
                  <div><dt>Gender / size</dt><dd>{selectedPet.gender} / {selectedPet.size}</dd></div>
                  <div><dt>Price</dt><dd>{formatPrice(selectedPet.price)}</dd></div>
                  <div><dt>Adoption status</dt><dd>{selectedPet.adoption_status}</dd></div>
                  <div><dt>Review status</dt><dd>{selectedPet.review_status}</dd></div>
                  <div><dt>Active</dt><dd>{selectedPet.is_active ? "Yes" : "No"}</dd></div>
                  <div><dt>Created</dt><dd>{formatDate(selectedPet.created_at)}</dd></div>
                  <div><dt>Last updated</dt><dd>{formatDate(selectedPet.updated_at)}</dd></div>
                </dl>

                {selectedPet.rejection_reason && (
                  <div className="pet-admin-note">
                    <strong>Rejection reason:</strong> {selectedPet.rejection_reason}
                  </div>
                )}

                <div className="management-pet-description">
                  <strong>Description</strong>
                  <p>{selectedPet.description || "No description provided."}</p>
                </div>

                {selectedPet.images.length > 0 && (
                  <div className="management-pet-images">
                    <strong>Photos</strong>
                    <div>
                      {selectedPet.images.map((image) => (
                        <img
                          key={image.image_id}
                          src={image.image}
                          alt={`${selectedPet.name} listing`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="management-modal-actions">
                  <button
                    type="button"
                    className="management-secondary"
                    onClick={() => setSelectedPet(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="management-approve"
                    onClick={startEditing}
                    disabled={!selectedPet.is_active}
                  >
                    <Pencil size={15} /> Edit listing
                  </button>
                  {selectedPet.is_active && (
                    <button
                      type="button"
                      className="management-reject"
                      disabled={busyId === selectedPet.pet_id}
                      onClick={() => void deactivateListing(selectedPet)}
                    >
                      <Trash2 size={15} /> Deactivate
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
