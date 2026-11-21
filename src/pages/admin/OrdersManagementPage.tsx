
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownUp,
  CheckCircle2,
  Clock3,
  Package,
  PawPrint,
  RefreshCw,
  Search,
  ShoppingBag,
  Wrench,
  X,
} from "lucide-react";
import { ApiError } from "../../services/api";
import { ordersApi, type AdminOrder } from "../../services/ordersApi";
import "./OrdersManagement.css";

type OrderCategory = "ALL" | "PETS" | "MERCHANDISE" | "SERVICES";

interface OrderView {
  id: string;
  reference: string;
  category: OrderCategory;
  status: string;
  customer: string;
  vendor: string;
  amount: number | null;
  date: string;
  raw: AdminOrder;
}

const categoryOptions: {
  label: string;
  value: OrderCategory;
  icon: typeof Package;
}[] = [
  { label: "All Orders", value: "ALL", icon: Package },
  { label: "Pet Orders", value: "PETS", icon: PawPrint },
  { label: "Merchandise", value: "MERCHANDISE", icon: ShoppingBag },
  { label: "Services", value: "SERVICES", icon: Wrench },
];

const knownStatuses = [
  "PENDING",
  "PROCESSING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

function getText(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    return String(
      record.name ??
        record.username ??
        record.email ??
        record.business_name ??
        record.title ??
        record.full_name ??
        record.id ??
        ""
    );
  }

  return "";
}

function getFirst(
  order: AdminOrder,
  keys: string[]
): unknown {
  for (const key of keys) {
    const value = order[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
}

function normalizeStatus(value: unknown): string {
  return getText(value).trim().toUpperCase().replace(/[\s-]+/g, "_") || "UNKNOWN";
}


function normalizeCategory(order: AdminOrder): OrderCategory {
  const rawItems = (order as Record<string, unknown>).items;

  const itemTypes = Array.isArray(rawItems)
    ? rawItems
        .map((item) => {
          if (!item || typeof item !== "object") return "";

          return getText(
            (item as Record<string, unknown>).item_type
          )
            .toLowerCase()
            .replace(/[_-]+/g, " ");
        })
        .join(" ")
    : "";

  const values = [
    order.order_type,
    order.order_category,
    order.category,
    order.type,
    order.product_type,
    order.item_type,
    order.listing_type,
    itemTypes,
  ]
    .map(getText)
    .join(" ")
    .toLowerCase();

  if (
    values.includes("pet") ||
    values.includes("adoption") ||
    values.includes("animal")
  ) {
    return "PETS";
  }

  if (
    values.includes("service") ||
    values.includes("booking")
  ) {
    return "SERVICES";
  }

  if (
    values.includes("merchandise") ||
    values.includes("product") ||
    values.includes("shop")
  ) {
    return "MERCHANDISE";
  }

  if (
    order.pet ||
    order.pet_id ||
    order.pet_name
  ) {
    return "PETS";
  }

  if (
    order.product ||
    order.product_id ||
    order.product_name
  ) {
    return "MERCHANDISE";
  }

  if (
    order.service ||
    order.service_id ||
    order.service_name
  ) {
    return "SERVICES";
  }

  return "ALL";
}


function toOrderView(order: AdminOrder, index: number): OrderView {
  const id = getText(
    getFirst(order, ["id", "order_id", "uuid"])
  ) || String(index + 1);

  const reference = getText(
    getFirst(order, ["order_number", "reference", "order_code", "tracking_number"])
  ) || `ORD-${id}`;

  const status = normalizeStatus(
    getFirst(order, ["status", "order_status", "payment_status"])
  );
const customer = getText(
  getFirst(order, [
    "shipping_name",
    "customer",
    "customer_name",
    "customer_username",
    "customer_email",
    "user",
    "user_name",
    "buyer",
  ])
) || "Unknown customer";

  const vendor = getText(
    getFirst(order, [
      "vendor",
      "vendor_name",
      "business",
      "business_name",
      "seller",
      "seller_name",
    ])
  ) || "—";

  const rawAmount = getFirst(order, [
    "total_amount",
    "total",
    "amount",
    "grand_total",
    "price",
  ]);

  const parsedAmount =
    typeof rawAmount === "number"
      ? rawAmount
      : Number(rawAmount);

  const amount = Number.isFinite(parsedAmount) ? parsedAmount : null;

  const date = getText(
    getFirst(order, [
      "created_at",
      "order_date",
      "date",
      "created",
    ])
  );

  return {
    id,
    reference,
    category: normalizeCategory(order),
    status,
    customer,
    vendor,
    amount,
    date,
    raw: order,
  };
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";

  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string): string {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function readableStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status: string): string {
  switch (status) {
    case "COMPLETED":
    case "APPROVED":
    case "DELIVERED":
      return "orders-status-completed";

    case "PROCESSING":
    case "CONFIRMED":
    case "IN_PROGRESS":
      return "orders-status-processing";

    case "CANCELLED":
    case "REJECTED":
    case "FAILED":
      return "orders-status-cancelled";

    case "PENDING":
    case "WAITING":
      return "orders-status-pending";

    default:
      return "orders-status-other";
  }
}

function getCategoryLabel(category: OrderCategory): string {
  switch (category) {
    case "PETS":
      return "Pet Order";
    case "MERCHANDISE":
      return "Merchandise";
    case "SERVICES":
      return "Service";
    default:
      return "Unclassified";
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong while loading orders.";
}

export function OrdersManagementPage() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState<OrderCategory>("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<OrderView | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await ordersApi.getOrders();

      const normalized = response.map(toOrderView);

      setOrders(normalized);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadOrders();
  }, 0);

  return () => window.clearTimeout(timer);
}, [loadOrders]);
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesCategory =
        category === "ALL" || order.category === category;

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      const matchesSearch =
        !query ||
        [
          order.reference,
          order.id,
          order.customer,
          order.vendor,
          order.category,
          order.status,
        ].some((value) => String(value).toLowerCase().includes(query));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [orders, category, statusFilter, search]);

  const availableStatuses = useMemo(() => {
    const discovered = orders.map((order) => order.status);
    return Array.from(new Set([...knownStatuses, ...discovered])).sort();
  }, [orders]);

  const totalOrders = orders.length;

  const pendingCount = orders.filter((order) =>
    ["PENDING", "WAITING"].includes(order.status)
  ).length;

  const processingCount = orders.filter((order) =>
    ["PROCESSING", "CONFIRMED", "IN_PROGRESS"].includes(order.status)
  ).length;

  const completedCount = orders.filter((order) =>
    ["COMPLETED", "DELIVERED"].includes(order.status)
  ).length;

  const clearFilters = () => {
    setCategory("ALL");
    setStatusFilter("ALL");
    setSearch("");
  };

  const handleStatusUpdate = async (
    order: OrderView,
    newStatus: string
  ) => {
    if (newStatus === order.status) return;

    setUpdatingOrderId(order.id);
    setError("");

    try {
      await ordersApi.updateOrderStatus(order.id, newStatus);

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? { ...item, status: newStatus }
            : item
        )
      );

      setSelectedOrder((current) =>
        current?.id === order.id
          ? { ...current, status: newStatus }
          : current
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="orders-page">
      <div className="orders-page-header">
        <div>
          <span className="orders-eyebrow">OPERATIONS</span>
          <h1>Orders Management</h1>
          <p>
            Monitor, review and manage customer orders across Pawdigree.
          </p>
        </div>

        <button
          className="orders-refresh-button"
          onClick={() => void loadOrders(true)}
          disabled={refreshing || loading}
        >
          <RefreshCw size={17} className={refreshing ? "orders-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="orders-alert" role="alert">
          <div>
            <strong>Unable to complete request</strong>
            <p>{error}</p>
          </div>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="orders-stat-grid">
        <div className="orders-stat-card">
          <div className="orders-stat-icon orders-stat-total">
            <Package size={21} />
          </div>
          <div className="orders-stat-label">Total Orders</div>
          <div className="orders-stat-value">
            {loading ? "—" : totalOrders}
          </div>
          <div className="orders-stat-note">All orders received</div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon orders-stat-pending">
            <Clock3 size={21} />
          </div>
          <div className="orders-stat-label">Pending</div>
          <div className="orders-stat-value">
            {loading ? "—" : pendingCount}
          </div>
          <div className="orders-stat-note">Awaiting action</div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon orders-stat-processing">
            <Activity size={21} />
          </div>
          <div className="orders-stat-label">Processing</div>
          <div className="orders-stat-value">
            {loading ? "—" : processingCount}
          </div>
          <div className="orders-stat-note">Currently in progress</div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon orders-stat-completed">
            <CheckCircle2 size={21} />
          </div>
          <div className="orders-stat-label">Completed</div>
          <div className="orders-stat-value">
            {loading ? "—" : completedCount}
          </div>
          <div className="orders-stat-note">Successfully fulfilled</div>
        </div>
      </div>

      <div className="orders-content-card">
        <div className="orders-category-tabs">
          {categoryOptions.map((option) => {
            const Icon = option.icon;
            const active = category === option.value;

            return (
              <button
                key={option.value}
                className={`orders-category-tab ${active ? "active" : ""}`}
                onClick={() => setCategory(option.value)}
              >
                <Icon size={17} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className="orders-toolbar">
          <div className="orders-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search order, customer or vendor..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="orders-filter-control">
            <ArrowDownUp size={16} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by order status"
            >
              <option value="ALL">All statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {readableStatus(status)}
                </option>
              ))}
            </select>
          </div>

          <button
            className="orders-clear-button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>

        <div className="orders-table-summary">
          <span>
            <strong>{filteredOrders.length}</strong> order
            {filteredOrders.length === 1 ? "" : "s"} found
          </span>
          {(category !== "ALL" || statusFilter !== "ALL" || search) && (
            <span className="orders-filter-active">Filters applied</span>
          )}
        </div>

        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="orders-empty-cell">
                    <RefreshCw size={20} className="orders-spin" />
                    <span>Loading orders...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="orders-empty-cell">
                    <Package size={28} />
                    <strong>No orders found</strong>
                    <span>
                      Try changing your search or filters.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <button
                        className="orders-reference-button"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {order.reference}
                      </button>
                    </td>

                    <td>
                      <span className="orders-type-label">
                        {getCategoryLabel(order.category)}
                      </span>
                    </td>

                    <td>{order.customer}</td>
                    <td>{order.vendor}</td>
                    <td className="orders-amount">
                      {formatCurrency(order.amount)}
                    </td>
                    <td>{formatDate(order.date)}</td>

                    <td>
                      <span
                        className={`orders-status ${getStatusClass(order.status)}`}
                      >
                        {readableStatus(order.status)}
                      </span>
                    </td>

                    <td>
                      <button
                        className="orders-view-button"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div
          className="orders-modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="orders-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="orders-modal-header">
              <div>
                <span className="orders-eyebrow">ORDER DETAILS</span>
                <h2>{selectedOrder.reference}</h2>
              </div>

              <button
                className="orders-modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="orders-modal-body">
              <div className="orders-detail-grid">
                <div className="orders-detail-item">
                  <span>Order reference</span>
                  <strong>{selectedOrder.reference}</strong>
                </div>

                <div className="orders-detail-item">
                  <span>Order type</span>
                  <strong>{getCategoryLabel(selectedOrder.category)}</strong>
                </div>

                <div className="orders-detail-item">
                  <span>Customer</span>
                  <strong>{selectedOrder.customer}</strong>
                </div>

                <div className="orders-detail-item">
                  <span>Vendor</span>
                  <strong>{selectedOrder.vendor}</strong>
                </div>

                <div className="orders-detail-item">
                  <span>Order date</span>
                  <strong>{formatDate(selectedOrder.date)}</strong>
                </div>

                <div className="orders-detail-item">
                  <span>Amount</span>
                  <strong>{formatCurrency(selectedOrder.amount)}</strong>
                </div>
              </div>

              <div className="orders-detail-status">
                <span>Current status</span>
                <span
                  className={`orders-status ${getStatusClass(selectedOrder.status)}`}
                >
                  {readableStatus(selectedOrder.status)}
                </span>
              </div>

              <div className="orders-status-update">
                <label htmlFor="orders-status-select">
                  Update order status
                </label>

                <select
                  id="orders-status-select"
                  value={selectedOrder.status}
                  disabled={updatingOrderId === selectedOrder.id}
                  onChange={(event) =>
                    void handleStatusUpdate(selectedOrder, event.target.value)
                  }
                >
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {readableStatus(status)}
                    </option>
                  ))}
                </select>

                {updatingOrderId === selectedOrder.id && (
                  <span className="orders-update-hint">
                    Updating order...
                  </span>
                )}
              </div>

              <details className="orders-raw-details">
                <summary>Additional order information</summary>
                <pre>
                  {JSON.stringify(selectedOrder.raw, null, 2)}
                </pre>
              </details>
            </div>

            <div className="orders-modal-footer">
              <button
                className="orders-modal-done"
                onClick={() => setSelectedOrder(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersManagementPage;
