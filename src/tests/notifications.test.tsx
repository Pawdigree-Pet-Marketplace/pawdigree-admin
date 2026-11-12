import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../services/adminApi";
import { ApiError } from "../services/api";
import { AdminNotificationsPage } from "../pages/AdminNotificationsPage";

vi.mock("../services/adminApi", () => ({ adminApi: {
  getMyNotifications: vi.fn(), getUnreadNotificationCount: vi.fn(),
  markNotificationRead: vi.fn(), markAllNotificationsRead: vi.fn(),
} }));

const notices = [
  { notification_id: 8, type: "LISTING_PENDING", message: "A pet listing needs review.", reference_id: 41, is_read: false, created_at: "2026-11-01T10:00:00Z", updated_at: "2026-11-01T10:00:00Z" },
  { notification_id: 7, type: "LISTING_APPROVED", message: "A listing was approved.", reference_id: 40, is_read: true, created_at: "2026-10-31T10:00:00Z", updated_at: "2026-10-31T10:00:00Z" },
];

function renderPage() {
  return render(<MemoryRouter><AdminNotificationsPage /></MemoryRouter>);
}

describe("AdminNotificationsPage", () => {
  beforeEach(() => {
    vi.mocked(adminApi.getMyNotifications).mockResolvedValue({ count: 2, next: null, previous: null, results: notices });
    vi.mocked(adminApi.getUnreadNotificationCount).mockResolvedValue({ unread: 1 });
    vi.mocked(adminApi.markNotificationRead).mockResolvedValue({ ...notices[0], is_read: true });
    vi.mocked(adminApi.markAllNotificationsRead).mockResolvedValue({ unread: 0 });
  });

  it("loads account notifications, unread status, and the relevant review destination", async () => {
    renderPage();
    expect(await screen.findByText("A pet listing needs review.")).toBeInTheDocument();
    expect(screen.getByText("Your account has 1 unread notifications.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open listing queue" })).toHaveAttribute("href", "/admin/listings/pets");
    expect(screen.getByText("LISTING PENDING").closest("li")).toHaveClass("is-unread");
    expect(screen.getByText("LISTING APPROVED").closest("li")).toHaveClass("is-read");
  });

  it("marks one or all notifications read and notifies the navigation indicator", async () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("A pet listing needs review.");
    await user.click(screen.getByRole("button", { name: "Mark read" }));
    await waitFor(() => expect(adminApi.markNotificationRead).toHaveBeenCalledWith(8));
    expect(screen.getByText("Your account has 0 unread notifications.")).toBeInTheDocument();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "admin-notifications-updated" }));
    expect(screen.getByRole("button", { name: "Mark all read" })).toBeDisabled();
  });

  it("renders empty and error states", async () => {
    vi.mocked(adminApi.getMyNotifications).mockResolvedValueOnce({ count: 0, next: null, previous: null, results: [] });
    renderPage();
    expect(await screen.findByText("No notifications")).toBeInTheDocument();
    vi.mocked(adminApi.getMyNotifications).mockRejectedValueOnce(new ApiError("Notifications unavailable", 503));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("Notifications unavailable");
  });
});
