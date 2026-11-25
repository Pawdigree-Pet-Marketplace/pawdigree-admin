
import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  X,
} from "lucide-react";
import { ApiError } from "../../services/api";
import {
  auditLogsApi,
  type AuditLog,
} from "../../services/auditLogsApi";
import "./AuditLogs.css";

const PAGE_SIZE = 10;

interface Filters {
  user: string;
  action: string;
  date_from: string;
  date_to: string;
}

const initialFilters: Filters = {
  user: "",
  action: "",
  date_from: "",
  date_to: "",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong while loading audit logs.";
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTarget(log: AuditLog): string {
  if (log.target_label?.trim()) return log.target_label;

  const type = log.target_type || "Target";
  const id = log.target_id || "";

  return id ? `${type} #${id}` : type;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<Filters>(initialFilters);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

 
  const fetchLogs = useCallback(
    (currentPage: number, currentFilters: Filters) => {
      return auditLogsApi.getAuditLogs({
        user: currentFilters.user,
        action: currentFilters.action,
        date_from: currentFilters.date_from,
        date_to: currentFilters.date_to,
        page: currentPage,
        page_size: PAGE_SIZE,
      });
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    fetchLogs(page, appliedFilters)
      .then((response) => {
        if (cancelled) return;

        setError("");
        setLogs(response.results ?? []);
        setTotalCount(response.count ?? 0);
      })
      .catch((err) => {
        if (cancelled) return;

        setError(getErrorMessage(err));
        setLogs([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchLogs, page, appliedFilters]);

  const handleFilterChange = (
    field: keyof Filters,
    value: string,
  ) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    if (
      filters.date_from &&
      filters.date_to &&
      filters.date_from > filters.date_to
    ) {
      setError("The start date cannot be later than the end date.");
      return;
    }

    setError("");
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setLoading(true);
    setAppliedFilters(initialFilters);
    setPage(1);
    setError("");
  };

  const handleRefresh = () => {
    setRefreshing(true);

    fetchLogs(page, appliedFilters)
      .then((response) => {
        setError("");
        setLogs(response.results ?? []);
        setTotalCount(response.count ?? 0);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
        setLogs([]);
        setTotalCount(0);
      })
      .finally(() => {
        setRefreshing(false);
      });
  };


  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasFilters = Object.values(filters).some((value => value.trim() !== ""));

  return (
    <div className="audit-page">
      <header className="audit-page-header">
        <div className="audit-page-heading">
          <div className="audit-heading-icon">
            <ClipboardList size={24} />
          </div>

          <div>
            <h1>Audit Logs</h1>
            <p>
              Monitor administrative activity and track changes across Pawdigree.
            </p>
          </div>
        </div>

        <button
          className="audit-refresh-button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "audit-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <section className="audit-filters">
        <div className="audit-filter-heading">
          <Filter size={18} />
          <h2>Filter activity</h2>
        </div>

        <div className="audit-filter-grid">
          <div className="audit-filter-field">
            <label htmlFor="audit-user">User</label>
            <input
              id="audit-user"
              type="text"
              placeholder="Email or user ID"
              value={filters.user}
              onChange={(event) =>
                handleFilterChange("user", event.target.value)
              }
            />
          </div>

          <div className="audit-filter-field">
            <label htmlFor="audit-action">Action</label>
            <input
              id="audit-action"
              type="text"
              placeholder="e.g. USER_UPDATED"
              value={filters.action}
              onChange={(event) =>
                handleFilterChange("action", event.target.value)
              }
            />
          </div>

          <div className="audit-filter-field">
            <label htmlFor="audit-date-from">From date</label>
            <input
              id="audit-date-from"
              type="date"
              value={filters.date_from}
              onChange={(event) =>
                handleFilterChange("date_from", event.target.value)
              }
            />
          </div>

          <div className="audit-filter-field">
            <label htmlFor="audit-date-to">To date</label>
            <input
              id="audit-date-to"
              type="date"
              value={filters.date_to}
              onChange={(event) =>
                handleFilterChange("date_to", event.target.value)
              }
            />
          </div>
        </div>

        <div className="audit-filter-actions">
          <button
            className="audit-apply-button"
            onClick={handleApplyFilters}
          >
            <Search size={16} />
            Apply Filters
          </button>

          <button
            className="audit-clear-button"
            onClick={handleClearFilters}
            disabled={!hasFilters}
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </section>

      <section className="audit-table-card">
        <div className="audit-table-header">
          <div>
            <h2>Activity History</h2>
            <p>
              {loading
                ? "Loading activity..."
                : `${totalCount.toLocaleString()} record${totalCount === 1 ? "" : "s"} found`}
            </p>
          </div>
        </div>

        {error && (
          <div className="audit-error">
            <div>
              <strong>Unable to load audit logs</strong>
              <p>{error}</p>
            </div>

            <button
              onClick={() => void fetchLogs(page, appliedFilters)}
              disabled={loading}
            >
              Try Again
            </button>
          </div>
        )}

        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="audit-table-message">
                    Loading audit records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="audit-table-message">
                    Records could not be loaded.
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="audit-table-message">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="audit-date-cell">
                      {formatDate(log.created_at)}
                    </td>

                    <td className="audit-user-cell">
                      <strong>{log.actor_email || "Unknown user"}</strong>
                      <span>User ID: {log.actor ?? "—"}</span>
                    </td>

                    <td>
                      <span className="audit-role-badge">
                        {log.actor_role || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="audit-action-badge">
                        {formatAction(log.action || "Unknown")}
                      </span>
                    </td>

                    <td>{getTarget(log)}</td>

                    <td className="audit-details-cell">
                      {log.details || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="audit-pagination">
          <p>
            Page {page} of {totalPages}
          </p>

          <div className="audit-pagination-buttons">
            <button
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              disabled={loading || page <= 1}
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <button
              onClick={() =>
                setPage((previous) => Math.min(totalPages, previous + 1))
              }
              disabled={loading || page >= totalPages || logs.length === 0}
            >
              Next
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
  }
