import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Eye, Flag, RefreshCw, X } from "lucide-react";
import {
  adminApi,
  type Paged,
  type RawReport,
  type ReportStatus,
} from "../../services/adminApi";
import { ApiError } from "../../services/api";
import "./ReviewsManagement.css";

const PAGE_SIZE = 20;

const messageFor = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";

const STATUSES: ReportStatus[] = ["PENDING", "DISMISSED", "RESOLVED"];

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "Pending",
  DISMISSED: "Dismissed",
  RESOLVED: "Resolved",
};

/* Reviews sit right after "All reports" so they are easy to find. */
const TYPE_TABS = [
  { value: "all", label: "All reports" },
  { value: "REVIEW", label: "Reviews" },
  { value: "PET", label: "Pet listings" },
  { value: "PRODUCT", label: "Products" },
  { value: "SERVICE", label: "Services" },
  { value: "GENERAL", label: "General" },
];

const ITEM_TYPE_LABELS: Record<string, string> = {
  PET: "Pet listing",
  PRODUCT: "Product",
  SERVICE: "Service",
  REVIEW: "Review",
  GENERAL: "General",
};

const REASON_LABELS: Record<string, string> = {
  INAPPROPRIATE_CONTENT: "Inappropriate content",
  MISLEADING_INFORMATION: "Misleading information",
  SUSPECTED_FRAUD: "Suspected fraud",
  OFFENSIVE_CONTENT: "Offensive content",
  SUSPICIOUS_ACTIVITY: "Suspicious activity",
  OTHER: "Other",
};

type Report = {
  id: string;
  status: string;
  reason: string;
  itemType: string;
  itemId: string;
  itemTitle: string;
  details: string;
  reporter: string;
  createdAt: string;
  reviewedAt: string;
};

/* Pulls a readable string out of a value that may be text, a number or a nested object. */
const text = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (typeof value === "object") {
    const nested = value as Record<string, unknown>;
    return text(
      nested.name ??
        nested.title ??
        nested.username ??
        nested.email ??
        nested.full_name ??
        "",
    );
  }
  return "";
};

const first = (raw: RawReport, keys: string[]): string => {
  for (const key of keys) {
    const value = text(raw[key]);
    if (value) return value;
  }
  return "";
};

/*
  The ONLY place that knows the backend field names. If Swagger
  (/api/docs/) shows different names, change the key lists below.
*/
const normalizeReport = (raw: RawReport): Report => ({
  id: first(raw, ["report_id", "id"]),
  status: first(raw, ["status"]).toUpperCase(),
  reason: first(raw, ["reason", "report_reason"]).toUpperCase(),
  itemType: first(raw, [
    "item_type",
    "reported_type",
    "content_type",
  ]).toUpperCase(),
  itemId: first(raw, ["item_id", "reference_id", "object_id"]),
  itemTitle: first(raw, ["item_title", "item_name", "reported_item", "title"]),
  details: first(raw, ["description", "details", "message", "comment"]),
  reporter: first(raw, [
    "reporter_username",
    "reporter_email",
    "reporter",
    "user",
  ]),
  createdAt: first(raw, ["created_at"]),
  reviewedAt: first(raw, ["reviewed_at", "resolved_at"]),
});

/* The detail response can fill gaps the list row left empty. */
const mergeReports = (row: Report, detail: Report): Report => {
  const merged: Report = { ...row };
  (Object.keys(detail) as Array<keyof Report>).forEach((key) => {
    if (detail[key]) merged[key] = detail[key];
  });
  return merged;
};

const formatDate = (value: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-UG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const statusLabel = (status: string) =>
  STATUS_LABELS[status as ReportStatus] ?? (status || "—");
const typeLabel = (type: string) => ITEM_TYPE_LABELS[type] ?? (type || "Item");
const reasonLabel = (reason: string) =>
  REASON_LABELS[reason] ?? (reason || "—");
const itemName = (report: Report) =>
  report.itemTitle || (report.itemId ? `#${report.itemId}` : "—");

type Result = { key: string; data?: Paged<RawReport>; error?: string };
type DetailResult = { id: string; data?: RawReport };

const STATUS_OPTIONS: { value: ReportStatus | "all"; label: string }[] = [
  ...STATUSES.map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
  })),
  { value: "all", label: "All statuses" },
];

type StatusMenuProps = {
  value: ReportStatus | "all";
  onChange: (value: ReportStatus | "all") => void;
};

/* A branded dropdown (a native <select> list can't be styled). */
function StatusMenu({ value, onChange }: StatusMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedIndex = Math.max(
    0,
    STATUS_OPTIONS.findIndex((option) => option.value === value),
  );
  const current = STATUS_OPTIONS[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  const openMenu = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const choose = (index: number) => {
    onChange(STATUS_OPTIONS[index].value);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (index) =>
          (index + step + STATUS_OPTIONS.length) % STATUS_OPTIONS.length,
      );
    } else if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      choose(activeIndex);
    } else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className="rv-menu" ref={rootRef}>
      <button
        type="button"
        className="rv-menu-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="rv-status-listbox"
        aria-label={`Status: ${current.label}`}
        aria-activedescendant={
          open ? `rv-status-option-${activeIndex}` : undefined
        }
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span className="rv-menu-label">
          <span
            className={`rv-dot is-${String(current.value).toLowerCase()}`}
            aria-hidden="true"
          />
          {current.label}
        </span>
        <ChevronDown size={16} className="rv-menu-chevron" aria-hidden="true" />
      </button>

      {open && (
        <ul
          className="rv-menu-list"
          role="listbox"
          id="rv-status-listbox"
          aria-label="Report status"
        >
          {STATUS_OPTIONS.map((option, index) => (
            <li
              key={option.value}
              id={`rv-status-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`rv-menu-option${index === activeIndex ? " is-active" : ""}${option.value === value ? " is-selected" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(index)}
            >
              <span className="rv-menu-label">
                <span
                  className={`rv-dot is-${String(option.value).toLowerCase()}`}
                  aria-hidden="true"
                />
                {option.label}
              </span>
              {option.value === value && <Check size={15} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReviewsManagement() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">(
    "PENDING",
  );
  const [typeFilter, setTypeFilter] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [detailResult, setDetailResult] = useState<DetailResult | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  /* "loading" is derived: the stored answer is not for the current query yet. */
  const queryKey = `${page}|${statusFilter}|${typeFilter}|${reloadKey}`;

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getReports({
        page,
        page_size: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        item_type: typeFilter === "all" ? undefined : typeFilter,
      })
      .then((data) => {
        if (!cancelled) setResult({ key: queryKey, data });
      })
      .catch((cause: unknown) => {
        if (!cancelled) setResult({ key: queryKey, error: messageFor(cause) });
      });
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, typeFilter, queryKey]);

  /* Load the full report when the details window opens. */
  const selectedId = selected?.id ?? null;
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    adminApi
      .getReport(selectedId)
      .then((data) => {
        if (!cancelled) setDetailResult({ id: selectedId, data });
      })
      .catch(() => {
        if (!cancelled) setDetailResult({ id: selectedId });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const loading = result?.key !== queryKey;
  const loadError = !loading ? (result?.error ?? "") : "";
  const reports =
    !loading && result?.data ? result.data.results.map(normalizeReport) : [];
  const count = !loading && result?.data ? result.data.count : 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const hasFilters = statusFilter !== "PENDING" || typeFilter !== "all";

  const detailLoading = selectedId !== null && detailResult?.id !== selectedId;
  const shown =
    selected && detailResult?.id === selected.id && detailResult.data
      ? mergeReports(selected, normalizeReport(detailResult.data))
      : selected;

  const resetFilters = () => {
    setStatusFilter("PENDING");
    setTypeFilter("all");
    setPage(1);
  };

  const refresh = () => {
    setNotice("");
    setActionError("");
    setReloadKey((key) => key + 1);
  };

  const runAction = async (
    id: string,
    task: () => Promise<unknown>,
    message: string,
  ) => {
    setWorkingId(id);
    setActionError("");
    setNotice("");
    try {
      await task();
      setNotice(message);
      setSelected(null);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setActionError(messageFor(cause));
    } finally {
      setWorkingId(null);
    }
  };

  const dismissReport = (report: Report) => {
    if (
      !window.confirm(
        `Dismiss report #${report.id}? The reported content stays up.`,
      )
    )
      return;
    void runAction(
      report.id,
      () => adminApi.updateReportStatus(report.id, "DISMISSED"),
      `Report #${report.id} dismissed.`,
    );
  };

  const removeReported = (report: Report) => {
    const label = typeLabel(report.itemType).toLowerCase();
    if (
      !window.confirm(
        `Remove the reported ${label}? This takes it off the platform.`,
      )
    )
      return;
    void runAction(
      report.id,
      () => adminApi.removeReportedItem(report.id),
      `The reported ${label} was removed.`,
    );
  };

  const renderActions = (report: Report) => {
    if (report.status !== "PENDING") return null;
    return (
      <>
        <button
          type="button"
          className="rv-btn-secondary rv-action"
          disabled={workingId === report.id}
          onClick={() => dismissReport(report)}
        >
          Dismiss
        </button>
        {report.itemType !== "GENERAL" && (
          <button
            type="button"
            className="rv-btn-reject"
            disabled={workingId === report.id}
            onClick={() => removeReported(report)}
          >
            Remove
          </button>
        )}
      </>
    );
  };

  return (
    <section className="rv-page">
      <div className="rv-intro">
        <div>
          <span className="rv-eyebrow">TRUST AND SUPPORT</span>
          <h2>Reviews &amp; Reports</h2>
          <p>
            Review what people flag, then dismiss the report or remove the
            review or listing.
          </p>
        </div>
      </div>

      {notice && (
        <div className="rv-success" role="status">
          {notice}
        </div>
      )}
      {(loadError || actionError) && (
        <div className="rv-alert" role="alert">
          {loadError || actionError}
        </div>
      )}

      <div className="rv-tabs" role="group" aria-label="Filter reports by type">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`rv-tab${typeFilter === tab.value ? " is-active" : ""}`}
            aria-pressed={typeFilter === tab.value}
            onClick={() => {
              setTypeFilter(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rv-toolbar">
        <div className="rv-filter">
          <span>Status</span>
          <StatusMenu
            value={statusFilter}
            onChange={(next) => {
              setStatusFilter(next);
              setPage(1);
            }}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            className="rv-btn-secondary"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        )}
        <button
          type="button"
          className="rv-icon-btn"
          onClick={refresh}
          aria-label="Refresh reports"
        >
          <RefreshCw size={17} />
        </button>
        <span className="rv-count">
          {loading
            ? "Loading…"
            : `${count.toLocaleString("en-UG")} report${count === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="rv-card">
        {loading ? (
          <div className="rv-state" role="status">
            Loading reports…
          </div>
        ) : loadError ? (
          <div className="rv-state">
            <strong>We couldn’t load reports</strong>
            <span>Check your connection and try again.</span>
            <button
              type="button"
              className="rv-btn-secondary"
              onClick={refresh}
            >
              Try again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="rv-state">
            <Flag size={26} />
            <strong>
              {hasFilters ? "No matching reports" : "No pending reports"}
            </strong>
            <span>
              {hasFilters
                ? "Try another status or tab."
                : "New reports will show up here for review."}
            </span>
          </div>
        ) : (
          <div className="rv-table-wrap">
            <table className="rv-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Reported item</th>
                  <th>Reason</th>
                  <th>Reported by</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>
                    <span className="rv-sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="rv-name">#{report.id}</td>
                    <td>
                      <span className="rv-type">
                        {typeLabel(report.itemType)}
                      </span>
                      <div className="rv-sub">{itemName(report)}</div>
                    </td>
                    <td>{reasonLabel(report.reason)}</td>
                    <td>{report.reporter || "—"}</td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>
                      <span
                        className={`rv-status is-${report.status.toLowerCase()}`}
                      >
                        {statusLabel(report.status)}
                      </span>
                    </td>
                    <td>
                      <div className="rv-actions">
                        {renderActions(report)}
                        <button
                          type="button"
                          className="rv-icon-btn"
                          onClick={() => setSelected(report)}
                          aria-label={`View report #${report.id}`}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !loadError && totalPages > 1 && (
        <nav className="rv-pagination" aria-label="Reports pages">
          <button
            type="button"
            className="rv-btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="rv-btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </nav>
      )}

      {shown && (
        <div
          className="rv-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div
            className="rv-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Report #${shown.id}`}
          >
            <div className="rv-modal-head">
              <div>
                <span className="rv-eyebrow">REPORT DETAILS</span>
                <h3>Report #{shown.id}</h3>
              </div>
              <button
                type="button"
                className="rv-icon-btn"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {detailLoading && (
              <p className="rv-loading" role="status">
                Loading full details…
              </p>
            )}

            <dl className="rv-details-grid">
              <div>
                <dt>Status</dt>
                <dd>
                  <span
                    className={`rv-status is-${shown.status.toLowerCase()}`}
                  >
                    {statusLabel(shown.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{typeLabel(shown.itemType)}</dd>
              </div>
              <div>
                <dt>Reported item</dt>
                <dd>{itemName(shown)}</dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{reasonLabel(shown.reason)}</dd>
              </div>
              <div>
                <dt>Reported by</dt>
                <dd>{shown.reporter || "—"}</dd>
              </div>
              <div>
                <dt>Reported on</dt>
                <dd>{formatDate(shown.createdAt)}</dd>
              </div>
              <div>
                <dt>Reviewed on</dt>
                <dd>{formatDate(shown.reviewedAt)}</dd>
              </div>
              <div>
                <dt>Item ID</dt>
                <dd>{shown.itemId || "—"}</dd>
              </div>
            </dl>

            {shown.details && (
              <div className="rv-notes">
                <strong>What the reporter said</strong>
                <p>{shown.details}</p>
              </div>
            )}

            {actionError && (
              <div className="rv-alert" role="alert">
                {actionError}
              </div>
            )}

            <div className="rv-modal-actions">
              <button
                type="button"
                className="rv-btn-secondary"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
              {renderActions(shown)}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
