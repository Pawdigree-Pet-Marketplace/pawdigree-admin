
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import VendorApplicationsPage from "../pages/VendorApplicationsPage";
import {
  adminApi,
  type PaginatedVendorApplications,
} from "../services/adminApi";

vi.mock("../services/adminApi", () => ({
  adminApi: {
    getVendorApplications: vi.fn(),
    getVendorApplication: vi.fn(),
    decideVendorApplication: vi.fn(),
    getVendorDecisionHistory: vi.fn(),
  },
}));

const mockGetApplications = vi.mocked(adminApi.getVendorApplications);
const mockDecideApplication = vi.mocked(adminApi.decideVendorApplication);

const applicationsResponse: PaginatedVendorApplications = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: "vendor-1",
      name: "Happy Paws",
      owner_name: "Jane Doe",
      email: "jane@example.com",
      contact_number: "0700000000",
      address: "Kampala, Uganda",
      verification_status: "pending",
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-20T10:00:00Z",
      categories: [
        {
          category_id: "category-1",
          name: "Pet Supplies",
          approval_status: "pending",
          can_sell: false,
        },
      ],
      documents: [],
    },
    {
      id: "vendor-2",
      name: "Furry Friends",
      owner_name: "John Doe",
      email: "john@example.com",
      contact_number: "0711111111",
      address: "Entebbe, Uganda",
      verification_status: "approved",
      created_at: "2026-10-19T10:00:00Z",
      updated_at: "2026-10-19T10:00:00Z",
      categories: [],
      documents: [],
    },
  ],
};

describe("VendorApplicationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetApplications.mockResolvedValue(applicationsResponse);
    mockDecideApplication.mockResolvedValue({} as Awaited<
      ReturnType<typeof adminApi.decideVendorApplication>
    >);
  });

  it("loads and displays vendor applications", async () => {
    render(<VendorApplicationsPage />);

    expect(await screen.findByText("Happy Paws")).toBeInTheDocument();
    expect(screen.getByText("Furry Friends")).toBeInTheDocument();

    expect(mockGetApplications).toHaveBeenCalled();
  });

  it("displays an error when loading applications fails", async () => {
    mockGetApplications.mockRejectedValueOnce(
      new Error("Unable to load vendor applications"),
    );

    render(<VendorApplicationsPage />);

    expect(
      await screen.findByText(/unable to load vendor applications/i),
    ).toBeInTheDocument();
  });

  it("filters applications by search text", async () => {
    render(<VendorApplicationsPage />);

    expect(await screen.findByText("Happy Paws")).toBeInTheDocument();
    expect(screen.getByText("Furry Friends")).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: /search vendor applications/i,
      }),
      { target: { value: "Happy Paws" } },
    );

    expect(screen.getByText("Happy Paws")).toBeInTheDocument();
    expect(screen.queryByText("Furry Friends")).not.toBeInTheDocument();
  });

  it("submits an approval decision for a vendor application", async () => {
    render(<VendorApplicationsPage />);

    expect(await screen.findByText("Happy Paws")).toBeInTheDocument();

    // Open the application review panel first.
   fireEvent.click(
  screen.getAllByRole("button", { name: /^review$/i })[0],
);

    // Wait for the review panel before looking for its Approve button.
    expect(
      await screen.findByRole("heading", { name: /review vendor/i }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /^approve$/i }),
    );

    await waitFor(() => {
      expect(mockDecideApplication).toHaveBeenCalledWith(
        "vendor-1",
        "approve",
        undefined,
      );
    });
  });
});
