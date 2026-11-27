
import { apiRequest } from "./api";
import type { BookingStatus, RawBooking, Paged } from "./adminApi";

export interface ServiceBookingFilters {
  date_from?: string;
  date_to?: string;
  status?: BookingStatus | "";
  search?: string;
  business?: string;
  customer?: string;
  page?: number;
  page_size?: number;
}

export type ServiceBookingsResponse = Paged<RawBooking>;

export const serviceBookingsApi = {
  getBookings(
    filters: ServiceBookingFilters = {},
  ): Promise<ServiceBookingsResponse> {
    const query = new URLSearchParams();

    if (filters.date_from) query.set("date_from", filters.date_from);
    if (filters.date_to) query.set("date_to", filters.date_to);
    if (filters.status) query.set("status", filters.status);
    if (filters.search?.trim()) query.set("search", filters.search.trim());
    if (filters.business?.trim())
      query.set("business", filters.business.trim());
    if (filters.customer?.trim())
      query.set("customer", filters.customer.trim());

    query.set("page", String(filters.page ?? 1));
    query.set("page_size", String(filters.page_size ?? 10));

    return apiRequest<ServiceBookingsResponse>(
      `/admin/bookings/?${query.toString()}`,
    );
  },
};
