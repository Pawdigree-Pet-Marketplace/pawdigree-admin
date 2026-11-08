import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AdminSidebar } from "./components/admin/AdminSidebar";
import AdminTopbar from "./components/admin/AdminTopbar";
import { AdminBottomNav } from "./components/admin/AdminBottomNav";

import { AdminDashboard } from "./pages/AdminDashboard";
<<<<<<< Updated upstream
import AdminForm from "./components/AdminForm.tsx";
=======
import { VendorApplicationsPage } from "./pages/VendorApplicationsPage";
import { CategoriesManagement } from "./pages/CategoriesManagement";
import { ListingApprovalQueue } from "./pages/ListingApprovalQueue";

import AdminForm from "./components/AdminForm";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import AdminAccessGate from "./components/auth/AdminAccessGate";

// We will create this page next.
import AdminManagement from "./pages/auth/AdminManagement";

const PAGE_INFO: Record<string, { title: string; breadcrumb: string }> = {
  "/admin/listings/categories": {
    title: "Vendor Categories",
    breadcrumb: "Admin / Listings / Categories",
  },
  "/admin/listings/approval": {
    title: "Listing Approval Queue",
    breadcrumb: "Admin / Listings / Approval Queue",
  },
  "/admin/vendors": {
    title: "Vendor Applications",
    breadcrumb: "Admin / Vendors",
  },
  "/admin/users": {
    title: "Admin Management",
    breadcrumb: "Admin / User Management / Admin Management",
  },
  "/adminForm": {
    title: "Add Admin",
    breadcrumb: "Admin / User Management / Add Admin",
  },
  "/admin-form": {
    title: "Add Admin",
    breadcrumb: "Admin / User Management / Add Admin",
  },
};

>>>>>>> Stashed changes
function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

<<<<<<< Updated upstream
  return (
    <>
      <AdminSidebar
        isOpen={open}
        onClose={() => setOpen(false)}
        currentPath={location.pathname}
      />
      <AdminTopbar
        onMenuClick={() => setOpen(true)}
        title="Admin Dashboard"
        breadcrumb="Admin / Dashboard"
      />
      <div className="admin-topbar-spacer" />
      <div className="admin-page-content">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/adminForm" element={<AdminForm />} />
          {/* Fallback - shows dashboard for any other /admin/* link until you create real pages */}
          <Route path="/admin/:page" element={<AdminDashboard />} />
          <Route path="*" element={<AdminDashboard />} />
        </Routes>
      </div>
      <AdminBottomNav currentPath={location.pathname} />
    </>
=======
  // Show login without the dashboard layout.
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

    navigate("/login", { replace: true });
  }

  const page = PAGE_INFO[location.pathname] || {
    title: "Admin Dashboard",
    breadcrumb: "Admin / Dashboard",
  };

  return (
    <AdminAccessGate>
      <>
        <AdminSidebar
          isOpen={open}
          onClose={() => setOpen(false)}
          currentPath={location.pathname}
        />

        <AdminTopbar
          onMenuClick={() => setOpen(true)}
          onLogout={handleLogout}
          title={page.title}
          breadcrumb={page.breadcrumb}
        />

        <div className="admin-topbar-spacer" />

        <div className="admin-page-content">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Administrator management */}
            <Route path="/admin/users" element={<AdminManagement />} />

            {/* Existing administrator form */}
            <Route path="/adminForm" element={<AdminForm />} />
            <Route path="/admin-form" element={<AdminForm />} />

            {/* Existing vendor pages */}
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

            {/* Redirect unknown routes */}
            <Route
              path="*"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Routes>
        </div>

        <AdminBottomNav currentPath={location.pathname} />
      </>
    </AdminAccessGate>
>>>>>>> Stashed changes
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