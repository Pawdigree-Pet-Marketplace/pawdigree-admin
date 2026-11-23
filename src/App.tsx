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
import { SuperAdminRoute } from "./components/auth/SuperAdminRoute";
import { isSuperAdmin } from "./services/adminRoles";
import { PetListingsManagementPage } from "./pages/auth/PetListingsManagementPage";
import VendorApplicationsPage from "./pages/VendorApplicationsPage";
import { CategoriesManagement } from "./pages/CategoriesManagement";

import AdminManagement from "./pages/auth/AdminManagement";
import { UnavailableAdminFeature } from "./pages/UnavailableAdminFeature";
import { AdoptionApplicationsPage } from "./pages/AdoptionApplicationsPage";
import { AdminNotificationsPage } from "./pages/AdminNotificationsPage";
import { AdminProfilePage } from "./pages/AdminProfilePage";
import { VendorDirectoryPage } from "./pages/VendorDirectoryPage";
import { MerchandiseManagementPage } from "./pages/MerchandiseManagementPage";
import {
  ChangeAdminPasswordPage,
  ForgotAdminPasswordPage,
  ResetAdminPasswordPage,
  SetAdminPasswordPage,
} from "./pages/auth/AdminPasswordPages";

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
  "/admin/management": { title: "Admin Management" },
  "/admin/management/new": { title: "Create Administrator" },
  "/admin/vendors/list": { title: "Vendors" },
  "/admin/vendors": {
    title: "Vendor Applications",
    breadcrumb: "Admin / Vendors",
  },
  "/admin/listings/categories": {
    title: "Categories Management",
    breadcrumb: "Admin / Listings / Categories",
  },
 "/admin/listings/approval": {
  title: "Pet Management",
  breadcrumb: "Admin / Marketplace / Pet Management",
},
"/admin/listings/pets": {
  title: "Pet Management",
  breadcrumb: "Admin / Marketplace / Pet Management",
},
  "/admin/listings/merch": { title: "Merchandise" },
  "/admin/listings/services": { title: "Services" },
  "/admin/adoptions": { title: "Adoption Applications" },
  "/admin/notifications": { title: "Notifications" },
  "/admin/profile": { title: "My Profile" },
  "/admin/settings/security": { title: "Security" },
};

function Layout() {
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === "/login") {
    return <AdminLoginPage />;
  }

  if (location.pathname === "/set-password") return <SetAdminPasswordPage />;
  if (location.pathname === "/forgot-password") return <ForgotAdminPasswordPage />;
  if (location.pathname === "/reset-password" || location.pathname === "/reset-password/") return <ResetAdminPasswordPage />;

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

  const operationalFeatures: Record<string, string> = {
    "/admin/customers": "Customers",
    "/admin/bookings": "Bookings",
    "/admin/orders": "Orders",
    "/admin/payments": "Payments & Transactions",
    "/admin/reviews": "Reviews & Reports",
    "/admin/support": "Customer Support",
    "/admin/reports": "Reports & Analytics",
    "/admin/roles": "Roles & Permissions",
    "/admin/audit": "Audit Logs",
    "/admin/system-settings": "System Settings",
    "/admin/configuration": "Platform Configuration",
  };
  const isSuperAdminPath = [
    "/admin/management", "/admin/management/new", "/admin-form",
    "/admin/roles", "/admin/audit", "/admin/system-settings", "/admin/configuration",
  ].includes(location.pathname);
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
          roleLabel={isSuperAdmin() ? "Super Admin" : "Admin"}
        />

        <div className="admin-topbar-spacer" />

        <div className="admin-page-content">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            <Route
              path="/admin/management"
              element={<SuperAdminRoute><AdminManagement /></SuperAdminRoute>}
            />
            <Route
              path="/admin/management/new"
              element={<SuperAdminRoute><AdminForm /></SuperAdminRoute>}
            />
            <Route
              path="/admin-form"
              element={<SuperAdminRoute><AdminForm /></SuperAdminRoute>}
            />

            <Route
              path="/admin/vendors"
              element={<VendorApplicationsPage />}
            />
            <Route path="/admin/vendors/list" element={<VendorDirectoryPage />} />

            <Route
  path="/admin/listings/pets"
  element={<PetListingsManagementPage />}
/>
            <Route path="/admin/listings/merch" element={<MerchandiseManagementPage />} />

            <Route
              path="/admin/listings/categories"
              element={<CategoriesManagement />}
            />

           <Route
  path="/admin/listings/approval"
  element={<Navigate to="/admin/listings/pets" replace />}
/>
            <Route path="/admin/adoptions" element={<AdoptionApplicationsPage />} />
            <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />
            <Route path="/admin/settings/security" element={<ChangeAdminPasswordPage />} />

            {Object.entries(operationalFeatures).map(([path, title]) => (
              <Route
                key={path}
                path={path}
                element={isSuperAdminPath ? (
                  <SuperAdminRoute><UnavailableAdminFeature title={title} /></SuperAdminRoute>
                ) : <UnavailableAdminFeature title={title} />}
              />
            ))}

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
