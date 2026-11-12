import { apiRequest, type ApiRecord, unwrapList } from "./api";

export type CategoryKind = "general" | "pets" | "merchandise" | "services";

export interface Category extends ApiRecord {
  id: number | string;
  name: string;
  description: string;
  kind: CategoryKind;
  is_active: boolean;
}

export interface MerchandiseProduct extends ApiRecord {
  id: number;
  business: string | number;
  category: number;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PendingPet extends ApiRecord {
  pet_id: number;
  vendor: number;
  business: number | string;
  listing_type: "ADOPTION" | "SALE";
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  size: "SMALL" | "MEDIUM" | "LARGE";
  description: string;
  approved: boolean;
  review_status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason: string;
  reviewed_at: string | null;
  is_active: boolean;
  price: string | null;
  adoption_status: "AVAILABLE" | "PENDING" | "ADOPTED";
  images: Array<{ image_id: number; image: string; is_primary: boolean; position: number; created_at: string }>;
  created_at: string;
  updated_at: string;
}

export interface PendingPetPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: PendingPet[];
}

export interface AdoptionApplication extends ApiRecord {
  application_id: string;
  pet: number;
  pet_name: string;
  customer_id: number;
  customer_username: string;
  customer_email: string;
  status: "PENDING" | "INFO_REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  home_type: string;
  has_outdoor_space: boolean;
  has_other_pets: boolean;
  other_pets_details: string;
  previous_pet_experience: string;
  message: string;
  created_at: string;
  decided_at?: string | null;
  decision_reason?: string;
}

export interface AdminNotification extends ApiRecord {
  notification_id: number;
  type: string;
  message: string;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurrentAdminUser extends ApiRecord {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_email_verified: boolean;
  isActive: boolean;
  accountStatus: string;
}

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
  business_type?: "product_seller" | "service_provider" | string;
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

export interface VendorApplicationTotals {
  totalVendors: number;
  totalBusinesses: number;
}

export type VendorDecision =
  | "approve"
  | "request_changes"
  | "suspend"
  | "reapprove";

// Get the total number of unique vendors and businesses
// using the existing paginated backend endpoint.
async function fetchVendorApplicationTotals(): Promise<VendorApplicationTotals> {
  let page = 1;
  let response: PaginatedVendorApplications;
  const vendorUsernames = new Set<string>();
  let totalBusinesses = 0;

  do {
    const query = new URLSearchParams({
      status: "all",
      page: String(page),
    });

    response = await apiRequest<PaginatedVendorApplications>(
      `/businesses/admin/?${query.toString()}`,
    );

    if (page === 1) {
      totalBusinesses = response.count;
    }

    response.results.forEach((business) => {
      if (business.vendor_username) {
        vendorUsernames.add(business.vendor_username);
      }
    });

    page += 1;
  } while (response.next);

  return {
    totalVendors: vendorUsernames.size,
    totalBusinesses,
  };
}

export const adminApi = {
  async getCategories() {
    return unwrapList<Category>(
      await apiRequest<unknown>("/categories/")
    );
  },

  async getMerchandise() {
    return unwrapList<MerchandiseProduct>(await apiRequest<unknown>("/products/"));
  },

  createMerchandise(data: Omit<MerchandiseProduct, "id" | "created_at" | "updated_at" | "is_active"> & { is_active?: boolean }) {
    return apiRequest<MerchandiseProduct>("/products/", { method: "POST", body: JSON.stringify(data) });
  },

  updateMerchandise(id: MerchandiseProduct["id"], data: Partial<Omit<MerchandiseProduct, "id" | "created_at" | "updated_at">>) {
    return apiRequest<MerchandiseProduct>(`/products/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
  },

  deactivateMerchandise(id: MerchandiseProduct["id"]) {
    return apiRequest<void>(`/products/${id}/`, { method: "DELETE" });
  },

  createCategory(data: { name: string; description: string; kind: CategoryKind }) {
    return apiRequest<Category>("/categories/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateCategory(
    id: Category["id"],
    data: Partial<Pick<Category, "name" | "description" | "kind" | "is_active">>
  ) {
    return apiRequest<Category>(`/categories/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deactivateCategory(id: Category["id"]) {
    return apiRequest<void>(`/categories/${id}/`, {
      method: "DELETE",
    });
  },

  activateCategory(id: Category["id"]) {
    return apiRequest<Category>(`/categories/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: true }),
    });
  },

  getPendingPetPage(page = 1) {
    return apiRequest<PendingPetPage>(`/pets/admin/pending/?page=${page}`);
  },

  async getPendingPets() {
    return unwrapList<PendingPet>(await apiRequest<PendingPetPage>("/pets/admin/pending/?page=1"));
  },

  async getAdoptionApplications() {
    return unwrapList<AdoptionApplication>(
      await apiRequest<unknown>("/adoptions/applications/vendor/")
    );
  },

  decideAdoptionApplication(
    applicationId: AdoptionApplication["application_id"],
    status: "APPROVED" | "REJECTED",
    decisionReason = "",
  ) {
    return apiRequest<Partial<AdoptionApplication>>(
      `/adoptions/applications/${applicationId}/decision/`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, decision_reason: decisionReason }),
      },
    );
  },

  async getMyNotifications(page = 1) {
    return apiRequest<{ count: number; next: string | null; previous: string | null; results: AdminNotification[] }>(
      `/notification/?page=${page}`,
    );
  },

  getUnreadNotificationCount() {
    return apiRequest<{ unread: number }>("/notification/unread-count/");
  },

  markNotificationRead(id: AdminNotification["notification_id"]) {
    return apiRequest<AdminNotification>(`/notification/${id}/read/`, { method: "POST" });
  },

  markAllNotificationsRead() {
    return apiRequest<{ unread: number }>("/notification/mark-all-read/", { method: "POST" });
  },

  getCurrentAdminUser() {
    return apiRequest<CurrentAdminUser>("/auth/current-user/");
  },

  approvePet(id: PendingPet["pet_id"]) {
    return apiRequest<unknown>(`/pets/admin/${id}/approve/`, {
      method: "POST",
    });
  },

  rejectPet(id: PendingPet["pet_id"], reason: string) {
    return apiRequest<unknown>(`/pets/admin/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async getVendorApplications(
    status: VendorApiStatus | "all" = "pending",
    page = 1
  ) {
    const query = new URLSearchParams({
      status,
      page: String(page),
    });

    return apiRequest<PaginatedVendorApplications>(
      `/businesses/admin/?${query.toString()}`
    );
  },

  // Counts unique vendor accounts and all business records.
  // Uses the existing backend endpoint; no backend changes needed.
  getVendorApplicationTotals: fetchVendorApplicationTotals,

  getVendorApplication(id: string) {
    return apiRequest<VendorApplicationApi>(
      `/businesses/admin/${id}/`
    );
  },

  decideVendorApplication(
    id: string,
    action: VendorDecision,
    reason?: string
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
