import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  ChangeAdminPasswordPage,
  ForgotAdminPasswordPage,
  ResetAdminPasswordPage,
  SetAdminPasswordPage,
} from "../pages/auth/AdminPasswordPages";
import {
  changeAdminPassword,
  clearStoredAdminCredentials,
  confirmAdminPasswordReset,
  requestAdminPasswordReset,
  setAdminPassword,
} from "../services/adminPasswordService";

vi.mock("../services/adminPasswordService", () => ({
  changeAdminPassword: vi.fn(),
  clearStoredAdminCredentials: vi.fn(),
  confirmAdminPasswordReset: vi.fn(),
  requestAdminPasswordReset: vi.fn(),
  setAdminPassword: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(setAdminPassword).mockResolvedValue({ detail: "Password set." });
  vi.mocked(requestAdminPasswordReset).mockResolvedValue({ detail: "If an account exists, instructions will be sent." });
  vi.mocked(confirmAdminPasswordReset).mockResolvedValue({ detail: "Password reset." });
  vi.mocked(changeAdminPassword).mockResolvedValue({ detail: "Password changed." });
});

function renderRoute(path: string, page: ReactNode) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/set-password" element={<SetAdminPasswordPage />} />
    <Route path="/forgot-password" element={<ForgotAdminPasswordPage />} />
    <Route path="/reset-password" element={<ResetAdminPasswordPage />} />
    <Route path="/admin/settings/security" element={<ChangeAdminPasswordPage />} />
    <Route path="/login" element={<p>Admin sign in</p>} />
    <Route path="*" element={page} />
  </Routes></MemoryRouter>);
}

async function fillPasswordPair(user: ReturnType<typeof userEvent.setup>, password = "NewPassword123!") {
  await user.type(screen.getByLabelText("New password"), password);
  await user.type(screen.getByLabelText("Confirm new password"), password);
}

describe("admin password management pages", () => {
  it("sets an invited admin password from the URL token then clears credentials and returns to login", async () => {
    localStorage.setItem("access", "old-access");
    const user = userEvent.setup();
    renderRoute("/set-password?token=invite-token", <SetAdminPasswordPage />);
    await fillPasswordPair(user);
    await user.click(screen.getByRole("button", { name: "Set password" }));
    expect(await screen.findByText("Admin sign in")).toBeInTheDocument();
    expect(setAdminPassword).toHaveBeenCalledWith("invite-token", "NewPassword123!");
    expect(clearStoredAdminCredentials).toHaveBeenCalledOnce();
  });

  it("shows an error when invitation passwords do not match", async () => {
    const user = userEvent.setup();
    renderRoute("/set-password?token=invite-token", <SetAdminPasswordPage />);
    await user.type(screen.getByLabelText("New password"), "NewPassword123!");
    await user.type(screen.getByLabelText("Confirm new password"), "DifferentPassword123!");
    await user.click(screen.getByRole("button", { name: "Set password" }));
    expect(screen.getByRole("alert")).toHaveTextContent("passwords do not match");
    expect(setAdminPassword).not.toHaveBeenCalled();
  });

  it("submits a forgot-password request and shows the neutral server response", async () => {
    const user = userEvent.setup();
    renderRoute("/forgot-password", <ForgotAdminPasswordPage />);
    await user.type(screen.getByLabelText("Email address"), "admin@example.test");
    await user.click(screen.getByRole("button", { name: "Send reset instructions" }));
    expect(await screen.findByRole("status")).toHaveTextContent("If an account exists");
    expect(requestAdminPasswordReset).toHaveBeenCalledWith("admin@example.test");
  });

  it("confirms a reset using UID and token query parameters", async () => {
    const user = userEvent.setup();
    renderRoute("/reset-password?uid=encoded-uid&token=reset-token", <ResetAdminPasswordPage />);
    await fillPasswordPair(user);
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(await screen.findByText("Admin sign in")).toBeInTheDocument();
    expect(confirmAdminPasswordReset).toHaveBeenCalledWith("encoded-uid", "reset-token", "NewPassword123!");
    expect(clearStoredAdminCredentials).toHaveBeenCalledOnce();
  });

  it("does not allow submission when the reset link has no token", () => {
    renderRoute("/reset-password?uid=encoded-uid", <ResetAdminPasswordPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(/incomplete or expired/i);
    expect(screen.queryByRole("button", { name: "Reset password" })).not.toBeInTheDocument();
  });

  it("changes an authenticated admin password then clears the session and redirects", async () => {
    localStorage.setItem("access", "admin-access");
    localStorage.setItem("refresh", "admin-refresh");
    const user = userEvent.setup();
    renderRoute("/admin/settings/security", <ChangeAdminPasswordPage />);
    await user.type(screen.getByLabelText("Current password"), "CurrentPassword123!");
    await fillPasswordPair(user);
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText("Admin sign in")).toBeInTheDocument();
    expect(changeAdminPassword).toHaveBeenCalledWith("CurrentPassword123!", "NewPassword123!");
    expect(clearStoredAdminCredentials).toHaveBeenCalledOnce();
  });

  it("surfaces invalid or expired reset token errors", async () => {
    vi.mocked(confirmAdminPasswordReset).mockRejectedValueOnce(new Error("Invalid or expired password-reset token."));
    const user = userEvent.setup();
    renderRoute("/reset-password?uid=uid&token=bad-token", <ResetAdminPasswordPage />);
    await fillPasswordPair(user);
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid or expired password-reset token.");
  });
});
