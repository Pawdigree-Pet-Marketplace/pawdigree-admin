import { apiRequest, type ApiRecord, unwrapList } from "./api";

export interface Category extends ApiRecord { id: number | string; name: string; description?: string; is_active?: boolean; active?: boolean; }
export interface PendingPet extends ApiRecord { id: number | string; name?: string; species?: string; breed?: string; age?: string | number; price?: string | number; created_at?: string; }

export type VendorApiStatus =
  | "pending"
  | "changes_requested"
  | "approved"
  | "suspended"
  | "rejected"
  | "draft";

export interface VendorCategory extends ApiRecord {
  category_id: number | string;
  name: string;
  approval_status: string;
  can_sell: boolean;
}

export interface VendorDocument extends ApiRecord {
  document_id: string;
  document_type: string;
  review_status: string;
  correction_reason?: string | null;
  version: number;
  reviewed_at?: string | null;
  created_at: string;
  download_url: string;
}

export interface VendorApplicationApi extends ApiRecord {
  id: string;
  vendor_email?: string;
  vendor_username?: string;
  name: string;
  description?: string | null;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  city_district?: string | null;
  categories?: VendorCategory[];
  documents?: VendorDocument[];
  verification_status: VendorApiStatus;
  decision_reason?: string | null;
  vendor_response?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  images?: Array<{
    id: number | string;
    image?: string;
    alt_text?: string;
  }>;
}

export interface PaginatedVendorApplications {
  count: number;
  next: string | null;
  previous: string | null;
  results: VendorApplicationApi[];
}

export type VendorDecision =
  | "approve"
  | "request_changes"
  | "suspend"
  | "reapprove";

export const adminApi = {
  async getCategories() { return unwrapList<Category>(await apiRequest<unknown>("/categories/")); },
  createCategory(data: { name: string; description: string }) { return apiRequest<Category>("/categories/", { method: "POST", body: JSON.stringify(data) }); },
  updateCategory(id: Category["id"], data: { name: string; description: string }) { return apiRequest<Category>(`/categories/${id}/`, { method: "PATCH", body: JSON.stringify(data) }); },
  deactivateCategory(id: Category["id"]) { return apiRequest<void>(`/categories/${id}/`, { method: "DELETE" }); },
  async getPendingPets() { return unwrapList<PendingPet>(await apiRequest<unknown>("/pets/admin/pending/")); },
  approvePet(id: PendingPet["id"]) { return apiRequest<unknown>(`/pets/admin/${id}/approve/`, { method: "POST" }); },
  rejectPet(id: PendingPet["id"], reason: string) { return apiRequest<unknown>(`/pets/admin/${id}/reject/`, { method: "POST", body: JSON.stringify({ reason }) }); },
  async getVendorApplications(status: VendorApiStatus | "all" = "pending",page = 1,
  ) {
    const query = new URLSearchParams({
      status,
      page: String(page),
    });

    return apiRequest<PaginatedVendorApplications>(
      `/businesses/admin/?${query.toString()}`,
    );
  },

  getVendorApplication(id: string) {
    return apiRequest<VendorApplicationApi>(
      `/businesses/admin/${id}/`,
    );
  },

  decideVendorApplication(
    id: string,
    action: VendorDecision,
    reason?: string,
  ) {
    return apiRequest<{
      business_id: string;
      verification_status: VendorApiStatus;
      vendor_approved: boolean;
      decision: ApiRecord;
    }>(`/businesses/admin/${id}/decision/`, {
      method: "POST",
      body: JSON.stringify({
        action,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      }),
    });
  },

  getVendorDecisionHistory(id: string) {
    return apiRequest<
      Array<{
        id: number | string;
        action: string;
        from_status: string;
        to_status: string;
        reason: string;
        decided_by_email: string | null;
        created_at: string;
      }>
    >(`/businesses/admin/${id}/decisions/`);
  },

};
