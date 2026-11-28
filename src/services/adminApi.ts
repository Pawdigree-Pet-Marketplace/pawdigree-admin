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
  approved?: boolean;
  rejection_reason?: string;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendingMerchandisePage {
  count: number;
  next: string | null;
  previous: string | null;
  results: MerchandiseProduct[];
}

export interface AdminService extends ApiRecord {
  service_id: number;
  business: string;
  category: number;
  category_status: string;
  name: string;
  service_type: string;
  description: string;
  image: string | null;
  price: string;
  duration: number;
  availability_status: string;
  is_active: boolean;
  approved: boolean;
  rejection_reason: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendingServicesPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminService[];
}

export interface PendingPet extends ApiRecord {
  pet_id: number;
  vendor: number;
  business: number | string;
  business_name?: string | null;
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
  images: Array<{
    image_id: number;
    image: string;
    is_primary: boolean;
    position: number;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}
export interface AdminPetBusiness {
  id: string;
  name: string;
}

export interface AdminPetCreateInput {
  business: string;
  listing_type: "SALE" | "ADOPTION";
  name: string;
  species: string;
  age: number;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  size: "SMALL" | "MEDIUM" | "LARGE";
  breed?: string;
  description?: string;
  price?: number;
}
export interface PendingPetPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: PendingPet[];
  business_name?: string | null;
}

export interface AdminPetListingPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: PendingPet[];
}

export interface AdminPetListingFilters {
  search?: string;
  species?: string;
  listing_type?: "ADOPTION" | "SALE" | "";
  adoption_status?: "AVAILABLE" | "PENDING" | "ADOPTED" | "";
  review_status?: "APPROVED" | "PENDING" | "REJECTED" | "";
  is_active?: "true" | "false" | "";
  business?: string;
  page?: number;
  page_size?: number;
}

export type AdminPetListingUpdate = Partial<
  Pick<
    PendingPet,
    | "listing_type"
    | "name"
    | "species"
    | "breed"
    | "age"
    | "gender"
    | "size"
    | "description"
    | "price"
    | "adoption_status"
  >
>;
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

export type ManagedUserStatus = "active" | "deactivated" | "suspended";

export interface ManagedUser extends ApiRecord {
  id?: number | string;
  user_id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  account_status?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface ManagedUsersPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: ManagedUser[];
}

export type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

export type RawBooking = Record<string, unknown>;

export interface Paged<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ReportStatus = "PENDING" | "DISMISSED" | "RESOLVED";

export type RawReport = Record<string, unknown>;


export const adminApi = {
  async getCategories() {
    return unwrapList<Category>(
      await apiRequest<unknown>("/categories/")
    );
    
  },

  getUsers(params: {
    search?: string;
    role?: string;
    status?: ManagedUserStatus;
    page?: number;
    page_size?: number;
  } = {}) {
    const query = new URLSearchParams();

    if (params.search?.trim()) {
      query.set("search", params.search.trim());
    }

    if (params.role) {
      query.set("role", params.role);
    }

    if (params.status) {
      query.set("status", params.status);
    }

    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.page_size ?? 10));

    return apiRequest<ManagedUsersPage>(
      `/admin/users/?${query.toString()}`
    );
  },

  activateUser(userId: number | string) {
    return apiRequest<unknown>(
      `/admin/users/${userId}/activate/`,
      { method: "POST" }
    );
  },

  deactivateUser(userId: number | string) {
    return apiRequest<unknown>(
      `/admin/users/${userId}/deactivate/`,
      { method: "POST" }
    );
  },

  suspendUser(userId: number | string, reason: string) {
    return apiRequest<unknown>(
      `/admin/users/${userId}/suspend/`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    );
  },

    getBookings(params: {
    page?: number;
    page_size?: number;
    status?: BookingStatus;
    search?: string;
  } = {}) {
    const query = new URLSearchParams();

    if (params.status) query.set("status", params.status);
    if (params.search?.trim()) query.set("search", params.search.trim());

    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.page_size ?? 20));

    return apiRequest<Paged<RawBooking>>(
      `/admin/bookings/?${query.toString()}`
    );
  },

  updateBookingStatus(id: string, status: BookingStatus) {
    return apiRequest<RawBooking>(`/admin/bookings/${id}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

    getReports(params: {
    page?: number;
    page_size?: number;
    status?: ReportStatus;
    item_type?: string;
  } = {}) {
    const query = new URLSearchParams();

    if (params.status) query.set("status", params.status);
    if (params.item_type) query.set("item_type", params.item_type);

    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.page_size ?? 20));

    return apiRequest<Paged<RawReport>>(
      `/reports/admin/?${query.toString()}`
    );
  },

  getReport(id: string) {
    return apiRequest<RawReport>(`/reports/admin/${id}/`);
  },

  updateReportStatus(id: string, status: ReportStatus) {
    return apiRequest<RawReport>(`/reports/admin/${id}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  removeReportedItem(id: string) {
    return apiRequest<unknown>(`/reports/admin/${id}/remove/`, {
      method: "POST",
    });
  },

  async getMerchandise() {
    return unwrapList<MerchandiseProduct>(await apiRequest<unknown>("/products/"));
  },
    getPendingMerchandisePage(page = 1) {
  return apiRequest<PendingMerchandisePage>(
    `/products/admin/pending/?page=${page}`
    
  );
},
  getPendingServicesPage(page = 1) {
    return apiRequest<PendingServicesPage>(
      `/services/admin/pending/?page=${page}`
    );
  },

  approveService(id: AdminService["service_id"]) {
    return apiRequest<AdminService>(`/services/admin/${id}/approve/`, {
      method: "POST",
    });
  },

  rejectService(id: AdminService["service_id"], reason: string) {
    return apiRequest<AdminService>(`/services/admin/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
  createMerchandise(
  data: Omit<
    MerchandiseProduct,
    | "id"
    | "created_at"
    | "updated_at"
    | "is_active"
    | "approved"
    | "rejection_reason"
    | "reviewed_at"
  > & { is_active?: boolean }
) {
  return apiRequest<MerchandiseProduct>("/products/", {
    method: "POST",
    body: JSON.stringify(data),
  });
},

  updateMerchandise(
  id: MerchandiseProduct["id"],
  data: Partial<
    Omit<
      MerchandiseProduct,
      | "id"
      | "created_at"
      | "updated_at"
      | "approved"
      | "rejection_reason"
      | "reviewed_at"
    >
  >
) {
  return apiRequest<MerchandiseProduct>(`/products/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
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
  getAdminPetBusinesses() {
    return apiRequest<AdminPetBusiness[]>(
      "/pets/admin/businesses/"
    );
  },

  createAdminPet(data: FormData) {
    return apiRequest<PendingPet>("/pets/admin/", {
      method: "POST",
      body: data,
    });
  },
  getAdminPetListings(filters: AdminPetListingFilters = {}) {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value));
      }
    });

    return apiRequest<AdminPetListingPage>(
      `/pets/admin/?${query.toString()}`
    );
  },

  getAdminPetListing(id: PendingPet["pet_id"]) {
    return apiRequest<PendingPet>(`/pets/admin/${id}/`);
  },

  updateAdminPetListing(
    id: PendingPet["pet_id"],
    data: AdminPetListingUpdate
  ) {
    return apiRequest<PendingPet>(`/pets/admin/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deactivateAdminPetListing(id: PendingPet["pet_id"]) {
    return apiRequest<void>(`/pets/admin/${id}/`, {
      method: "DELETE",
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
  approveMerchandise(id: MerchandiseProduct["id"]) {
  return apiRequest<unknown>(`/products/admin/${id}/approve/`, {
    method: "POST",
  });
},

rejectMerchandise(id: MerchandiseProduct["id"], reason: string) {
  return apiRequest<unknown>(`/products/admin/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
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

