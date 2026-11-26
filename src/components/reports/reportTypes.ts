
import type {
  ReportFilters,
  ReportResponse,
  ReportType,
} from "../../services/reportsApi";

export interface ReportTab {
  id: ReportType | "service-bookings";
  label: string;
}

export const REPORT_TABS: ReportTab[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "pets", label: "Pets" },
  { id: "product-sales", label: "Product Sales" },
  { id: "pet-sales", label: "Pet Sales" },
  { id: "service-bookings", label: "Service Bookings" },
];

export interface ReportPageState {
  activeTab: ReportTab["id"];
  filters: ReportFilters;
  report: ReportResponse | null;
  loading: boolean;
  error: string;
}
