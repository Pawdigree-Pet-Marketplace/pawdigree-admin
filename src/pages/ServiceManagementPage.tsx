
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Check,
  RefreshCw,
  Search,
  Store,
  X,
} from "lucide-react";

import {
  adminApi,
  type AdminService,
  type VendorApplicationApi,
} from "../services/adminApi";
import { ApiError } from "../services/api";

import "./auth/AdminManagement.css";
import "./AccountPages.css";
import "./ServiceManagementPage.css";

export function ServiceManagementPage() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [businesses, setBusinesses] = useState<VendorApplicationApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [rejectingService, setRejectingService] =
    useState<AdminService | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [businessesResult, firstPendingPage] = await Promise.all([
        adminApi.getVendorApplications("approved"),
        adminApi.getPendingServicesPage(1),
      ]);

      let pendingPage = firstPendingPage;
      let pageNumber = 1;
      const allPendingServices = [...pendingPage.results];

      while (pendingPage.next && pageNumber < 100) {
        pageNumber += 1;
        pendingPage = await adminApi.getPendingServicesPage(pageNumber);
        allPendingServices.push(...pendingPage.results);
      }

      setServices(allPendingServices);
      setBusinesses(businessesResult.results);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not load pending services.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const businessNames = useMemo(
    () =>
      new Map(
        businesses.map((business) => [
          String(business.id),
          business.name,
        ]),
      ),
    [businesses],
  );

  const filteredServices = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return services;

    return services.filter((service) => {
      const businessName =
        businessNames.get(String(service.business)) || "";

      return (
        service.name.toLowerCase().includes(search) ||
        service.service_type.toLowerCase().includes(search) ||
        service.description.toLowerCase().includes(search) ||
        businessName.toLowerCase().includes(search)
      );
    });
  }, [services, query, businessNames]);

  const handleApprove = async (service: AdminService) => {
    const confirmed = window.confirm(
      `Are you sure you want to approve "${service.name}"?`,
    );

    if (!confirmed) return;

    setReviewingId(service.service_id);
    setError("");

    try {
      await adminApi.approveService(service.service_id);

      setServices((current) =>
        current.filter(
          (item) => item.service_id !== service.service_id,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not approve this service.",
      );
    } finally {
      setReviewingId(null);
    }
  };

  const openRejectModal = (service: AdminService) => {
    setRejectingService(service);
    setRejectionReason("");
    setError("");
  };

  const closeRejectModal = () => {
    setRejectingService(null);
    setRejectionReason("");
  };

  const handleReject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!rejectingService || !rejectionReason.trim()) return;

    const serviceId = rejectingService.service_id;

    setReviewingId(serviceId);
    setError("");

    try {
      await adminApi.rejectService(
        serviceId,
        rejectionReason.trim(),
      );

      setServices((current) =>
        current.filter((item) => item.service_id !== serviceId),
      );

      closeRejectModal();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not reject this service.",
      );
    } finally {
      setReviewingId(null);
    }
  };

  const formatPrice = (price: string) => {
    const amount = Number(price);

    if (!Number.isFinite(amount)) return price;

    return `UGX ${amount.toLocaleString("en-UG")}`;
  };

  return (
    <div className="admin-management-page">
      <div className="admin-management-heading">
        <div>
          <p className="admin-management-breadcrumb">
            Admin / Marketplace / Services
          </p>

          <h1>Service Management</h1>

          <p className="admin-management-description">
            Review and manage services submitted by approved vendors.
          </p>
        </div>

        <div className="admin-notification-actions">
          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      <div className="admin-management-table-card">
        <div className="admin-table-heading">
          <div>
            <h2>Pending Service Approvals</h2>
            <p>
              {services.length} service
              {services.length === 1 ? "" : "s"} awaiting review
            </p>
          </div>
        </div>

        <div className="admin-table-toolbar">
          <div className="admin-management-search">
            <Search size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services or vendors..."
              aria-label="Search services or vendors"
            />
          </div>
        </div>

        <div className="admin-management-table-wrapper">
          <table className="admin-management-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Vendor</th>
                <th>Type</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    Loading pending services...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    {query
                      ? "No services match your search."
                      : "There are no pending services to review."}
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.service_id}>
                    <td>
                      <div className="admin-service-info">
                        {service.image ? (
                          <img
                            src={service.image}
                            alt={service.name}
                            className="admin-service-image"
                          />
                        ) : (
                          <div className="admin-service-image-placeholder">
                            <Store size={20} />
                          </div>
                        )}

                        <div>
                          <strong>{service.name}</strong>
                          <p>
                            {service.description || "No description provided"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>
                      {businessNames.get(String(service.business)) ||
                        "Business name unavailable"}
                    </td>

                    <td>{service.service_type || "—"}</td>

                    <td>{formatPrice(service.price)}</td>

                    <td>
                      {service.duration
                        ? `${service.duration} minutes`
                        : "—"}
                    </td>

                    <td>
                      <span className="admin-status-label">
                        {service.availability_status || "Not specified"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-service-actions">
                        <button
                          type="button"
                          className="admin-row-action"
                          title="Approve service"
                          aria-label={`Approve ${service.name}`}
                          disabled={reviewingId !== null}
                          onClick={() => void handleApprove(service)}
                        >
                          <Check size={17} />
                        </button>

                        <button
                          type="button"
                          className="admin-row-action"
                          title="Reject service"
                          aria-label={`Reject ${service.name}`}
                          disabled={reviewingId !== null}
                          onClick={() => openRejectModal(service)}
                        >
                          <X size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectingService && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-service-heading"
          >
            <div className="admin-edit-modal-heading">
              <div>
                <h2 id="reject-service-heading">
                  Reject Service
                </h2>
                <p>
                  Provide a reason for rejecting{" "}
                  <strong>{rejectingService.name}</strong>.
                </p>
              </div>

              <button
                type="button"
                className="admin-row-action"
                onClick={closeRejectModal}
                aria-label="Close rejection dialog"
                disabled={reviewingId !== null}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReject}>
              <label htmlFor="service-rejection-reason">
                Rejection reason
              </label>

              <textarea
                id="service-rejection-reason"
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(event.target.value)
                }
                placeholder="Explain why this service is being rejected..."
                rows={5}
                required
                minLength={3}
              />

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-cancel"
                  onClick={closeRejectModal}
                  disabled={reviewingId !== null}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-btn admin-btn-save"
                  disabled={
                    reviewingId !== null ||
                    rejectionReason.trim().length < 3
                  }
                >
                  {reviewingId === rejectingService.service_id
                    ? "Rejecting..."
                    : "Reject Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceManagementPage;
