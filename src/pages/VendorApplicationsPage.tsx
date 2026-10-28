
import { useMemo, useState } from "react";
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
} from "lucide-react";
import "./VendorApplicationsPage.css";

type VendorStatus =
  | "Pending"
  | "Approved"
  | "Changes Requested"
  | "Suspended";

type VendorApplication = {
  id: number;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  categories: string[];
  documents: string[];
  submittedDate: string;
  status: VendorStatus;
  reviewMessage: string;
};

const initialApplications: VendorApplication[] = [
  {
    id: 1,
    businessName: "Kololo Pet Clinic",
    ownerName: "Sarah Nakato",
    email: "sarah@example.com",
    phone: "+256 700 123456",
    address: "Kololo, Kampala, Uganda",
    categories: ["Veterinary Services", "Pet Care"],
    documents: [
      "Business Registration Certificate.pdf",
      "Veterinary Licence.pdf",
      "Owner Identification.pdf",
    ],
    submittedDate: "2026-10-10",
    status: "Pending",
    reviewMessage: "",
  },
  {
    id: 2,
    businessName: "Furry Friends Shop",
    ownerName: "David Okello",
    email: "david@example.com",
    phone: "+256 701 234567",
    address: "Ntinda, Kampala, Uganda",
    categories: ["Pet Merchandise", "Pet Food"],
    documents: [
      "Business Registration Certificate.pdf",
      "Owner Identification.pdf",
    ],
    submittedDate: "2026-10-11",
    status: "Pending",
    reviewMessage: "",
  },
  {
    id: 3,
    businessName: "Nakawa Kennels",
    ownerName: "James Mugisha",
    email: "james@example.com",
    phone: "+256 702 345678",
    address: "Nakawa, Kampala, Uganda",
    categories: ["Pet Sales", "Pet Boarding"],
    documents: [
      "Business Registration Certificate.pdf",
      "Animal Care Documents.pdf",
    ],
    submittedDate: "2026-10-08",
    status: "Approved",
    reviewMessage: "",
  },
  {
    id: 4,
    businessName: "VetCare Bugolobi",
    ownerName: "Grace Atim",
    email: "grace@example.com",
    phone: "+256 703 456789",
    address: "Bugolobi, Kampala, Uganda",
    categories: ["Veterinary Services"],
    documents: [
      "Business Registration Certificate.pdf",
      "Veterinary Licence.pdf",
    ],
    submittedDate: "2026-10-06",
    status: "Suspended",
    reviewMessage: "Updated verification is required.",
  },
  {
    id: 5,
    businessName: "Happy Paws Uganda",
    ownerName: "Peter Kato",
    email: "peter@example.com",
    phone: "+256 704 567890",
    address: "Kira, Wakiso, Uganda",
    categories: ["Pet Care", "Pet Grooming"],
    documents: [
      "Business Registration Certificate.pdf",
      "Owner Identification.pdf",
    ],
    submittedDate: "2026-10-12",
    status: "Changes Requested",
    reviewMessage:
      "Please provide the missing business verification document.",
  },
];

const statusOptions: Array<"All" | VendorStatus> = [
  "All",
  "Pending",
  "Approved",
  "Changes Requested",
  "Suspended",
];

export function VendorApplicationsPage() {
  const [applications, setApplications] =
    useState<VendorApplication[]>(initialApplications);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | VendorStatus>("All");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const filteredApplications = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return applications.filter((application) => {
      const matchesSearch =
        application.businessName.toLowerCase().includes(search) ||
        application.ownerName.toLowerCase().includes(search) ||
        application.email.toLowerCase().includes(search) ||
        application.categories.some((category) =>
          category.toLowerCase().includes(search)
        );

      const matchesStatus =
        statusFilter === "All" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const selectedApplication =
    applications.find((application) => application.id === selectedId) ??
    null;

  const counts = {
    total: applications.length,
    pending: applications.filter(
      (item) => item.status === "Pending"
    ).length,
    approved: applications.filter(
      (item) => item.status === "Approved"
    ).length,
    changesRequested: applications.filter(
      (item) => item.status === "Changes Requested"
    ).length,
    suspended: applications.filter(
      (item) => item.status === "Suspended"
    ).length,
  };

  function openReview(application: VendorApplication) {
    setSelectedId(application.id);
    setReviewMessage(application.reviewMessage);
    setFeedback("");
  }

  function closeReview() {
    setSelectedId(null);
    setReviewMessage("");
    setFeedback("");
  }

  function updateStatus(
    id: number,
    status: VendorStatus,
    message = ""
  ) {
    const vendor = applications.find((item) => item.id === id);

    if (!vendor) return;

    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        application.id === id
          ? {
              ...application,
              status,
              reviewMessage: message,
            }
          : application
      )
    );

    setFeedback(
      `${vendor.businessName} status updated to "${status}".`
    );

    setSelectedId(null);
    setReviewMessage("");
  }

  function requestChanges() {
    if (!selectedApplication) return;

    if (!reviewMessage.trim()) {
      setFeedback(
        "Please explain what the vendor needs to change."
      );
      return;
    }

    updateStatus(
      selectedApplication.id,
      "Changes Requested",
      reviewMessage.trim()
    );
  }

  function suspendVendor() {
    if (!selectedApplication) return;

    const confirmed = window.confirm(
      `Are you sure you want to suspend ${selectedApplication.businessName}?`
    );

    if (!confirmed) return;

    updateStatus(
      selectedApplication.id,
      "Suspended",
      reviewMessage.trim() ||
        "Vendor suspended by an administrator."
    );
  }

  function approveVendor() {
    if (!selectedApplication) return;

    updateStatus(
      selectedApplication.id,
      "Approved",
      ""
    );
  }

  function reapproveVendor() {
    if (!selectedApplication) return;

    updateStatus(
      selectedApplication.id,
      "Approved",
      ""
    );
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
            Review vendor applications, verify documents, and manage
            vendor approval status.
          </p>
        </div>

        <div className="vendor-heading-icon">
          <ShieldCheck size={30} />
        </div>
      </div>

      {feedback && (
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

      <div className="vendor-stats-grid">
        <div className="vendor-stat-card">
          <div className="vendor-stat-icon">
            <Building2 size={22} />
          </div>
          <div>
            <p>Total Vendors</p>
            <h2>{counts.total}</h2>
          </div>
        </div>

        <div className="vendor-stat-card">
          <div className="vendor-stat-icon pending-icon">
            <Clock size={22} />
          </div>
          <div>
            <p>Pending Review</p>
            <h2>{counts.pending}</h2>
          </div>
        </div>

        <div className="vendor-stat-card">
          <div className="vendor-stat-icon approved-icon">
            <CheckCircle size={22} />
          </div>
          <div>
            <p>Approved</p>
            <h2>{counts.approved}</h2>
          </div>
        </div>

        <div className="vendor-stat-card">
          <div className="vendor-stat-icon suspended-icon">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p>Suspended</p>
            <h2>{counts.suspended}</h2>
          </div>
        </div>
      </div>

      <section className="vendor-applications-card">
        <div className="vendor-list-heading">
          <div>
            <h2>Vendor Management Queue</h2>
            <p>
              Review applications and manage vendor accounts.
            </p>
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
              placeholder="Search business, owner, email or category..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              aria-label="Search vendor applications"
            />
          </div>

          <select
            className="vendor-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "All" | VendorStatus
              )
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
                <th>Categories</th>
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
                        <strong>
                          {application.businessName}
                        </strong>
                        <span>{application.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>{application.ownerName}</td>

                  <td>
                    <div className="vendor-category-list">
                      {application.categories.map((category) => (
                        <span
                          className="vendor-category-tag"
                          key={category}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td>{application.submittedDate}</td>

                  <td>
                    <span
                      className={`vendor-status-badge ${getStatusClass(
                        application.status
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
                    No vendor applications match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

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
                <p className="vendor-eyebrow">
                  VENDOR APPLICATION
                </p>
                <h2 id="vendor-review-title">
                  Review Vendor
                </h2>
              </div>

              <button
                type="button"
                className="vendor-close-button"
                onClick={closeReview}
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
                    selectedApplication.status
                  )}`}
                >
                  {selectedApplication.status}
                </span>
              </div>
            </div>

            <div className="vendor-detail-section">
              <h3>Business and Owner Details</h3>

              <div className="vendor-detail-row">
                <Building2 size={17} />
                <div>
                  <span>Owner</span>
                  <strong>
                    {selectedApplication.ownerName}
                  </strong>
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
                  <strong>
                    {selectedApplication.submittedDate}
                  </strong>
                </div>
              </div>
            </div>

            <div className="vendor-detail-section">
              <h3>Requested Categories</h3>
              <div className="vendor-category-list">
                {selectedApplication.categories.map(
                  (category) => (
                    <span
                      className="vendor-category-tag"
                      key={category}
                    >
                      {category}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="vendor-detail-section">
              <h3>Submitted Documents</h3>

              <div className="vendor-documents-list">
                {selectedApplication.documents.map(
                  (document) => (
                    <div
                      className="vendor-document-item"
                      key={document}
                    >
                      <FileText size={19} />
                      <span>{document}</span>
                    </div>
                  )
                )}
              </div>

              <p className="vendor-document-note">
                These are sample document names. Document viewing
                and verification must be connected to the backend.
              </p>
            </div>

            {selectedApplication.reviewMessage && (
              <div className="vendor-review-message">
                <strong>Previous review note</strong>
                <p>{selectedApplication.reviewMessage}</p>
              </div>
            )}

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
                onChange={(event) =>
                  setReviewMessage(event.target.value)
                }
                placeholder="Explain any missing documents or required changes..."
                rows={3}
              />

              <p className="vendor-review-help">
                Required when requesting changes. You may also add
                a note before suspending a vendor.
              </p>
            </div>

            {/* All four actions are always visible. */}
            <div className="vendor-review-actions">
              <button
                type="button"
                className="vendor-action-button approve-action"
                onClick={approveVendor}
              >
                <CheckCircle size={17} />
                Approve
              </button>

              <button
                type="button"
                className="vendor-action-button changes-action"
                onClick={requestChanges}
              >
                <FileText size={17} />
                Request Changes
              </button>

              <button
                type="button"
                className="vendor-action-button suspend-action"
                onClick={suspendVendor}
              >
                <XCircle size={17} />
                Suspend
              </button>

              <button
                type="button"
                className="vendor-action-button approve-action"
                onClick={reapproveVendor}
              >
                <RotateCcw size={17} />
                Re-approve
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default VendorApplicationsPage;
