import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, unwrapList } from "../../services/api";
import {
  Activity,
  AlertTriangle,
  Boxes,
  PawPrint,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wrench,
} from "lucide-react";
import "./MarketplacePerformancePage.css";

type Tab = "overview" | "pets" | "merchandise" | "services";

type Pet = {
  pet_id?: number;
  name?: string;
  species?: string;
  listing_type?: string;
  approved?: boolean;
  review_status?: string;
  is_active?: boolean;
  adoption_status?: string;
  created_at?: string;
};

type Product = {
  id?: number;
  name?: string;
  category?: number | string;
  price?: string | number;
  stock_quantity?: number;
  approved?: boolean;
  is_active?: boolean;
  created_at?: string;
};

type Category = {
  id?: number;
  name?: string;
  kind?: string;
  is_active?: boolean;
};

type Service = {
  service_id?: number;
  name?: string;
  category?: number;
  price?: string | number;
  availability_status?: string;
  approved?: boolean;
  is_active?: boolean;
  created_at?: string;
};

type StatCardProps = {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  variant?: "teal" | "coral" | "purple" | "neutral";
};

const LOW_STOCK_THRESHOLD = 5;

function StatCard({
  label,
  value,
  description,
  icon,
  variant = "neutral",
}: StatCardProps) {
  return (
    <article className={`mp-stat-card mp-${variant}`}>
      <div className="mp-stat-top">
        <span className="mp-stat-label">{label}</span>
        <span className="mp-stat-icon">{icon}</span>
      </div>
      <strong className="mp-stat-value">{value}</strong>
      <span className="mp-stat-description">{description}</span>
    </article>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mp-section-title">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  color = "neutral",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="mp-status-row">
      <span>{label}</span>
      <span className={`mp-status-value mp-status-${color}`}>{value}</span>
    </div>
  );
}

export default function MarketplacePerformancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [petResponse, productResponse, categoryResponse, serviceResponse] =
        await Promise.allSettled([
          apiRequest<unknown>("/pets/admin/"),
          apiRequest<unknown>("/products/"),
          apiRequest<unknown>("/categories/"),
          apiRequest<unknown>("/services/admin/pending/"),
        ]);

      if (petResponse.status === "fulfilled") {
        setPets(unwrapList<Pet>(petResponse.value));
      } else {
        setPets([]);
      }

      if (productResponse.status === "fulfilled") {
        setProducts(unwrapList<Product>(productResponse.value));
      } else {
        setProducts([]);
      }

      if (categoryResponse.status === "fulfilled") {
        setCategories(unwrapList<Category>(categoryResponse.value));
      } else {
        setCategories([]);
      }

      if (serviceResponse.status === "fulfilled") {
        setServices(unwrapList<Service>(serviceResponse.value));
      } else {
        setServices([]);
      }

      const failed = [
        petResponse,
        productResponse,
        categoryResponse,
        serviceResponse,
      ].filter((result) => result.status === "rejected");

      if (failed.length === 4) {
        setError("We could not load marketplace data. Please try again.");
      }
    } catch {
      setError("We could not load marketplace data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    void loadData();
  };

 useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadData();
  }, 0);

  return () => window.clearTimeout(timer);
}, [loadData]);

  const petStats = useMemo(() => {
    const approved = pets.filter(
      (pet) => pet.approved || pet.review_status === "APPROVED",
    ).length;

    const pending = pets.filter(
      (pet) => pet.review_status === "PENDING" || (!pet.approved && !pet.review_status),
    ).length;

    const inactive = pets.filter((pet) => pet.is_active === false).length;

    const adoption = pets.filter((pet) => pet.listing_type === "ADOPTION").length;
    const sale = pets.filter((pet) => pet.listing_type === "SALE").length;

    return { total: pets.length, approved, pending, inactive, adoption, sale };
  }, [pets]);

  const productStats = useMemo(() => {
    const approved = products.filter((product) => product.approved).length;
    const pending = products.filter((product) => !product.approved).length;
    const inactive = products.filter((product) => product.is_active === false).length;

    const lowStock = products.filter(
      (product) =>
        typeof product.stock_quantity === "number" &&
        product.stock_quantity >= 0 &&
        product.stock_quantity <= LOW_STOCK_THRESHOLD,
    );

    const outOfStock = products.filter(
      (product) =>
        typeof product.stock_quantity === "number" &&
        product.stock_quantity === 0,
    );

    return {
      total: products.length,
      approved,
      pending,
      inactive,
      lowStock,
      outOfStock,
    };
  }, [products]);

  const serviceStats = useMemo(() => {
    const approved = services.filter((service) => service.approved).length;
    const inactive = services.filter((service) => service.is_active === false).length;

    return {
      total: services.length,
      approved,
      pending: services.filter((service) => !service.approved).length,
      inactive,
    };
  }, [services]);

  const activeCategories = categories.filter((category) => category.is_active).length;
  const inactiveCategories = categories.filter((category) => !category.is_active).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "pets", label: "Pets" },
    { key: "merchandise", label: "Merchandise" },
    { key: "services", label: "Services" },
  ];

  const renderOverview = () => (
    <>
      <div className="mp-stats-grid">
        <StatCard
          label="Pet Listings"
          value={petStats.total}
          description={`${petStats.adoption} adoption · ${petStats.sale} for sale`}
          icon={<PawPrint size={20} />}
          variant="teal"
        />
        <StatCard
          label="Merchandise"
          value={productStats.total}
          description={`${productStats.approved} approved products`}
          icon={<ShoppingBag size={20} />}
          variant="coral"
        />
        <StatCard
          label="Services Requiring Review"
          value={serviceStats.pending}
          description="Pending services returned by admin endpoint"
          icon={<Wrench size={20} />}
          variant="purple"
        />
        <StatCard
          label="Categories"
          value={categories.length}
          description={`${activeCategories} active · ${inactiveCategories} inactive`}
          icon={<Boxes size={20} />}
        />
      </div>

      <div className="mp-panels-grid">
        <section className="mp-panel">
          <SectionTitle
            title="Marketplace health"
            description="Listing approval and availability indicators"
          />
          <StatusRow label="Approved pet listings" value={petStats.approved} color="green" />
          <StatusRow label="Pet listings pending review" value={petStats.pending} color="coral" />
          <StatusRow label="Inactive pet listings" value={petStats.inactive} />
          <StatusRow label="Approved products" value={productStats.approved} color="green" />
          <StatusRow label="Products pending review" value={productStats.pending} color="coral" />
          <StatusRow label="Inactive products" value={productStats.inactive} />
        </section>

        <section className="mp-panel">
          <SectionTitle
            title="Stock alerts"
            description={`Low stock means ${LOW_STOCK_THRESHOLD} units or fewer`}
          />
          <div className="mp-alert-highlight">
            <AlertTriangle size={22} />
            <div>
              <strong>{productStats.lowStock.length} products</strong>
              <span>Low-stock items</span>
            </div>
          </div>
          <StatusRow label="Out of stock" value={productStats.outOfStock.length} color="coral" />
          <StatusRow label="Inactive categories" value={inactiveCategories} />
        </section>
      </div>
    </>
  );

  const renderPets = () => (
    <>
      <div className="mp-stats-grid">
        <StatCard label="Total Pets" value={petStats.total} description="Listings returned by admin endpoint" icon={<PawPrint size={20} />} variant="teal" />
        <StatCard label="Adoption" value={petStats.adoption} description="Pets listed for adoption" icon={<PawPrint size={20} />} />
        <StatCard label="For Sale" value={petStats.sale} description="Pets listed for sale" icon={<TrendingUp size={20} />} variant="coral" />
        <StatCard label="Pending Review" value={petStats.pending} description="Listings awaiting review" icon={<Activity size={20} />} variant="purple" />
      </div>
      <section className="mp-panel">
        <SectionTitle title="Pet listing status" description="Review and listing availability" />
        <StatusRow label="Approved listings" value={petStats.approved} color="green" />
        <StatusRow label="Inactive listings" value={petStats.inactive} />
      </section>
    </>
  );

  const renderMerchandise = () => (
    <>
      <div className="mp-stats-grid">
        <StatCard label="Total Products" value={productStats.total} description="Products returned by API" icon={<ShoppingBag size={20} />} variant="coral" />
        <StatCard label="Approved" value={productStats.approved} description="Approved products" icon={<Activity size={20} />} variant="teal" />
        <StatCard label="Low Stock" value={productStats.lowStock.length} description={`Stock of ${LOW_STOCK_THRESHOLD} or less`} icon={<AlertTriangle size={20} />} variant="purple" />
        <StatCard label="Out of Stock" value={productStats.outOfStock.length} description="Products with zero stock" icon={<Boxes size={20} />} variant="coral" />
      </div>

      <section className="mp-panel">
        <SectionTitle title="Stock requiring attention" description="Products with limited or unavailable inventory" />
        {productStats.lowStock.length === 0 ? (
          <div className="mp-empty">No low-stock products detected in the loaded data.</div>
        ) : (
          <div className="mp-table-wrap">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {productStats.lowStock.map((product, index) => (
                  <tr key={product.id ?? `${product.name}-${index}`}>
                    <td>{product.name || "Unnamed product"}</td>
                    <td>{product.stock_quantity}</td>
                    <td>
                      <span className={`mp-stock-badge ${product.stock_quantity === 0 ? "mp-stock-empty" : "mp-stock-low"}`}>
                        {product.stock_quantity === 0 ? "Out of stock" : "Low stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );

  const renderServices = () => (
    <>
      <div className="mp-stats-grid">
        <StatCard label="Services Pending" value={serviceStats.pending} description="Pending services returned by admin endpoint" icon={<Wrench size={20} />} variant="purple" />
        <StatCard label="Approved Services" value={serviceStats.approved} description="Approved records in current response" icon={<Activity size={20} />} variant="teal" />
        <StatCard label="Inactive Services" value={serviceStats.inactive} description="Inactive records in current response" icon={<AlertTriangle size={20} />} variant="coral" />
      </div>
      <section className="mp-panel">
        <SectionTitle title="Service oversight" description="Service approval and availability" />
        <StatusRow label="Pending services" value={serviceStats.pending} color="coral" />
        <StatusRow label="Approved services" value={serviceStats.approved} color="green" />
        <StatusRow label="Inactive services" value={serviceStats.inactive} />
        <div className="mp-note">
          The current admin service endpoint returns pending services only. Total platform services and approved services will be displayed when an all-services admin endpoint is available.
        </div>
      </section>
    </>
  );

  return (
    <main className="mp-page">
      <div className="mp-page-header">
        <div>
          <h1>Marketplace Performance</h1>
          <p>Monitor listing activity, product inventory, and marketplace health.</p>
        </div>
        <button className="mp-refresh-button" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={16} className={loading ? "mp-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mp-tabs" role="tablist" aria-label="Marketplace performance views">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={activeTab === tab.key ? "mp-tab mp-tab-active" : "mp-tab"}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="mp-error" role="alert">{error}</div>}

      {loading ? (
        <div className="mp-loading">Loading marketplace data...</div>
      ) : (
        <div className="mp-content">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "pets" && renderPets()}
          {activeTab === "merchandise" && renderMerchandise()}
          {activeTab === "services" && renderServices()}
        </div>
      )}
    </main>
  );
}