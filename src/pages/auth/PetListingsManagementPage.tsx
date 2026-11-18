
import { useEffect, useState, type FormEvent } from "react";
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
  Check,
} from "lucide-react";
import {
  adminApi,
  type PendingPet,
  type AdminPetListingFilters,
  type AdminPetListingUpdate,
  type AdminPetBusiness,
  type AdminPetCreateInput,
} from "../../services/adminApi";
import { ApiError } from "../../services/api";
import "../AdminManagement.css";
import "./PetListingsManagementPage.css";

const PAGE_SIZE = 20;

type PetManagementTab = "PENDING" | "APPROVED" | "REJECTED";

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

const emptyCreateForm: AdminPetCreateInput = {
  business: "",
  listing_type: "ADOPTION",
  name: "",
  species: "",
  age: 0,
  gender: "UNKNOWN",
  size: "MEDIUM",
  breed: "",
  description: "",
};

export function PetListingsManagementPage() {
  const [pets, setPets] = useState<PendingPet[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const initialFilters: AdminPetListingFilters = {
    ...emptyFilters,
    review_status: "PENDING",
  };

  const [filters, setFilters] =
    useState<AdminPetListingFilters>(initialFilters);

  const [appliedFilters, setAppliedFilters] =
    useState<AdminPetListingFilters>(initialFilters);

  const [activeTab, setActiveTab] =
    useState<PetManagementTab>("PENDING");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reload, setReload] = useState(0);

  const [selectedPet, setSelectedPet] = useState<PendingPet | null>(null);
  const [editing, setEditing] = useState(false);

  const [editForm, setEditForm] =
    useState<AdminPetListingUpdate>(emptyForm);

  const [rejectingPet, setRejectingPet] =
    useState<PendingPet | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  // Create pet listing state
  const [createOpen, setCreateOpen] = useState(false);

  const [createForm, setCreateForm] =
    useState<AdminPetCreateInput>(emptyCreateForm);

  const [businesses, setBusinesses] = useState<AdminPetBusiness[]>([]);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
 const [selectedImages, setSelectedImages] = useState<File[]>([]);
const imagePreviews = selectedImages.map((file) =>
  URL.createObjectURL(file)
);
  // Fetch pet listings whenever filters, page or reload changes.
  useEffect(() => {
    let cancelled = false;

    const fetchListings = async () => {
      setLoading(true);

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

  // Open the Add New Pet form and load eligible businesses.
  const openCreateForm = async () => {
    setCreateOpen(true);
    setCreateForm(emptyCreateForm);
    setSelectedImages([]);
    setError("");
    setSuccess("");
    setBusinessLoading(true);

    try {
      const result = await adminApi.getAdminPetBusinesses();
      setBusinesses(result);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusinessLoading(false);
    }
  };

  const updateCreateField = <K extends keyof AdminPetCreateInput>(
    field: K,
    value: AdminPetCreateInput[K]
  ) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // Create a new pet listing.
  const submitCreatePet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = createForm.name.trim();
    const species = createForm.species.trim();
    const age = Number(createForm.age);
    const price = Number(createForm.price);

    if (!createForm.business) {
      setError("Please select a business.");
      return;
    }

    if (!name || !species) {
      setError("Please enter the pet's name and species.");
      return;
    }

    if (!Number.isInteger(age) || age < 0) {
      setError("Age must be a whole number of months.");
      return;
    }

    if (
      createForm.listing_type === "SALE" &&
      (
        createForm.price === undefined ||
        !Number.isFinite(price) ||
        price <= 0
      )
    ) {
      setError("Enter a valid sale price greater than zero.");
      return;
    }

    if (selectedImages.length > 10) {
      setError("You can upload a maximum of 10 images.");
      return;
    }

    const formData = new FormData();

    formData.append("business", createForm.business);
    formData.append("listing_type", createForm.listing_type);
    formData.append("name", name);
    formData.append("species", species);
    formData.append("age", String(age));
    formData.append("gender", createForm.gender);
    formData.append("size", createForm.size);

    if (createForm.breed?.trim()) {
      formData.append("breed", createForm.breed.trim());
    }

    if (createForm.description?.trim()) {
      formData.append("description", createForm.description.trim());
    }

    if (createForm.listing_type === "SALE") {
      formData.append("price", String(price));
    }

    selectedImages.forEach((file) => {
      formData.append("images", file);
    });

    setCreateLoading(true);
    setError("");
    setSuccess("");

    try {
      const created = await adminApi.createAdminPet(formData);

      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      setSelectedImages([]);

      const approvedFilters: AdminPetListingFilters = {
        ...emptyFilters,
        review_status: "APPROVED",
      };

      setActiveTab("APPROVED");
      setFilters(approvedFilters);
      setAppliedFilters(approvedFilters);
      setPage(1);
      setLoading(true);

      setSuccess(
        `${created.name} was created successfully and added to Approved listings.`
      );

      setReload((value) => value + 1);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setCreateLoading(false);
    }
  };

  // Refresh the current listing results.
  const refresh = () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setReload((value) => value + 1);
  };

  // Apply the selected filters.
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setPage(1);

    setAppliedFilters({
      ...filters,
      review_status: activeTab,
    });
  };

  const changePage = (nextPage: number) => {
    setLoading(true);
    setPage(nextPage);
  };

  const changeTab = (tab: PetManagementTab) => {
    setActiveTab(tab);
    setPage(1);
    setLoading(true);
    setError("");
    setSuccess("");

    setFilters((current) => ({
      ...current,
      review_status: tab,
    }));

    setAppliedFilters((current) => ({
      ...current,
      review_status: tab,
    }));
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

  const saveChanges = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPet) return;

    const price =
      editForm.listing_type === "SALE"
        ? String(editForm.price ?? "").trim()
        : null;

    if (
      editForm.listing_type === "SALE" &&
      (
        !price ||
        !Number.isFinite(Number(price)) ||
        Number(price) <= 0
      )
    ) {
      setError("Enter a valid sale price greater than zero.");
      return;
    }

    if (
      Number(editForm.age) < 0 ||
      !Number.isFinite(Number(editForm.age))
    ) {
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

  const approveListing = async (pet: PendingPet) => {
    const confirmed = window.confirm(
      `Approve "${pet.name}"? This listing will become approved.`
    );

    if (!confirmed) return;

    setBusyId(pet.pet_id);
    setError("");
    setSuccess("");

    try {
      await adminApi.approvePet(pet.pet_id);

      setSelectedPet(null);
      setSuccess(`${pet.name} was approved successfully.`);
      setReload((value) => value + 1);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  const rejectListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!rejectingPet) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      setError("Please provide a reason for rejecting this listing.");
      return;
    }

    setBusyId(rejectingPet.pet_id);
    setError("");
    setSuccess("");

    try {
      await adminApi.rejectPet(rejectingPet.pet_id, reason);

      setSuccess(
        `${rejectingPet.name} was rejected. The reason was sent to the vendor.`
      );

      setRejectingPet(null);
      setRejectionReason("");
      setSelectedPet(null);
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
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const firstItem = count ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(page * PAGE_SIZE, count);

  return (
    <section className="management-page">
      <div className="management-intro">
        <div>
          <span className="management-eyebrow">
            MARKETPLACE MANAGEMENT
          </span>

          <h2>Pet Management</h2>

          <p>
            Review pending pet listings and manage approved and rejected
            listings across the Pawdigree marketplace.
          </p>
        </div>

        <div className="pet-admin-intro-actions">
          <button
            type="button"
            className="management-approve"
            onClick={() => void openCreateForm()}
          >
            <PawPrint size={16} /> Add New Pet
          </button>

          <button
            type="button"
            className="management-secondary"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="management-alert" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="management-success" role="status">
          {success}
        </div>
      )}

      <div
        className="pet-management-tabs"
        role="tablist"
        aria-label="Pet listing status"
      >
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`pet-management-tab ${
              activeTab === tab ? "active" : ""
            }`}
            onClick={() => changeTab(tab)}
          >
            {tab === "PENDING"
              ? "Pending"
              : tab === "APPROVED"
                ? "Approved"
                : "Rejected"}
          </button>
        ))}
      </div>

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

        <button
          type="submit"
          className="management-approve"
          disabled={loading}
        >
          Apply filters
        </button>

        <button
          type="button"
          className="management-secondary"
          onClick={() => {
            const clearedFilters: AdminPetListingFilters = {
              ...emptyFilters,
              review_status: activeTab,
            };

            setFilters(clearedFilters);
            setAppliedFilters(clearedFilters);
            setPage(1);
            setLoading(true);
            setError("");
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
                      <small>
                        #{pet.pet_id} · {display(pet.species)}
                      </small>
                    </td>

                    <td>
                      {display(
                        pet.business_name,
                        `Business #${pet.business}`
                      )}
                    </td>

                    <td>
                      {pet.listing_type === "SALE" ? "For sale" : "Adoption"}
                    </td>

                    <td>
                      <span
                        className={`pet-admin-status status-${pet.review_status.toLowerCase()}`}
                      >
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

                        {pet.review_status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              className="management-icon-button"
                              aria-label={`Approve ${pet.name}`}
                              title="Approve listing"
                              disabled={busyId === pet.pet_id}
                              onClick={() => void approveListing(pet)}
                            >
                              <Check size={16} />
                            </button>

                            <button
                              type="button"
                              className="management-icon-button pet-admin-delete"
                              aria-label={`Reject ${pet.name}`}
                              title="Reject listing"
                              disabled={busyId === pet.pet_id}
                              onClick={() => {
                                setRejectingPet(pet);
                                setRejectionReason("");
                                setError("");
                              }}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}

                        {pet.review_status !== "PENDING" && (
                          <button
                            type="button"
                            className="management-icon-button"
                            aria-label={`Edit ${pet.name}`}
                            title="Edit listing"
                            onClick={() => void openDetails(pet)}
                          >
                            <Pencil size={16} />
                          </button>
                        )}

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

      {/* Add New Pet modal */}
      {createOpen && (
        <div className="management-modal-backdrop">
          <section
            className="management-modal pet-admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-pet-title"
          >
            <div className="management-modal-head">
              <div>
                <span className="management-eyebrow">
                  MARKETPLACE MANAGEMENT
                </span>
                <h3 id="create-pet-title">Add New Pet</h3>
              </div>

              <button
                type="button"
                className="management-icon-button"
                aria-label="Close"
                disabled={createLoading}
                onClick={() => setCreateOpen(false)}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={submitCreatePet}>
              {error && (
                <div className="management-alert" role="alert">
                  {error}
                </div>
              )}

              <label>
                Business
                <select
                  required
                  value={createForm.business}
                  disabled={businessLoading || createLoading}
                  onChange={(event) =>
                    updateCreateField("business", event.target.value)
                  }
                >
                  <option value="">
                    {businessLoading
                      ? "Loading eligible businesses..."
                      : "Select a business"}
                  </option>

                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </label>

              {!businessLoading && businesses.length === 0 && (
                <p className="pet-admin-note">
                  No eligible businesses were returned. Refresh the page or
                  check that an approved and active Pet Sale and Adoption
                  business exists.
                </p>
              )}

              <div className="pet-admin-form-grid">
                <label>
                  Listing type
                  <select
                    required
                    value={createForm.listing_type}
                    disabled={createLoading}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        listing_type: event.target.value as "SALE" | "ADOPTION",
                        price: undefined,
                      }))
                    }
                  >
                    <option value="ADOPTION">Adoption</option>
                    <option value="SALE">For sale</option>
                  </select>
                </label>

                <label>
                  Pet name
                  <input
                    required
                    value={createForm.name}
                    disabled={createLoading}
                    placeholder="e.g. Max"
                    onChange={(event) =>
                      updateCreateField("name", event.target.value)
                    }
                  />
                </label>

                <label>
                  Species
                  <input
                    required
                    value={createForm.species}
                    disabled={createLoading}
                    placeholder="e.g. Dog, Cat, Bird"
                    onChange={(event) =>
                      updateCreateField("species", event.target.value)
                    }
                  />
                </label>

                <label>
                  Breed
                  <input
                    value={createForm.breed ?? ""}
                    disabled={createLoading}
                    placeholder="e.g. German Shepherd"
                    onChange={(event) =>
                      updateCreateField("breed", event.target.value)
                    }
                  />
                </label>

                <label>
                  Age (months)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={createForm.age}
                    disabled={createLoading}
                    onChange={(event) =>
                      updateCreateField("age", Number(event.target.value))
                    }
                  />
                </label>

                <label>
                  Gender
                  <select
                    required
                    value={createForm.gender}
                    disabled={createLoading}
                    onChange={(event) =>
                      updateCreateField(
                        "gender",
                        event.target.value as AdminPetCreateInput["gender"]
                      )
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
                    required
                    value={createForm.size}
                    disabled={createLoading}
                    onChange={(event) =>
                      updateCreateField(
                        "size",
                        event.target.value as AdminPetCreateInput["size"]
                      )
                    }
                  >
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LARGE">Large</option>
                  </select>
                </label>

                {createForm.listing_type === "SALE" && (
                  <label>
                    Price (UGX)
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={createForm.price ?? ""}
                      disabled={createLoading}
                      placeholder="Enter sale price"
                      onChange={(event) =>
                        updateCreateField(
                          "price",
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value)
                        )
                      }
                    />
                  </label>
                )}
              </div>

              <label>
                Description
                <textarea
                  rows={4}
                  value={createForm.description ?? ""}
                  disabled={createLoading}
                  placeholder="Tell customers about this pet..."
                  onChange={(event) =>
                    updateCreateField("description", event.target.value)
                  }
                />
              </label>

              <label className="pet-admin-image-upload">
                Pet photos (maximum 10)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={createLoading}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);

                    if (files.length > 10) {
                      setError("You can select a maximum of 10 images.");
                      event.target.value = "";
                      return;
                    }

                    setError("");
                    setSelectedImages(files);
                  }}
                />
              </label>

              {imagePreviews.length > 0 && (
                <div className="pet-admin-image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={`${preview}-${index}`}>
                      <img
                        src={preview}
                        alt={`Selected pet photo ${index + 1}`}
                      />

                      <span>
                        {index === 0 ? "Primary photo" : `Photo ${index + 1}`}
                      </span>

                      <button
                        type="button"
                        disabled={createLoading}
                        onClick={() =>
                          setSelectedImages((current) =>
                            current.filter(
                              (_, imageIndex) => imageIndex !== index
                            )
                          )
                        }
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="pet-admin-note">
                Admin-created listings are approved automatically. The first
                uploaded photo becomes the primary image.
              </p>

              <div className="management-modal-actions">
                <button
                  type="button"
                  className="management-secondary"
                  disabled={createLoading}
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="management-approve"
                  disabled={
                    createLoading ||
                    businessLoading ||
                    businesses.length === 0
                  }
                >
                  {createLoading ? "Creating listing..." : "Create Pet Listing"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Reject listing modal */}
      {rejectingPet && (
        <div className="management-modal-backdrop">
          <section
            className="management-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-pet-title"
          >
            <div className="management-modal-head">
              <div>
                <span className="management-eyebrow">
                  REJECT PET LISTING
                </span>

                <h3 id="reject-pet-title">
                  Reject {rejectingPet.name}
                </h3>
              </div>

              <button
                type="button"
                className="management-icon-button"
                aria-label="Close"
                onClick={() => {
                  setRejectingPet(null);
                  setRejectionReason("");
                }}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={rejectListing}>
              <label>
                Reason for rejection
                <textarea
                  rows={5}
                  required
                  maxLength={1000}
                  value={rejectionReason}
                  placeholder="Explain why this pet listing cannot be approved..."
                  onChange={(event) =>
                    setRejectionReason(event.target.value)
                  }
                />
              </label>

              <p className="pet-admin-note">
                This reason will be sent to the vendor so they can
                understand why the listing was rejected.
              </p>

              <div className="management-modal-actions">
                <button
                  type="button"
                  className="management-secondary"
                  onClick={() => {
                    setRejectingPet(null);
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="management-reject"
                  disabled={busyId === rejectingPet.pet_id}
                >
                  {busyId === rejectingPet.pet_id
                    ? "Rejecting..."
                    : "Confirm rejection"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* View and edit pet details modal */}
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
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                  />
                </label>

                <div className="pet-admin-form-grid">
                  <label>
                    Species
                    <input
                      required
                      value={editForm.species ?? ""}
                      onChange={(event) =>
                        updateField("species", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Breed
                    <input
                      value={editForm.breed ?? ""}
                      onChange={(event) =>
                        updateField("breed", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Age (months)
                    <input
                      type="number"
                      min="0"
                      required
                      value={editForm.age ?? 0}
                      onChange={(event) =>
                        updateField("age", Number(event.target.value))
                      }
                    />
                  </label>

                  <label>
                    Gender
                    <select
                      value={editForm.gender ?? "UNKNOWN"}
                      onChange={(event) =>
                        updateField(
                          "gender",
                          event.target.value as AdminPetListingUpdate["gender"]
                        )
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
                        updateField(
                          "size",
                          event.target.value as AdminPetListingUpdate["size"]
                        )
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
                          price:
                            event.target.value === "ADOPTION"
                              ? null
                              : current.price,
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
                        onChange={(event) =>
                          updateField("price", event.target.value)
                        }
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
                  Editing listing details does not change its review
                  status or approval decision.
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
                    {busyId === selectedPet.pet_id
                      ? "Saving…"
                      : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <dl className="management-pet-grid">
                  <div>
                    <dt>Species / breed</dt>
                    <dd>
                      {display(selectedPet.species)} /{" "}
                      {display(selectedPet.breed)}
                    </dd>
                  </div>

                  <div>
                    <dt>Business</dt>
                    <dd>
                      {display(
                        selectedPet.business_name,
                        `Business #${selectedPet.business}`
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Vendor ID</dt>
                    <dd>{display(selectedPet.vendor)}</dd>
                  </div>

                  <div>
                    <dt>Listing type</dt>
                    <dd>{selectedPet.listing_type}</dd>
                  </div>

                  <div>
                    <dt>Age</dt>
                    <dd>{selectedPet.age} months</dd>
                  </div>

                  <div>
                    <dt>Gender / size</dt>
                    <dd>
                      {selectedPet.gender} / {selectedPet.size}
                    </dd>
                  </div>

                  <div>
                    <dt>Price</dt>
                    <dd>{formatPrice(selectedPet.price)}</dd>
                  </div>

                  <div>
                    <dt>Adoption status</dt>
                    <dd>{selectedPet.adoption_status}</dd>
                  </div>

                  <div>
                    <dt>Review status</dt>
                    <dd>{selectedPet.review_status}</dd>
                  </div>

                  <div>
                    <dt>Active</dt>
                    <dd>{selectedPet.is_active ? "Yes" : "No"}</dd>
                  </div>

                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(selectedPet.created_at)}</dd>
                  </div>

                  <div>
                    <dt>Last updated</dt>
                    <dd>{formatDate(selectedPet.updated_at)}</dd>
                  </div>
                </dl>

                {selectedPet.rejection_reason && (
                  <div className="pet-admin-note">
                    <strong>Rejection reason:</strong>{" "}
                    {selectedPet.rejection_reason}
                  </div>
                )}

                <div className="management-pet-description">
                  <strong>Description</strong>
                  <p>
                    {selectedPet.description || "No description provided."}
                  </p>
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
