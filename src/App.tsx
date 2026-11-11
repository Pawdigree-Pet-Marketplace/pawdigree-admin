
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
import MerchandiseManagementPage from "./pages/auth/MerchandiseManagementPage";
import AdminForm from "./components/AdminForm";
import AdminAccessGate from "./components/auth/AdminAccessGate";

import AdminManagement from "./pages/auth/AdminManagement";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";

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
  "/adminManagement": {
    title: "Admin Management",
    breadcrumb: "Admin / Admin Management",
  },
  "/admin-form": {
    title: "Add Administrator",
    breadcrumb: "Admin / Admin Management / Add Administrator",
  },
  "/admin/vendors": {
    title: "Vendor Applications",
    breadcrumb: "Admin / Vendors",
  },
         "/admin/listings/merch": {
  title: "Merchandise Management",
  breadcrumb: "Admin / Listings / Merchandise",
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

  // Display the login page without the admin dashboard layout.
  if (location.pathname === "/login") {
    return <AdminLoginPage />;
  }

  // Check whether an admin access token exists.
  const accessToken =
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken");

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Log out the admin and clear stored authentication data.
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
      <>
        <AdminSidebar
          isOpen={open}
          onClose={() => setOpen(false)}
          currentPath={location.pathname}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() =>
            setSidebarCollapsed((previous) => !previous)
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
            {/* Admin Dashboard */}
            <Route
              path="/"
              element={<AdminDashboard />}
            />
         <Route
               path="/admin/listings/merch"
               element={<MerchandiseManagementPage />}
              />
            <Route
              path="/dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/dashboard"
              element={<AdminDashboard />}
            />

            {/* Admin Management */}
            <Route
              path="/adminManagement"
              element={<AdminManagement />}
            />

            {/* Add Administrator Form */}
            <Route
              path="/admin-form"
              element={<AdminForm />}
            />

            {/* Vendor Applications */}
            <Route
              path="/admin/vendors"
              element={<VendorApplicationsPage />}
            />
   
            {/* Categories Management */}
            <Route
              path="/admin/listings/categories"
              element={<CategoriesManagement />}
            />

            {/* Listing Approval */}
            <Route
              path="/admin/listings/approval"
              element={<ListingApprovalQueue />}
            />

            {/* Redirect unknown routes */}
            <Route
              path="*"
              element={
                <Navigate to="/admin/dashboard" replace />
              }
            />
          </Routes>
        </div>

        <AdminBottomNav currentPath={location.pathname} />
      </>
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
