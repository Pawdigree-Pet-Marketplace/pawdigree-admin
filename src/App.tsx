import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { AdminBottomNav } from "./components/admin/AdminBottomNav";
import AdminTopbar from "./components/admin/AdminTopbar";
import { AdminSidebar } from "./components/admin/AdminSidebar";

import { AdminDashboard } from "./pages/AdminDashboard";
import AdminForm from "./components/AdminForm";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import AdminAccessGate from "./components/auth/AdminAccessGate";

import VendorApplicationsPage from "./pages/VendorApplicationsPage";
import { CategoriesManagement } from "./pages/CategoriesManagement";
import { ListingApprovalQueue } from "./pages/ListingApprovalQueue";

const PAGE_INFO: Record<
  string,
  { title: string; breadcrumb?: string }
> = {
  "/": {
    title: "Admin Dashboard",
    breadcrumb: "Admin / Dashboard",
  },
  "/dashboard": {
    title: "Admin Dashboard",
    breadcrumb: "Admin / Dashboard",
  },
  "/admin": {
    title: "Admin Dashboard",
    breadcrumb: "Admin / Dashboard",
  },
  "/admin/dashboard": {
    title: "Admin Dashboard",
    breadcrumb: "Admin / Dashboard",
  },
  "/admin-form": {
    title: "Admin Management",
  },
  "/admin/vendors": {
    title: "Vendor Applications",
    breadcrumb: "Admin / Vendors",
  },
  "/admin/listings/categories": {
    title: "Categories Management",
    breadcrumb: "Admin / Listings / Categories",
  },
  "/admin/listings/approval": {
    title: "Listing Approval",
    breadcrumb: "Admin / Listings / Approval",
  },
};

function Layout() {
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === "/login") {
    return <AdminLoginPage />;
  }

  const accessToken =
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken");

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("pawdigree_active_role");

    navigate("/login", { replace: true });
  }

  const page = PAGE_INFO[location.pathname] || {
    title: "Admin Dashboard",
  };

  return (
    <AdminAccessGate>
      <div
        className={`admin-shell ${
          sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <AdminSidebar
          isOpen={open}
          onClose={() => setOpen(false)}
          currentPath={location.pathname}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() =>
            setSidebarCollapsed((collapsed) => !collapsed)
          }
        />

        <AdminTopbar
          onMenuClick={() => setOpen(true)}
          onLogout={handleLogout}
          title={page.title}
        />

        <div className="admin-topbar-spacer" />

        <div className="admin-page-content">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            <Route path="/admin-form" element={<AdminForm />} />

            <Route
              path="/admin/vendors"
              element={<VendorApplicationsPage />}
            />

            <Route
              path="/admin/listings/categories"
              element={<CategoriesManagement />}
            />

            <Route
              path="/admin/listings/approval"
              element={<ListingApprovalQueue />}
            />

            <Route
              path="*"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Routes>
        </div>

        <AdminBottomNav currentPath={location.pathname} />
      </div>
    </AdminAccessGate>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;