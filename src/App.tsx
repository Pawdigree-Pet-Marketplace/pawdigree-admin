import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AdminSidebar } from "./components/admin/AdminSidebar";
import { AdminTopbar } from "./components/admin/AdminTopbar";
import { AdminBottomNav } from "./components/admin/AdminBottomNav";
import { AdminDashboard } from "./pages/AdminDashboard";
import { VendorApplicationsPage } from "./pages/VendorApplicationsPage";

function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

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
          <Route path="/admin/vendors" element={<VendorApplicationsPage />} />
          {/* Fallback - shows dashboard for any other /admin/* link until you create real pages */}
          <Route path="/admin/:page" element={<AdminDashboard />} />
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
