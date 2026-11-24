
import { apiRequest, type ApiRecord } from "./api";

export interface AdminOrder extends ApiRecord {
  id: number | string;
  order_id?: number | string;
  status?: string;
  order_status?: string;
  order_type?: string;
  customer?: string | number | ApiRecord;
  vendor?: string | number | ApiRecord;
  business_name?: string;
  total?: number | string;
  total_amount?: number | string;
  amount?: number | string;
  refund_status?: string;
  refund_amount?: number | string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_city_district?: string;
  notes?: string;
  cancelled_at?: string | null;
  created_at?: string;
  items?: ApiRecord[];
}

export interface OrdersResponse {
  count?: number;
  results?: AdminOrder[];
  orders?: AdminOrder[];
  data?: AdminOrder[];
  next?: string | null;
  previous?: string | null;
}

function normalizeOrders(payload: unknown): AdminOrder[] {
  if (Array.isArray(payload)) {
    return payload as AdminOrder[];
  }

  if (payload && typeof payload === "object") {
    const data = payload as OrdersResponse;

    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.orders)) return data.orders;
    if (Array.isArray(data.data)) return data.data;
  }

  return [];
}

export const ordersApi = {
  async getOrders(): Promise<AdminOrder[]> {
    const response = await apiRequest<unknown>(
      "/orders/admin/vendor-orders/",
    );

    return normalizeOrders(response);
  },

  updateOrderStatus(id: AdminOrder["id"], status: string) {
    return apiRequest<unknown>(
      `/admin/vendor-orders/${id}/status/`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    );
  },
};
