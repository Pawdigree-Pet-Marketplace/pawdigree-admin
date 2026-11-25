import { apiRequest } from "./api";

export interface AuditLog {
  id: number;
  actor: number | string;
  actor_email: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  target_label: string;
  details: string;
  created_at: string;
}

export interface AuditLogsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

export interface AuditLogsFilters {
  user?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export const auditLogsApi = {
  getAuditLogs(
    filters: AuditLogsFilters = {},
  ): Promise<AuditLogsResponse> {
    const query = new URLSearchParams();

    if (filters.user?.trim()) {
      query.set("user", filters.user.trim());
    }

    if (filters.action?.trim()) {
      query.set("action", filters.action.trim());
    }

    if (filters.date_from) {
      query.set("date_from", filters.date_from);
    }

    if (filters.date_to) {
      query.set("date_to", filters.date_to);
    }

    query.set("page", String(filters.page ?? 1));
    query.set("page_size", String(filters.page_size ?? 10));

    return apiRequest<AuditLogsResponse>(
      `/audit-logs/?${query.toString()}`,
    );
  },
};