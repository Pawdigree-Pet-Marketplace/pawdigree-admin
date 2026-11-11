import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminAccessGate from "../components/auth/AdminAccessGate";
import { SuperAdminRoute } from "../components/auth/SuperAdminRoute";
import { AdminSidebar } from "../components/admin/AdminSidebar";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

function renderAdmin(role?: string) {
  if (role) {
    localStorage.setItem("role", role);
    localStorage.setItem("pawdigree_active_role", role);
    localStorage.setItem("access", `${role.toLowerCase()}-token`);
  }

  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminAccessGate>
              <p>Admin dashboard</p>
            </AdminAccessGate>
          }
        />
        <Route path="/login" element={<p>Admin login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminAccessGate", () => {
  it.each(["CUSTOMER", "VENDOR"])("denies a %s session", (role) => {
    renderAdmin(role);
    expect(screen.getByRole("heading", { name: /you can’t access this page/i })).toBeInTheDocument();
    expect(screen.queryByText("Admin dashboard")).not.toBeInTheDocument();
  });

  it("redirects a signed-out visitor to admin login", () => {
    renderAdmin();
    expect(screen.getByText("Admin login")).toBeInTheDocument();
  });

  it("allows an authenticated admin session", () => {
    renderAdmin("ADMIN");
    expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
  });

  it("blocks an open dashboard when another tab changes the active role", () => {
    renderAdmin("ADMIN");
    expect(screen.getByText("Admin dashboard")).toBeInTheDocument();

    localStorage.setItem("pawdigree_active_role", "CUSTOMER");
    localStorage.setItem("role", "CUSTOMER");
    fireEvent(window, new StorageEvent("storage", {
      key: "pawdigree_active_role",
      newValue: "CUSTOMER",
      storageArea: localStorage,
    }));

    expect(screen.getByRole("heading", { name: /you can’t access this page/i })).toBeInTheDocument();
    expect(screen.queryByText("Admin dashboard")).not.toBeInTheDocument();
  });
});

describe("role-based navigation and routes", () => {
  function renderSidebar(role: string) {
    localStorage.setItem("role", role);
    localStorage.setItem("pawdigree_active_role", role);
    return render(
      <MemoryRouter>
        <AdminSidebar isOpen={false} onClose={() => {}} onToggleCollapse={() => {}} />
      </MemoryRouter>,
    );
  }

  it("shows Admin operations without Super Admin sections", () => {
    renderSidebar("ADMIN");
    expect(screen.getByRole("link", { name: "Customers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vendor Applications" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Payments & Transactions" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin Management" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Audit Logs" })).not.toBeInTheDocument();
  });

  it("shows Admin navigation plus platform sections to Super Admin", () => {
    renderSidebar("SYSTEM_ADMIN");
    expect(screen.getByRole("link", { name: "Customers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin Management" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Roles & Permissions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Audit Logs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Platform Configuration" })).toBeInTheDocument();
  });

  function renderSuperAdminRoute(role: string) {
    localStorage.setItem("role", role);
    localStorage.setItem("pawdigree_active_role", role);
    localStorage.setItem("access", "test-token");
    return render(
      <MemoryRouter initialEntries={["/admin/audit"]}>
        <Routes>
          <Route path="/admin/audit" element={<AdminAccessGate><SuperAdminRoute><p>Audit logs</p></SuperAdminRoute></AdminAccessGate>} />
          <Route path="/login" element={<p>Admin login</p>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("denies Admin access to Super Admin routes", () => {
    renderSuperAdminRoute("ADMIN");
    expect(screen.getByText(/available to Super Admin accounts only/i)).toBeInTheDocument();
    expect(screen.queryByText("Audit logs")).not.toBeInTheDocument();
  });

  it("allows Super Admin access to Super Admin routes", () => {
    renderSuperAdminRoute("SYSTEM_ADMIN");
    expect(screen.getByText("Audit logs")).toBeInTheDocument();
  });
});
