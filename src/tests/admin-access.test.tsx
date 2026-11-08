import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminAccessGate from "../components/auth/AdminAccessGate";

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
