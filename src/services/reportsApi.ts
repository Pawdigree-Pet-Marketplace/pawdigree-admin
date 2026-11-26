
import { apiRequest } from "./api";

export type ReportType =
  | "overview"
  | "users"
  | "pets"
  | "product-sales"
  | "pet-sales";

export type ReportGroupBy = "day" | "week" | "month";

export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  group_by?: ReportGroupBy;
  role?: string;
  status?: string;
  listing_type?: string;
  species?: string;
  business?: string;
  category?: string;
}

export interface ReportSummaryItem {
  key: string;
  label: string;
  value: string | number;
  format?: "count" | "money" | "percent" | "text";
}

export interface ReportColumn {
  key: string;
  label: string;
  format?: "count" | "money" | "percent" | "text";
}

export interface ReportRow {
  [key: string]: string | number | null;
}

export interface ReportSection {
  key: string;
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
}

export interface ReportResponse {
  report: string;
  title: string;
  generated_at: string;
  currency?: string;
  filters: Record<string, unknown>;
  summary: ReportSummaryItem[];
  sections: ReportSection[];
}

const REPORT_ENDPOINTS: Record<ReportType, string> = {
  overview: "/platform-reports/overview/",
  users: "/platform-reports/users/",
  pets: "/platform-reports/pets/",
  "product-sales": "/platform-reports/product-sales/",
  "pet-sales": "/platform-reports/pet-sales/",
};

export const reportsApi = {
  getReport(
    reportType: ReportType,
    filters: ReportFilters = {},
  ): Promise<ReportResponse> {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value));
      }
    });

    const queryString = query.toString();

    const endpoint = REPORT_ENDPOINTS[reportType];

    return apiRequest<ReportResponse>(
      `${endpoint}${queryString ? `?${queryString}` : ""}`,
    );
  },
};
