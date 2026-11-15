
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Check,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Store,
  Trash2,
  X,
} from "lucide-react";

import {
  adminApi,
  type Category,
  type MerchandiseProduct,
  type VendorApplicationApi,
} from "../services/adminApi";
import { ApiError } from "../services/api";

import "./auth/AdminManagement.css";
import "./AccountPages.css";

type ProductDraft = {
  business: string;
  category: string;
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
};

const emptyDraft: ProductDraft = {
  business: "",
  category: "",
  name: "",
  description: "",
  price: "",
  stock_quantity: "0",
};

export function MerchandiseManagementPage() {
  const [products, setProducts] = useState<MerchandiseProduct[]>([]);
  const [pendingProducts, setPendingProducts] = useState<MerchandiseProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<VendorApplicationApi[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [editing, setEditing] = useState<MerchandiseProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);

  const [rejectingProduct, setRejectingProduct] =
    useState<MerchandiseProduct | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Load products, categories, approved businesses and pending listings.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        productsResult,
        categoriesResult,
        businessesResult,
        firstPendingPage,
      ] = await Promise.all([
        adminApi.getMerchandise(),
        adminApi.getCategories(),
        adminApi.getVendorApplications("approved"),
        adminApi.getPendingMerchandisePage(1),
      ]);

      // Collect all pending pages, not just the first page.
      let pendingPage = firstPendingPage;
      let pageNumber = 1;
      const allPendingProducts = [...pendingPage.results];

      while (pendingPage.next && pageNumber < 100) {
        pageNumber += 1;
        pendingPage = await adminApi.getPendingMerchandisePage(pageNumber);
        allPendingProducts.push(...pendingPage.results);
      }

      setProducts(productsResult);
      setPendingProducts(allPendingProducts);

      setCategories(
        categoriesResult.filter(
          (category) =>
            category.is_active !== false &&
            ["merchandise", "general"].includes(
              category.kind || "general",
            ),
        ),
      );

      setBusinesses(businessesResult.results);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not load merchandise.",
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

  // Combine the normal product list and pending queue without duplicates.
  const allProducts = useMemo(() => {
    const productMap = new Map<number, MerchandiseProduct>();

    products.forEach((product) => {
      productMap.set(product.id, product);
    });

    pendingProducts.forEach((product) => {
      productMap.set(product.id, product);
    });

    return Array.from(productMap.values());
  }, [products, pendingProducts]);

  const pendingIds = useMemo(
    () => new Set(pendingProducts.map((product) => product.id)),
    [pendingProducts],
  );

  const visibleProducts = useMemo(
    () =>
      allProducts.filter((product) =>
        `${product.name} ${
          businessNames.get(String(product.business)) || ""
        }`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [allProducts, businessNames, query],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);

    setDraft({
      ...emptyDraft,
      business: businesses[0]?.id || "",
      category: String(categories[0]?.id || ""),
    });

    setError("");
  }

  function openEdit(product: MerchandiseProduct) {
    setEditing(product);
    setFormOpen(true);

    setDraft({
      business: String(product.business),
      category: String(product.category),
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock_quantity: String(product.stock_quantity),
    });

    setError("");
  }

  function closeForm() {
    setEditing(null);
    setFormOpen(false);
    setDraft(emptyDraft);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    const payload = {
      business: draft.business,
      category: Number(draft.category),
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: draft.price,
      stock_quantity: Number(draft.stock_quantity),
    };

    try {
      if (editing) {
        await adminApi.updateMerchandise(editing.id, payload);
      } else {
        await adminApi.createMerchandise(payload);
      }

      closeForm();
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not save this product.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(product: MerchandiseProduct) {
    if (!window.confirm(`Deactivate ${product.name}?`)) return;

    setError("");

    try {
      await adminApi.deactivateMerchandise(product.id);
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not deactivate this product.",
      );
    }
  }

  async function activate(product: MerchandiseProduct) {
    setError("");

    try {
      await adminApi.updateMerchandise(product.id, {
        is_active: true,
      });

      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not activate this product.",
      );
    }
  }

  async function approveProduct(product: MerchandiseProduct) {
    if (!window.confirm(`Approve ${product.name}?`)) return;

    setReviewingId(product.id);
    setError("");

    try {
      await adminApi.approveMerchandise(product.id);
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not approve this product.",
      );
    } finally {
      setReviewingId(null);
    }
  }

  async function rejectProduct() {
    if (!rejectingProduct || !rejectionReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    setReviewingId(rejectingProduct.id);
    setError("");

    try {
      await adminApi.rejectMerchandise(
        rejectingProduct.id,
        rejectionReason.trim(),
      );

      setRejectingProduct(null);
      setRejectionReason("");

      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not reject this product.",
      );
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <main className="admin-management-page">
      <section className="admin-management-heading">
        <div>
          <p className="admin-management-breadcrumb">
            Admin / Marketplace Management
          </p>

          <h1>Merchandise</h1>

          <p className="admin-management-description">
            View and manage products across approved vendor businesses.
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

          <button
            type="button"
            className="admin-add-button"
            onClick={openCreate}
            disabled={!businesses.length || !categories.length}
          >
            <Plus size={17} />
            Add product
          </button>
        </div>
      </section>

      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      <section className="admin-management-table-card">
        <div className="admin-table-heading">
          <div>
            <h2>Marketplace products</h2>
            <p>{allProducts.length} products</p>
            <p>{pendingProducts.length} awaiting approval</p>
          </div>
        </div>

        <div className="admin-table-toolbar">
          <label className="admin-management-search">
            <Search size={18} />

            <input
              type="search"
              aria-label="Search merchandise"
              placeholder="Search products or businesses"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="admin-management-table-wrapper">
          <table className="admin-management-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Business</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    Loading products…
                  </td>
                </tr>
              ) : visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    <div className="admin-empty-state">
                      <span className="admin-empty-icon">
                        <Store size={24} />
                      </span>

                      <h3>
                        {query
                          ? "No matching products"
                          : "No products found"}
                      </h3>

                      <p>
                        Products are managed by the marketplace products API.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleProducts.map((product) => {
                  const isPending = pendingIds.has(product.id);

                  const status = product.approved
                    ? "Approved"
                    : product.rejection_reason
                      ? "Rejected"
                      : "Pending review";

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-person-cell">
                          <div>
                            <strong>{product.name}</strong>
                            <span>
                              {product.description || "No description"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {businessNames.get(String(product.business)) ||
                          `Business #${product.business}`}
                      </td>

                      <td>
                        {categories.find(
                          (category) =>
                            Number(category.id) === product.category,
                        )?.name || `Category #${product.category}`}
                      </td>

                      <td>{product.price}</td>

                      <td>{product.stock_quantity}</td>

                      <td>
                        <span
                          className={`admin-status-label ${
                            product.approved
                              ? "is-active"
                              : "is-inactive"
                          }`}
                        >
                          {status}
                        </span>

                        {product.rejection_reason && (
                          <small title={product.rejection_reason}>
                            Reason: {product.rejection_reason}
                          </small>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-row-action"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => openEdit(product)}
                        >
                          <Pencil size={16} />
                        </button>

                        {product.is_active ? (
                          <button
                            type="button"
                            className="admin-row-action"
                            aria-label={`Deactivate ${product.name}`}
                            onClick={() => void deactivate(product)}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-row-action"
                            aria-label={`Activate ${product.name}`}
                            onClick={() => void activate(product)}
                          >
                            <Check size={16} />
                          </button>
                        )}

                        {isPending && (
                          <>
                            <button
                              type="button"
                              className="admin-row-action"
                              title="Approve product"
                              aria-label={`Approve ${product.name}`}
                              disabled={reviewingId === product.id}
                              onClick={() =>
                                void approveProduct(product)
                              }
                            >
                              <Check size={16} />
                            </button>

                            <button
                              type="button"
                              className="admin-row-action"
                              title="Reject product"
                              aria-label={`Reject ${product.name}`}
                              disabled={reviewingId === product.id}
                              onClick={() => {
                                setRejectingProduct(product);
                                setRejectionReason("");
                                setError("");
                              }}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {rejectingProduct && (
        <div className="admin-modal-backdrop">
          <section
            className="admin-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-product-title"
          >
            <div className="admin-edit-modal-heading">
              <div>
                <h2 id="reject-product-title">Reject product</h2>
                <p>{rejectingProduct.name}</p>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setRejectingProduct(null);
                  setRejectionReason("");
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void rejectProduct();
              }}
            >
              <label>
                Rejection reason

                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(event) =>
                    setRejectionReason(event.target.value)
                  }
                  placeholder="Explain why this product cannot be approved"
                />
              </label>

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn-save"
                  disabled={
                    reviewingId === rejectingProduct.id ||
                    !rejectionReason.trim()
                  }
                >
                  {reviewingId === rejectingProduct.id
                    ? "Rejecting…"
                    : "Confirm rejection"}
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-cancel"
                  onClick={() => {
                    setRejectingProduct(null);
                    setRejectionReason("");
                  }}
                  disabled={reviewingId === rejectingProduct.id}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {formOpen && (
        <div className="admin-modal-backdrop">
          <section
            className="admin-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
          >
            <div className="admin-edit-modal-heading">
              <div>
                <h2 id="product-form-title">
                  {editing ? "Edit product" : "Add product"}
                </h2>

                <p>
                  Product data is saved to the Pawdigree marketplace.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={closeForm}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={save}>
              <label>
                Business

                <select
                  required
                  value={draft.business}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      business: event.target.value,
                    }))
                  }
                >
                  <option value="">Select an approved business</option>

                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Category

                <select
                  required
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      category: event.target.value,
                    }))
                  }
                >
                  <option value="">Select a category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Product name

                <input
                  required
                  maxLength={150}
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Description

                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="admin-product-number-fields">
                <label>
                  Price

                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draft.price}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        price: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Stock quantity

                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={draft.stock_quantity}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        stock_quantity: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn-save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Create product"}
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-cancel"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
