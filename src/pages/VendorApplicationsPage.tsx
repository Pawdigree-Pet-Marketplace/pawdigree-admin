
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminApi,
  type VendorApplicationApi,
  type VendorApiStatus,
  type VendorDecision,
  type VendorDocument,
} from "../services/adminApi";
import { ApiError } from "../services/api";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  Building2,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  RotateCcw,
  LoaderCircle,
} from "lucide-react";
import "./VendorApplicationsPage.css";

type VendorStatus =
  | "Pending"
  | "Approved"
  | "Changes Requested"
  | "Suspended"
  | "Rejected"
  | "Draft";

type BusinessType =
  | "Product Seller"
  | "Service Provider"
  | "Pet Sale / Adoption";

type VendorApplication = {
  id: string;
  businessName: string;
  businessTypes: string[];
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  documents: VendorDocument[];
  images: Array<{
    id: string | number;
    image?: string;
    alt_text?: string;
  }>;
  submittedDate: string;
  status: VendorStatus;
  reviewMessage: string;
};

// Convert API status values into readable labels.
function mapApiStatus(status: VendorApiStatus): VendorStatus {
  switch (status) {
    case "changes_requested":
      return "Changes Requested";
    case "approved":
      return "Approved";
    case "suspended":
      return "Suspended";
    case "rejected":
      return "Rejected";
    case "draft":
      return "Draft";
    case "pending":
    default:
      return "Pending";
  }
}

// Convert API business type values into readable labels.
function formatBusinessType(value: unknown): string {
  if (typeof value !== "string") return "";

  const normalized = value.toLowerCase().trim();

  const knownTypes: Record<string, BusinessType> = {
    product_seller: "Product Seller",
    "product seller": "Product Seller",
    service_provider: "Service Provider",
    "service provider": "Service Provider",
    pet_sale_adoption: "Pet Sale / Adoption",
    pet_sale_and_adoption: "Pet Sale / Adoption",
    pet_sales_and_adoption: "Pet Sale / Adoption",
    "pet sale / adoption": "Pet Sale / Adoption",
    "pet sale and adoption": "Pet Sale / Adoption",
    pet_sale: "Pet Sale / Adoption",
    adoption: "Pet Sale / Adoption",
  };

  if (knownTypes[normalized]) {
    return knownTypes[normalized];
  }

  // Preserve an unfamiliar API value instead of hiding it.
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

// Support multiple business types and the previous single-type API field.
function getBusinessTypes(application: VendorApplicationApi): string[] {
  const extendedApplication = application as VendorApplicationApi & {
    business_types?: unknown;
    business_type?: unknown;
  };

  const apiTypes =
    extendedApplication.business_types ??
    extendedApplication.business_type;

  if (Array.isArray(apiTypes)) {
    return [
      ...new Set(
        apiTypes
          .map((item) => {
            if (typeof item === "string") {
              return formatBusinessType(item);
            }

            if (item && typeof item === "object") {
              const typeObject = item as {
                value?: unknown;
                name?: unknown;
                business_type?: unknown;
              };

              return formatBusinessType(
                typeObject.value ??
                  typeObject.name ??
                  typeObject.business_type,
              );
            }

            return "";
          })
          .filter(Boolean),
      ),
    ];
  }

  const singleType = formatBusinessType(apiTypes);

  return singleType ? [singleType] : [];
}

function mapVendorApplication(
  application: VendorApplicationApi,
): VendorApplication {
  return {
    id: application.id,
    businessName: application.name,
    businessTypes: getBusinessTypes(application),
    ownerName: application.vendor_username || "Owner not provided",
    email:
      application.email || application.vendor_email || "Email not provided",
    phone: application.contact || "Phone not provided",
    address:
      [application.address, application.city_district]
        .filter(Boolean)
        .join(", ") || "Address not provided",
    documents: application.documents ?? [],
    images: application.images ?? [],
    submittedDate: application.created_at
      ? new Date(application.created_at).toLocaleDateString()
      : "Date not provided",
    status: mapApiStatus(application.verification_status),
    reviewMessage:
      application.decision_reason || application.vendor_response || "",
  };
}

const statusOptions: Array<"All" | VendorStatus> = [
  "All",
  "Pending",
  "Approved",
  "Changes Requested",
  "Suspended",
  "Rejected",
];

export function VendorApplicationsPage() {
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | VendorStatus>("All");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [previousPage, setPreviousPage] = useState<string | null>(null);

    // Fetch vendor applications in one place.
  const loadApplications = useCallback(async () => {
    try {
      const response = await adminApi.getVendorApplications("all", page);

      // Draft applications are not ready for the admin review queue.
      const submittedApplications = response.results.filter(
        (application) => application.verification_status !== "draft",
      );

      setApplications(submittedApplications.map(mapVendorApplication));
      setTotalCount(response.count);
      setNextPage(response.next);
      setPreviousPage(response.previous);
      setError("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load vendor applications. Please try again.",
      );
      setApplications([]);
      setTotalCount(0);
      setNextPage(null);
      setPreviousPage(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

    // Reload when the page changes.
  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadApplications();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadApplications]);

  // Search and status filtering.
  const filteredApplications = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return applications.filter((application) => {
      const searchableBusinessTypes = application.businessTypes
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        application.businessName.toLowerCase().includes(search) ||
        application.ownerName.toLowerCase().includes(search) ||
        application.email.toLowerCase().includes(search) ||
        searchableBusinessTypes.includes(search);

      const matchesStatus =
        statusFilter === "All" || application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const selectedApplication =
    applications.find((application) => application.id === selectedId) ?? null;

  // Status counts are based on the currently loaded API page.
  const counts = {
    total: totalCount,
    pending: applications.filter((item) => item.status === "Pending").length,
    approved: applications.filter((item) => item.status === "Approved").length,
    suspended: applications.filter((item) => item.status === "Suspended").length,
  };

  function selectStatusFilter(status: "All" | VendorStatus) {
    setStatusFilter(status);
    setSearchTerm("");
  }

  function openReview(application: VendorApplication) {
    setSelectedId(application.id);
    setReviewMessage(application.reviewMessage);
    setFeedback("");
  }

  function closeReview() {
    if (submittingDecision) return;

    setSelectedId(null);
    setReviewMessage("");
    setFeedback("");
  }

  async function submitDecision(
    action: VendorDecision,
    successStatus: VendorStatus,
    reason = "",
  ) {
    if (!selectedApplication || submittingDecision) return;

    if (
      (action === "request_changes" || action === "suspend") &&
      !reason.trim()
    ) {
      setFeedback(
        action === "request_changes"
          ? "Please explain what the vendor needs to change."
          : "Please provide a reason for suspending this vendor.",
      );
      return;
    }

    if (action === "suspend") {
      const confirmed = window.confirm(
        `Are you sure you want to suspend ${selectedApplication.businessName}?`,
      );

      if (!confirmed) return;
    }

    setSubmittingDecision(true);
    setFeedback("");

    try {
      await adminApi.decideVendorApplication(
        selectedApplication.id,
        action,
        reason.trim() || undefined,
      );

      const businessName = selectedApplication.businessName;

      setSelectedId(null);
      setReviewMessage("");
      setFeedback(
        `${businessName} was successfully updated to "${successStatus}".`,
      );

      await loadApplications();
    } catch (err) {
      setFeedback(
        err instanceof ApiError
          ? err.message
          : "The decision could not be submitted. Please try again.",
      );
    } finally {
      setSubmittingDecision(false);
    }
  }

  function requestChanges() {
    void submitDecision("request_changes", "Changes Requested", reviewMessage);
  }

  function suspendVendor() {
    void submitDecision("suspend", "Suspended", reviewMessage);
  }

  function approveVendor() {
    void submitDecision("approve", "Approved");
  }

  function reapproveVendor() {
    void submitDecision("reapprove", "Approved");
  }

  function getStatusClass(status: VendorStatus) {
    switch (status) {
      case "Pending":
        return "status-pending";
      case "Approved":
        return "status-approved";
      case "Changes Requested":
        return "status-changes";
      case "Suspended":
        return "status-suspended";
      case "Rejected":
        return "status-rejected";
      default:
        return "";
    }
  }

  return (
    <div className="vendor-applications-page">
      <div className="vendor-page-heading">
        <div>
          <p className="vendor-eyebrow">
            ADMINISTRATION / VENDOR MANAGEMENT
          </p>
          <h1>Vendor Applications</h1>
          <p className="vendor-page-description">
            Review vendor applications, verify documents, and manage vendor
            approval status.
          </p>
        </div>

        <div className="vendor-heading-icon">
          <ShieldCheck size={30} />
        </div>
      </div>

      {loading && (
        <div className="vendor-feedback" role="status">
          Loading vendor applications...
        </div>
      )}

      {!loading && error && (
        <div className="vendor-feedback vendor-feedback-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadApplications()}
          >
            Try again
          </button>
        </div>
      )}

      {feedback && !selectedApplication && (
        <div className="vendor-feedback" role="status">
          <CheckCircle size={18} />
          <span>{feedback}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setFeedback("")}
          >
            ×
          </button>
        </div>
      )}

      {/* Clickable vendor statistics cards */}
      <div className="vendor-stats-grid">
        <button
          type="button"
          className={`vendor-stat-card vendor-stat-card-clickable ${
            statusFilter === "All" ? "vendor-stat-card-active" : ""
          }`}
          aria-pressed={statusFilter === "All"}
          onClick={() => selectStatusFilter("All")}
        >
          <div className="vendor-stat-icon">
            <Building2 size={22} />
          </div>
          <div>
            <p>Total Vendors</p>
            <h2>{counts.total}</h2>
          </div>
        </button>

        <button
          type="button"
          className={`vendor-stat-card vendor-stat-card-clickable ${
            statusFilter === "Pending" ? "vendor-stat-card-active" : ""
          }`}
          aria-pressed={statusFilter === "Pending"}
          onClick={() => selectStatusFilter("Pending")}
        >
          <div className="vendor-stat-icon pending-icon">
            <Clock size={22} />
          </div>
          <div>
            <p>Pending Review</p>
            <h2>{counts.pending}</h2>
          </div>
        </button>

        <button
          type="button"
          className={`vendor-stat-card vendor-stat-card-clickable ${
            statusFilter === "Approved" ? "vendor-stat-card-active" : ""
          }`}
          aria-pressed={statusFilter === "Approved"}
          onClick={() => selectStatusFilter("Approved")}
        >
          <div className="vendor-stat-icon approved-icon">
            <CheckCircle size={22} />
          </div>
          <div>
            <p>Approved</p>
            <h2>{counts.approved}</h2>
          </div>
        </button>

        <button
          type="button"
          className={`vendor-stat-card vendor-stat-card-clickable ${
            statusFilter === "Suspended" ? "vendor-stat-card-active" : ""
          }`}
          aria-pressed={statusFilter === "Suspended"}
          onClick={() => selectStatusFilter("Suspended")}
        >
          <div className="vendor-stat-icon suspended-icon">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p>Suspended</p>
            <h2>{counts.suspended}</h2>
          </div>
        </button>
      </div>

      <section className="vendor-applications-card">
        <div className="vendor-list-heading">
          <div>
            <h2>Vendor Management Queue</h2>
            <p>Review applications and manage vendor accounts.</p>
          </div>

          <span className="vendor-result-count">
            {filteredApplications.length} result
            {filteredApplications.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="vendor-toolbar">
          <div className="vendor-search">
            <Search size={19} />
            <input
              type="search"
              placeholder="Search business, owner, email or business type..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search vendor applications"
            />
          </div>

          <select
            className="vendor-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "All" | VendorStatus)
            }
            aria-label="Filter by vendor status"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All statuses" : status}
              </option>
            ))}
          </select>
        </div>

        <div className="vendor-table-wrapper">
          <table className="vendor-applications-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Owner</th>
                <th>Business Type</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th>Review</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <div className="vendor-business-cell">
                      <div className="vendor-business-avatar">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <strong>{application.businessName}</strong>
                        <span>{application.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>{application.ownerName}</td>

                  <td>
                    <div className="vendor-category-list">
                      {application.businessTypes.length > 0 ? (
                        application.businessTypes.map((businessType) => (
                          <span
                            className="vendor-category-tag"
                            key={businessType}
                          >
                            {businessType}
                          </span>
                        ))
                      ) : (
                        <span className="vendor-category-tag">
                          Not provided
                        </span>
                      )}
                    </div>
                  </td>

                  <td>{application.submittedDate}</td>

                  <td>
                    <span
                      className={`vendor-status-badge ${getStatusClass(
                        application.status,
                      )}`}
                    >
                      {application.status}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="vendor-review-button"
                      onClick={() => openReview(application)}
                    >
                      <Eye size={16} />
                      Review
                    </button>
                  </td>
                </tr>
              ))}

              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan={6} className="vendor-empty-state">
                    No vendor applications match your search or selected
                    status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="vendor-pagination">
        <button
          type="button"
          disabled={!previousPage || loading}
          onClick={() => setPage((currentPage) => currentPage - 1)}
        >
          Previous
        </button>

        <span>Page {page}</span>

        <button
          type="button"
          disabled={!nextPage || loading}
          onClick={() => setPage((currentPage) => currentPage + 1)}
        >
          Next
        </button>
      </div>

      {selectedApplication && (
        <div
          className="vendor-review-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeReview();
            }
          }}
        >
          <section
            className="vendor-review-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-review-title"
          >
            <div className="vendor-review-header">
              <div>
                <p className="vendor-eyebrow">VENDOR APPLICATION</p>
                <h2 id="vendor-review-title">Review Vendor</h2>
              </div>

              <button
                type="button"
                className="vendor-close-button"
                onClick={closeReview}
                disabled={submittingDecision}
                aria-label="Close vendor review"
              >
                ×
              </button>
            </div>

            <div className="vendor-review-business">
              <div className="vendor-business-avatar large-avatar">
                <Building2 size={28} />
              </div>
              <div>
                <h3>{selectedApplication.businessName}</h3>
                <span
                  className={`vendor-status-badge ${getStatusClass(
                    selectedApplication.status,
                  )}`}
                >
                  {selectedApplication.status}
                </span>
              </div>
            </div>

            {selectedApplication.status === "Draft" && (
              <div className="vendor-feedback" role="status">
                <Clock size={18} />
                <span>
                  This application has not yet been submitted by the vendor.
                  Review actions will become available once the vendor submits
                  the required documents.
                </span>
              </div>
            )}

            <div className="vendor-detail-section">
              <h3>Business and Owner Details</h3>

              <div className="vendor-detail-row">
                <Building2 size={17} />
                <div>
                  <span>Owner</span>
                  <strong>{selectedApplication.ownerName}</strong>
                </div>
              </div>

              <div className="vendor-detail-row">
                <Mail size={17} />
                <div>
                  <span>Email</span>
                  <strong>{selectedApplication.email}</strong>
                </div>
              </div>

              <div className="vendor-detail-row">
                <Phone size={17} />
                <div>
                  <span>Phone</span>
                  <strong>{selectedApplication.phone}</strong>
                </div>
              </div>

              <div className="vendor-detail-row">
                <MapPin size={17} />
                <div>
                  <span>Business Address</span>
                  <strong>{selectedApplication.address}</strong>
                </div>
              </div>

              <div className="vendor-detail-row">
                <Clock size={17} />
                <div>
                  <span>Date Submitted</span>
                  <strong>{selectedApplication.submittedDate}</strong>
                </div>
              </div>
            </div>

            <div className="vendor-detail-section">
              <h3>Business Types</h3>
              <div className="vendor-category-list">
                {selectedApplication.businessTypes.length > 0 ? (
                  selectedApplication.businessTypes.map((businessType) => (
                    <span className="vendor-category-tag" key={businessType}>
                      {businessType}
                    </span>
                  ))
                ) : (
                  <span className="vendor-category-tag">Not provided</span>
                )}
              </div>
            </div>

            <div className="vendor-detail-section">
              <h3>Submitted Documents</h3>

              <div className="vendor-documents-list">
                {selectedApplication.documents.length > 0 ? (
                  selectedApplication.documents.map((document) => (
                    <div
                      className="vendor-document-item"
                      key={document.document_id}
                    >
                      <FileText size={19} />

                      <div className="vendor-document-info">
                        <strong>
                          {document.document_type.replace(/_/g, " ")}
                        </strong>

                        <span>
                          Status: {document.review_status.replace(/_/g, " ")}
                        </span>

                        <span>Version: {document.version}</span>

                        {document.correction_reason && (
                          <span>
                            Correction note: {document.correction_reason}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No documents have been submitted for this application.</p>
                )}
              </div>
            </div>

            {selectedApplication.reviewMessage && (
              <div className="vendor-review-message">
                <strong>Previous review note</strong>
                <p>{selectedApplication.reviewMessage}</p>
              </div>
            )}

            {selectedApplication.status !== "Draft" &&
              selectedApplication.status !== "Rejected" && (
                <div className="vendor-detail-section">
                  <label
                    className="vendor-review-label"
                    htmlFor="vendor-review-message"
                  >
                    Review Notes
                  </label>

                  <textarea
                    id="vendor-review-message"
                    value={reviewMessage}
                    onChange={(event) => setReviewMessage(event.target.value)}
                    placeholder="Explain any missing documents or required changes..."
                    rows={3}
                    disabled={submittingDecision}
                  />

                  <p className="vendor-review-help">
                    Required when requesting changes. You may also add a note
                    before suspending a vendor.
                  </p>
                </div>
              )}

            {submittingDecision && (
              <div className="vendor-feedback" role="status">
                <LoaderCircle size={18} />
                <span>Processing decision. Please wait...</span>
              </div>
            )}

            <div className="vendor-review-actions">
              {selectedApplication.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="vendor-action-button approve-action"
                    onClick={approveVendor}
                    disabled={submittingDecision}
                  >
                    <CheckCircle size={17} />
                    Approve
                  </button>

                  <button
                    type="button"
                    className="vendor-action-button changes-action"
                    onClick={requestChanges}
                    disabled={submittingDecision}
                  >
                    <FileText size={17} />
                    Request Changes
                  </button>
                </>
              )}

              {selectedApplication.status === "Approved" && (
                <>
                  <button
                    type="button"
                    className="vendor-action-button changes-action"
                    onClick={requestChanges}
                    disabled={submittingDecision}
                  >
                    <FileText size={17} />
                    Request Changes
                  </button>

                  <button
                    type="button"
                    className="vendor-action-button suspend-action"
                    onClick={suspendVendor}
                    disabled={submittingDecision}
                  >
                    <XCircle size={17} />
                    Suspend
                  </button>
                </>
              )}

              {selectedApplication.status === "Suspended" && (
                <button
                  type="button"
                  className="vendor-action-button approve-action"
                  onClick={reapproveVendor}
                  disabled={submittingDecision}
                >
                  <RotateCcw size={17} />
                  Re-approve
                </button>
              )}

              {selectedApplication.status === "Changes Requested" && (
                <p className="vendor-review-help">
                  Waiting for the vendor to make the requested changes and
                  resubmit the application.
                </p>
              )}

              {selectedApplication.status === "Rejected" && (
                <p className="vendor-review-help">
                  This application has been rejected. No further review actions
                  are currently available.
                </p>
              )}
            </div>

            {feedback && (
              <div
                className="vendor-feedback vendor-feedback-error"
                role="alert"
              >
                <AlertTriangle size={18} />
                <span>{feedback}</span>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default VendorApplicationsPage;
