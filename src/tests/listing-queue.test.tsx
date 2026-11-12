import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi, type PendingPet } from "../services/adminApi";
import { ApiError } from "../services/api";
import { ListingApprovalQueue } from "../pages/ListingApprovalQueue";

vi.mock("../services/adminApi", () => ({ adminApi: {
  getPendingPetPage: vi.fn(), approvePet: vi.fn(), rejectPet: vi.fn(),
} }));

const pets: PendingPet[] = [
  { pet_id: 11, vendor: 9, business: 5, listing_type: "ADOPTION", name: "Milo", species: "Dog", breed: "Beagle", age: 8, gender: "MALE", size: "MEDIUM", description: "Friendly", approved: false, review_status: "PENDING", rejection_reason: "", reviewed_at: null, is_active: true, price: null, adoption_status: "AVAILABLE", images: [], created_at: "2026-10-25T10:00:00Z", updated_at: "2026-10-25T10:00:00Z" },
  { pet_id: 12, vendor: 10, business: 6, listing_type: "SALE", name: "Luna", species: "Cat", breed: "Tabby", age: 5, gender: "FEMALE", size: "SMALL", description: "Calm", approved: false, review_status: "PENDING", rejection_reason: "", reviewed_at: null, is_active: true, price: "100000", adoption_status: "AVAILABLE", images: [], created_at: "2026-10-26T10:00:00Z", updated_at: "2026-10-26T10:00:00Z" },
];
const pageResult = { count: 2, next: null, previous: null, results: pets };

describe("ListingApprovalQueue", () => {
  beforeEach(() => {
    vi.mocked(adminApi.getPendingPetPage).mockResolvedValue(pageResult);
    vi.mocked(adminApi.approvePet).mockResolvedValue({ ok: true });
    vi.mocked(adminApi.rejectPet).mockResolvedValue({ ok: true });
  });

  it("loads from the paginated API, searches, and approves using the backend pet_id", async () => {
    const user = userEvent.setup();
    render(<ListingApprovalQueue />);
    expect(screen.getByText("Loading pending listings…")).toBeInTheDocument();
    expect(await screen.findByText("Milo")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Search pending listings" }), "luna");
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.queryByText("Milo")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Search pending listings" }));
    await user.click(within(screen.getByRole("row", { name: /Milo/ })).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(adminApi.approvePet).toHaveBeenCalledWith(11));
    expect(await screen.findByRole("status")).toHaveTextContent("Milo was approved");
    expect(screen.queryByText("Milo")).not.toBeInTheDocument();
  });

  it("opens listing details and submits a trimmed rejection reason", async () => {
    const user = userEvent.setup();
    render(<ListingApprovalQueue />);
    await screen.findByText("Milo");
    await user.click(screen.getByRole("button", { name: "View Milo details" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Vendor #9");
    expect(screen.getByRole("dialog")).toHaveTextContent("Friendly");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reject" }));
    const submit = screen.getByRole("button", { name: "Reject listing" });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText("Reason for rejection"), "  Missing records  ");
    expect(submit).toBeEnabled();
    await user.click(submit);
    await waitFor(() => expect(adminApi.rejectPet).toHaveBeenCalledWith(11, "Missing records"));
    expect(await screen.findByRole("status")).toHaveTextContent("Milo was rejected");
  });

  it("shows API errors, including 404, and the clear-queue empty state", async () => {
    vi.mocked(adminApi.getPendingPetPage).mockRejectedValueOnce(new ApiError("Listing endpoint not found", 404));
    const { unmount } = render(<ListingApprovalQueue />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Listing endpoint not found");
    unmount();
    vi.mocked(adminApi.getPendingPetPage).mockResolvedValueOnce({ count: 0, next: null, previous: null, results: [] });
    render(<ListingApprovalQueue />);
    expect(await screen.findByText("Queue is clear")).toBeInTheDocument();
  });
});
