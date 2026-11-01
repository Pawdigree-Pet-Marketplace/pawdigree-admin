
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AdminSidebar } from "./components/admin/AdminSidebar";
import { AdminTopbar } from "./components/admin/AdminTopbar";
import { AdminBottomNav } from "./components/admin/AdminBottomNav";

import { AdminDashboard } from "./pages/AdminDashboard";
import { VendorApplicationsPage } from "./pages/VendorApplicationsPage";
import { CategoriesManagement } from "./pages/CategoriesManagement";
import { ListingApprovalQueue } from "./pages/ListingApprovalQueue";
import AdminForm from "./components/AdminForm";

import AdminLoginPage from "./pages/auth/AdminLoginPage";

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
  "/adminForm": {
    title: "Admin Management",
    breadcrumb: "Admin / Management",
  },
};

function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Login has its own layout without admin navigation.
  if (location.pathname === "/login") {
    return <AdminLoginPage />;
  }

  const page = PAGE_INFO[location.pathname] || {
    title: "Admin Dashboard",
    breadcrumb: "Admin / Dashboard",
  };

  return (
    <>
      <AdminSidebar
        isOpen={open}
        onClose={() => setOpen(false)}
        currentPath={location.pathname}
      />

      <AdminTopbar
        onMenuClick={() => setOpen(true)}
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
          <Route path="/admin/vendors" element={<VendorApplicationsPage />} />
          <Route
            path="/admin/listings/categories"
            element={<CategoriesManagement />}
          />
          <Route
            path="/admin/listings/approval"
            element={<ListingApprovalQueue />}
          />
          <Route path="/adminForm" element={<AdminForm />} />
          <Route path="*" element={<AdminDashboard />} />
        </Routes>
      </div>

      <AdminBottomNav currentPath={location.pathname} />
    </>
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
