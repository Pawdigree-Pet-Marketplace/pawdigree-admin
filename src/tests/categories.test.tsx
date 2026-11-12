import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi, type Category } from "../services/adminApi";
import { ApiError } from "../services/api";
import { CategoriesManagement } from "../pages/CategoriesManagement";

vi.mock("../services/adminApi", () => ({ adminApi: {
  getCategories: vi.fn(), createCategory: vi.fn(), updateCategory: vi.fn(),
  deactivateCategory: vi.fn(), activateCategory: vi.fn(),
} }));

const categories: Category[] = [
  { id: 1, name: "Grooming", description: "Baths and trims", kind: "services", is_active: true },
  { id: 2, name: "Boarding", description: "Overnight stays", kind: "pets", is_active: false },
];

describe("CategoriesManagement", () => {
  beforeEach(() => {
    vi.mocked(adminApi.getCategories).mockResolvedValue([...categories]);
    vi.mocked(adminApi.createCategory).mockResolvedValue({ ...categories[0], id: 3 });
    vi.mocked(adminApi.updateCategory).mockResolvedValue(categories[0]);
    vi.mocked(adminApi.deactivateCategory).mockResolvedValue(undefined);
    vi.mocked(adminApi.activateCategory).mockResolvedValue(categories[1]);
  });

  it("loads, searches, filters by kind, and shows an empty result", async () => {
    const user = userEvent.setup();
    render(<CategoriesManagement />);
    expect(await screen.findByText("Grooming")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter categories by kind" }), "pets");
    expect(screen.getByText("Boarding")).toBeInTheDocument();
    expect(screen.queryByText("Grooming")).not.toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Search categories" }), "no match");
    expect(screen.getByText("No matching categories")).toBeInTheDocument();
  });

  it("creates a category with the selected kind and trimmed fields", async () => {
    const user = userEvent.setup();
    render(<CategoriesManagement />);
    await screen.findByText("Grooming");
    await user.click(screen.getByRole("button", { name: /add category/i }));
    await user.type(screen.getByLabelText("Category name"), " Training ");
    await user.selectOptions(screen.getByRole("combobox", { name: "Category kind" }), "pets");
    await user.type(screen.getByLabelText(/Description/), " Classes ");
    await user.click(screen.getByRole("button", { name: "Create category" }));
    await waitFor(() => expect(adminApi.createCategory).toHaveBeenCalledWith({ name: "Training", description: "Classes", kind: "pets" }));
    expect(adminApi.getCategories).toHaveBeenCalledTimes(2);
  });

  it("edits categories and confirms status changes", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CategoriesManagement />);
    await screen.findByText("Grooming");
    await user.click(screen.getByRole("button", { name: "Edit Grooming" }));
    await user.clear(screen.getByLabelText("Category name"));
    await user.type(screen.getByLabelText("Category name"), "Pet spa");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(adminApi.updateCategory).toHaveBeenCalledWith(1, { name: "Pet spa", description: "Baths and trims", kind: "services" }));
    await user.click(await screen.findByRole("button", { name: "Deactivate Grooming" }));
    await waitFor(() => expect(adminApi.deactivateCategory).toHaveBeenCalledWith(1));
    await user.click(await screen.findByRole("button", { name: "Activate Boarding" }));
    await waitFor(() => expect(adminApi.activateCategory).toHaveBeenCalledWith(2));
  });

  it("surfaces loading errors and an empty state", async () => {
    vi.mocked(adminApi.getCategories).mockRejectedValueOnce(new ApiError("Could not load categories", 500));
    render(<CategoriesManagement />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load categories");
    expect(screen.getByText("No categories yet")).toBeInTheDocument();
  });
});
