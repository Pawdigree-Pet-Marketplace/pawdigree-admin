import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, Eye, RefreshCw, Search, X } from "lucide-react";
import {
  adminApi,
  type BookingStatus,
  type Paged,
  type RawBooking,
} from "../../services/adminApi";
import { ApiError } from "../../services/api";
import "./AdminManagement.css";
import "./BookingsManagement.css";

const PAGE_SIZE = 20;

const messageFor = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";

const STATUSES: BookingStatus[] = [
  "pending",
  "accepted",
  "declined",
  "completed",
  "cancelled",
];

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

/*
  Moves an admin can make from each status. This is an assumption: the
  backend is the source of truth and returns a 400 for a move it rejects
  (the message is shown to the admin). Edit this map if the rules differ.
*/
type Action = {
  status: BookingStatus;
  label: string;
  tone: "approve" | "reject";
};
const NEXT_ACTIONS: Record<BookingStatus, Action[]> = {
  pending: [
    { status: "accepted", label: "Accept", tone: "approve" },
    { status: "declined", label: "Decline", tone: "reject" },
  ],
  accepted: [
    { status: "completed", label: "Complete", tone: "approve" },
    { status: "cancelled", label: "Cancel", tone: "reject" },
  ],
  declined: [],
  completed: [],
  cancelled: [],
};

type Booking = {
  id: string;
  status: BookingStatus;
  customer: string;
  contact: string;
  business: string;
  service: string;
  date: string;
  time: string;
  price: string;
  notes: string;
  createdAt: string;
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
        nested.full_name ??
        nested.business_name ??
        nested.username ??
        nested.email ??
        "",
    );
  }
  return "";
};

const first = (raw: RawBooking, keys: string[]): string => {
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
const normalizeBooking = (raw: RawBooking): Booking => ({
  id: first(raw, ["booking_id", "id"]),
  status: first(raw, ["status"]).toLowerCase() as BookingStatus,
  customer: first(raw, [
    "customer_name",
    "customer",
    "user_name",
    "customer_email",
  ]),
  contact: first(raw, ["customer_phone", "customer_email", "phone"]),
  business: first(raw, ["business_name", "business", "vendor_name"]),
  service: first(raw, ["service_name", "service"]),
  date: first(raw, [
    "booking_date",
    "date",
    "scheduled_date",
    "scheduled_at",
    "start_time",
  ]),
  time: first(raw, ["booking_time", "time"]),
  price: first(raw, ["total_price", "price", "amount"]),
  notes: first(raw, ["notes", "customer_notes", "message"]),
  createdAt: first(raw, ["created_at"]),
});

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

const formatPrice = (value: string) => {
  if (!value) return "—";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `UGX ${amount.toLocaleString("en-UG")}`
    : value;
};

const statusLabel = (status: string) =>
  STATUS_LABELS[status as BookingStatus] ?? status;

type Result = { key: string; data?: Paged<RawBooking>; error?: string };

export function BookingsManagement() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">(
    "all",
  );
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  /* "loading" is derived: the stored answer is not for the current query yet. */
  const queryKey = `${page}|${statusFilter}|${search}|${reloadKey}`;

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getBookings({
        page,
        page_size: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
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
  }, [page, statusFilter, search, queryKey]);

  const loading = result?.key !== queryKey;
  const loadError = !loading ? (result?.error ?? "") : "";
  const bookings =
    !loading && result?.data ? result.data.results.map(normalizeBooking) : [];
  const count = !loading && result?.data ? result.data.count : 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const hasFilters = statusFilter !== "all" || search !== "";

  const applySearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const refresh = () => {
    setNotice("");
    setActionError("");
    setReloadKey((key) => key + 1);
  };

  const changeStatus = async (booking: Booking, action: Action) => {
    if (!window.confirm(`${action.label} booking #${booking.id}?`)) return;
    setWorkingId(booking.id);
    setActionError("");
    setNotice("");
    try {
      await adminApi.updateBookingStatus(booking.id, action.status);
      setNotice(
        `Booking #${booking.id} is now ${STATUS_LABELS[action.status].toLowerCase()}.`,
      );
      setSelected(null);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setActionError(messageFor(cause));
    } finally {
      setWorkingId(null);
    }
  };

  const renderActions = (booking: Booking) =>
    (NEXT_ACTIONS[booking.status] ?? []).map((action) => (
      <button
        key={action.status}
        type="button"
        className={
          action.tone === "approve" ? "management-approve" : "management-reject"
        }
        disabled={workingId === booking.id}
        onClick={() => void changeStatus(booking, action)}
      >
        {action.label}
      </button>
    ));

  return (
    <section className="management-page">
      <div className="management-intro">
        <div>
          <span className="management-eyebrow">MARKETPLACE OPERATIONS</span>
          <h2>Bookings</h2>
          <p>
            View every service booking, check its status and step in when
            something needs fixing.
          </p>
        </div>
      </div>

      {notice && (
        <div className="management-success" role="status">
          {notice}
        </div>
      )}
      {(loadError || actionError) && (
        <div className="management-alert" role="alert">
          {loadError || actionError}
        </div>
      )}

      <div className="management-toolbar">
        <form
          className="management-search"
          onSubmit={applySearch}
          role="search"
        >
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Search bookings"
            placeholder="Search by customer, service or business"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </form>
        <label className="management-filter">
          Status
          <select
            aria-label="Filter bookings by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as BookingStatus | "all");
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        {hasFilters && (
          <button
            type="button"
            className="management-secondary"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
        <button
          type="button"
          className="management-icon-button"
          onClick={refresh}
          aria-label="Refresh bookings"
        >
          <RefreshCw size={17} />
        </button>
        <span className="management-count">
          {loading
            ? "Loading…"
            : `${count.toLocaleString("en-UG")} booking${count === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="management-card">
        {loading ? (
          <div className="management-state" role="status">
            Loading bookings…
          </div>
        ) : loadError ? (
          <div className="management-state">
            <strong>We couldn’t load bookings</strong>
            <span>Check your connection and try again.</span>
            <button
              type="button"
              className="management-secondary"
              onClick={refresh}
            >
              Try again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="management-state">
            <CalendarDays size={26} />
            <strong>
              {hasFilters ? "No matching bookings" : "No bookings yet"}
            </strong>
            <span>
              {hasFilters
                ? "Try another search or status."
                : "Bookings will appear here once customers book services."}
            </span>
          </div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date &amp; time</th>
                  <th>Status</th>
                  <th>
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="management-name">#{booking.id}</td>
                    <td>
                      <div className="management-name">
                        {booking.customer || "—"}
                      </div>
                      {booking.contact && (
                        <div className="booking-sub">{booking.contact}</div>
                      )}
                    </td>
                    <td>
                      <div className="management-name">
                        {booking.service || "—"}
                      </div>
                      {booking.business && (
                        <div className="booking-sub">{booking.business}</div>
                      )}
                    </td>
                    <td>
                      <div>{formatDate(booking.date)}</div>
                      {booking.time && (
                        <div className="booking-sub">{booking.time}</div>
                      )}
                    </td>
                    <td>
                      <span className={`booking-status is-${booking.status}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </td>
                    <td>
                      <div className="management-actions">
                        {renderActions(booking)}
                        <button
                          type="button"
                          className="management-icon-button"
                          onClick={() => setSelected(booking)}
                          aria-label={`View booking #${booking.id}`}
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
        <nav className="booking-pagination" aria-label="Bookings pages">
          <button
            type="button"
            className="management-secondary"
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
            className="management-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </nav>
      )}

      {selected && (
        <div
          className="management-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div
            className="management-modal booking-details"
            role="dialog"
            aria-modal="true"
            aria-label={`Booking #${selected.id}`}
          >
            <div className="management-modal-head">
              <div>
                <span className="management-eyebrow">BOOKING DETAILS</span>
                <h3>Booking #{selected.id}</h3>
              </div>
              <button
                type="button"
                className="management-icon-button"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <dl className="booking-details-grid">
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`booking-status is-${selected.status}`}>
                    {statusLabel(selected.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{selected.service || "—"}</dd>
              </div>
              <div>
                <dt>Business</dt>
                <dd>{selected.business || "—"}</dd>
              </div>
              <div>
                <dt>Customer</dt>
                <dd>{selected.customer || "—"}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{selected.contact || "—"}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{formatDate(selected.date)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{selected.time || "—"}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{formatPrice(selected.price)}</dd>
              </div>
              <div>
                <dt>Booked on</dt>
                <dd>{formatDate(selected.createdAt)}</dd>
              </div>
            </dl>

            {selected.notes && (
              <div className="booking-notes">
                <strong>Customer notes</strong>
                <p>{selected.notes}</p>
              </div>
            )}

            {actionError && (
              <div className="management-alert" role="alert">
                {actionError}
              </div>
            )}

            <div className="management-modal-actions">
              <button
                type="button"
                className="management-secondary"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
              {renderActions(selected)}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
