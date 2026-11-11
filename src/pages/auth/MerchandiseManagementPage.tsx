
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Store,
  Layers,
  Boxes,
} from "lucide-react";

import {
  getMerchandise,
  type MerchandiseProduct,
} from "../../services/merchandiseApi";

import { ApiError } from "../../services/api";
import "./AdminManagement.css";
import "./MerchandiseManagementPage.css";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "LOW_STOCK";

const messageFor = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";

const display = (value: unknown, fallback = "—") =>
  value == null || value === "" ? fallback : String(value);

const formatPrice = (price: string) => {
  const amount = Number(price);
  return Number.isFinite(amount)
    ? amount.toLocaleString("en-UG")
    : price;
};

const isLowStock = (product: MerchandiseProduct) =>
  product.stock_quantity > 0 && product.stock_quantity <= 5;

export default function MerchandiseManagementPage() {
  const [products, setProducts] = useState<MerchandiseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [selectedProduct, setSelectedProduct] =
    useState<MerchandiseProduct | null>(null);

 useEffect(() => {
  let cancelled = false;

  const fetchProducts = async () => {
    try {
      const data = await getMerchandise();

      if (!cancelled) {
        setProducts(data);
        setError("");
      }
    } catch (error: unknown) {
      if (!cancelled) {
        setError(messageFor(error));
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  void fetchProducts();

  return () => {
    cancelled = true;
  };
}, []);
  const activeCount = products.filter(
    (product) => product.is_active,
  ).length;

  const inactiveCount = products.filter(
    (product) => !product.is_active,
  ).length;

  const lowStockCount = products.filter(
    isLowStock,
  ).length;

  const outOfStockCount = products.filter(
    (product) => product.stock_quantity <= 0,
  ).length;

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const searchText = [
        product.name,
        product.description,
        product.business,
        product.category,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(
        query.trim().toLowerCase(),
      );

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && product.is_active) ||
        (statusFilter === "INACTIVE" && !product.is_active) ||
        (statusFilter === "LOW_STOCK" && isLowStock(product));

      return matchesSearch && matchesStatus;
    });
  }, [products, query, statusFilter]);

  return (
    <section className="management-page merchandise-page">
      <div className="management-intro">
        <div>
          <span className="management-eyebrow">
            LISTINGS / MARKETPLACE OVERSIGHT
          </span>

          <h2>Merchandise Management</h2>

          <p>
            Monitor product listings, vendor merchandise and
            marketplace stock levels.
          </p>
        </div>

        <button
          className="management-secondary"
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          <RefreshCw size={16} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="management-alert" role="alert">
          {error}
          <button
            className="merchandise-retry"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      <div className="merchandise-stats">
        <div className="merchandise-stat-card">
          <div className="merchandise-stat-icon teal">
            <Package size={21} />
          </div>
          <div>
            <span>Total products</span>
            <strong>{products.length}</strong>
          </div>
        </div>

        <div className="merchandise-stat-card">
          <div className="merchandise-stat-icon green">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Active products</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="merchandise-stat-card">
          <div className="merchandise-stat-icon coral">
            <XCircle size={21} />
          </div>
          <div>
            <span>Inactive products</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>

        <div className="merchandise-stat-card">
          <div className="merchandise-stat-icon warning">
            <AlertTriangle size={21} />
          </div>
          <div>
            <span>Low / out of stock</span>
            <strong>{lowStockCount + outOfStockCount}</strong>
          </div>
        </div>
      </div>

      <div className="management-toolbar merchandise-toolbar">
        <div className="management-search">
          <Search size={17} />

          <input
            aria-label="Search merchandise"
            placeholder="Search products or business ID..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <select
          aria-label="Filter merchandise by status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as StatusFilter)
          }
          className="merchandise-filter"
        >
          <option value="ALL">All products</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="LOW_STOCK">Low stock</option>
        </select>

        <span className="management-count">
          {visibleProducts.length} products
        </span>
      </div>

      <div className="management-card">
        {loading ? (
          <div className="management-state">
            Loading marketplace merchandise…
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="management-state">
            <Package size={30} />
            <strong>
              {query || statusFilter !== "ALL"
                ? "No matching products"
                : "No merchandise available"}
            </strong>
            <span>
              {query || statusFilter !== "ALL"
                ? "Try changing your search or filter."
                : "Products will appear here when vendors add merchandise."}
            </span>
          </div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table merchandise-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Business ID</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Oversight</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="merchandise-product-cell">
                      {product.images?.[0]?.image ? (
                        <img
                          src={product.images[0].image}
                          alt={
                            product.images[0].alt_text ||
                            product.name
                          }
                        />
                      ) : (
                        <div className="merchandise-image-placeholder">
                          <Package size={20} />
                        </div>
                      )}

                      <span className="management-name">
                        {product.name}
                      </span>
                    </td>

                    <td>
                      <span
                        className="merchandise-business-id"
                        title={product.business}
                      >
                        {product.business.slice(0, 8)}…
                      </span>
                    </td>

                    <td>{display(product.category)}</td>

                    <td>{formatPrice(product.price)}</td>

                    <td>
                      <span
                        className={
                          product.stock_quantity <= 0
                            ? "merchandise-stock danger"
                            : isLowStock(product)
                              ? "merchandise-stock warning"
                              : "merchandise-stock"
                        }
                      >
                        {product.stock_quantity}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`management-status ${
                          product.is_active
                            ? "is-active"
                            : "is-inactive"
                        }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      {product.stock_quantity <= 0 ? (
                        <span className="merchandise-attention danger">
                          Out of stock
                        </span>
                      ) : isLowStock(product) ? (
                        <span className="merchandise-attention warning">
                          Low stock
                        </span>
                      ) : !product.is_active ? (
                        <span className="merchandise-attention neutral">
                          Inactive
                        </span>
                      ) : (
                        <span className="merchandise-attention healthy">
                          Normal
                        </span>
                      )}
                    </td>

                    <td>
                      <button
                        className="management-icon-button"
                        aria-label={`View ${product.name}`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedProduct && (
        <div
          className="management-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProduct(null);
            }
          }}
        >
          <div
            className="management-modal merchandise-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="merchandise-details-title"
          >
            <div className="management-modal-head">
              <div>
                <span className="management-eyebrow">
                  MARKETPLACE PRODUCT
                </span>

                <h3 id="merchandise-details-title">
                  Product details
                </h3>
              </div>

              <button
                className="management-icon-button"
                onClick={() => setSelectedProduct(null)}
                aria-label="Close product details"
              >
                <X size={19} />
              </button>
            </div>

            {selectedProduct.images?.length > 0 && (
              <div className="merchandise-detail-images">
                {selectedProduct.images.map((image) => (
                  <img
                    key={image.id}
                    src={image.image}
                    alt={image.alt_text || selectedProduct.name}
                  />
                ))}
              </div>
            )}

            <div className="merchandise-detail-content">
              <h3>{selectedProduct.name}</h3>

              <p>{selectedProduct.description || "No description provided."}</p>

              <div className="merchandise-detail-grid">
                <div>
                  <span>Price</span>
                  <strong>{formatPrice(selectedProduct.price)}</strong>
                </div>

                <div>
                  <span>Stock quantity</span>
                  <strong>{selectedProduct.stock_quantity}</strong>
                </div>

                <div>
                  <span>Category ID</span>
                  <strong>{selectedProduct.category}</strong>
                </div>

                <div>
                  <span>Product ID</span>
                  <strong>{selectedProduct.id}</strong>
                </div>
              </div>

              <div className="merchandise-detail-business">
                <Store size={17} />
                <div>
                  <span>Vendor business UUID</span>
                  <strong>{selectedProduct.business}</strong>
                </div>
              </div>

              <div className="merchandise-detail-business">
                <Layers size={17} />
                <div>
                  <span>Listing status</span>
                  <strong>
                    {selectedProduct.is_active ? "Active" : "Inactive"}
                  </strong>
                </div>
              </div>

              <div className="merchandise-detail-business">
                <Boxes size={17} />
                <div>
                  <span>Created</span>
                  <strong>
                    {new Date(selectedProduct.created_at).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="merchandise-detail-business">
                <RefreshCw size={17} />
                <div>
                  <span>Last updated</span>
                  <strong>
                    {new Date(selectedProduct.updated_at).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            <div className="management-modal-actions">
              <button
                className="management-primary"
                onClick={() => setSelectedProduct(null)}
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
