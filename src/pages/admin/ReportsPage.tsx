
import { useEffect, useState } from "react";
import ReportsHeader from "../../components/reports/ReportsHeader";
import ReportsTabs from "../../components/reports/ReportsTabs";
import ReportsFilterBar from "../../components/reports/ReportsFilterBar";
import ReportSummaryCards from "../../components/reports/ReportSummaryCards";
import ReportTable from "../../components/reports/ReportTable";
import ReportEmptyState from "../../components/reports/ReportEmptyState";
import ReportErrorState from "../../components/reports/ReportErrorState";
import type { ReportTab } from "../../components/reports/reportTypes";
import {
  reportsApi,
  type ReportFilters,
  type ReportResponse,
  type ReportType,
} from "../../services/reportsApi";
import {
  serviceBookingsApi,
  type ServiceBookingsResponse,
} from "../../services/serviceBookingsApi";
import type { RawBooking } from "../../services/adminApi";
import "../../components/reports/Reports.css";

type BookingReport = {
  results: RawBooking[];
  count: number;
};

type PageData = ReportResponse | BookingReport | null;

const REPORT_TYPE_IDS: ReportType[] = [
  "overview",
  "users",
  "pets",
  "product-sales",
  "pet-sales",
];

const isReportType = (tab: ReportTab["id"]): tab is ReportType =>
  REPORT_TYPE_IDS.includes(tab as ReportType);

const getDefaultDates = () => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 29);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    date_from: formatDate(from),
    date_to: formatDate(today),
    group_by: "day" as const,
  };
};

const getBookingValue = (booking: RawBooking, keys: string[]): string => {
  for (const key of keys) {
    const value = booking[key];
    if (value !== null && value !== undefined && value !== "") {
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return String(value);
    }
  }
  return "—";
};

const getBookingColumns = (bookings: RawBooking[]) => {
  const preferredKeys = [
    "id",
    "booking_id",
    "service_name",
    "service",
    "business_name",
    "business",
    "customer_name",
    "customer",
    "booking_date",
    "date",
    "start_time",
    "status",
    "total_price",
    "price",
    "created_at",
  ];

  const availableKeys = new Set(
    bookings.flatMap((booking) => Object.keys(booking)),
  );

  return preferredKeys.filter((key) => availableKeys.has(key));
};

const getBookingLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const ReportsPage = () => {
  const [activeTab, setActiveTab] =
    useState<ReportTab["id"]>("overview");
  const [filters, setFilters] = useState<ReportFilters>(getDefaultDates);
  const [bookingStatus, setBookingStatus] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");

  const [pageData, setPageData] = useState<PageData>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);
const [exportError, setExportError] = useState("");

 const requestKey = JSON.stringify({
  activeTab,
  filters,
  bookingStatus,
  bookingSearch,
  refreshVersion,
});

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        let result: PageData;

        if (activeTab === "service-bookings") {
          const response: ServiceBookingsResponse =
            await serviceBookingsApi.getBookings({
              date_from: filters.date_from,
              date_to: filters.date_to,
              status: bookingStatus as
                | "pending"
                | "accepted"
                | "declined"
                | "completed"
                | "cancelled"
                | "",
              search: bookingSearch,
              page: 1,
              page_size: 50,
            });

          result = {
            results: response.results,
            count: response.count,
          };
        } else if (isReportType(activeTab)) {
          const reportFilters: ReportFilters = {
            date_from: filters.date_from,
            date_to: filters.date_to,
            group_by: filters.group_by,
          };

          if (activeTab === "users") {
            reportFilters.role = filters.role;
            reportFilters.status = filters.status;
          }

          if (activeTab === "pets") {
            reportFilters.species = filters.species;
            reportFilters.listing_type = filters.listing_type;
            reportFilters.status = filters.status;
          }

          if (activeTab === "product-sales") {
            reportFilters.category = filters.category;
            reportFilters.business = filters.business;
          }

          if (activeTab === "pet-sales") {
            reportFilters.species = filters.species;
            reportFilters.business = filters.business;
          }

          result = await reportsApi.getReport(activeTab, reportFilters);
        } else {
          result = null;
        }

        if (!cancelled) {
          setPageData(result);
          setLoadedKey(requestKey);
          setError("");
          setErrorKey("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "We could not load this report. Please try again.",
          );
          setErrorKey(requestKey);
          setLoadedKey(requestKey);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    filters,
    bookingStatus,
    bookingSearch,
    requestKey,
  ]);

  const isLoading = loadedKey !== requestKey;
  const currentError = errorKey === requestKey ? error : "";
const handleExport = async (format: "xlsx" | "pdf") => {
  if (!isReportType(activeTab) || isLoading || currentError) return;

  setExporting(format);
  setExportError("");

  const reportFilters: ReportFilters = {
    date_from: filters.date_from,
    date_to: filters.date_to,
    group_by: filters.group_by,
  };

  if (activeTab === "users") {
    reportFilters.role = filters.role;
    reportFilters.status = filters.status;
  }

  if (activeTab === "pets") {
    reportFilters.species = filters.species;
    reportFilters.listing_type = filters.listing_type;
    reportFilters.status = filters.status;
  }

  if (activeTab === "product-sales") {
    reportFilters.category = filters.category;
    reportFilters.business = filters.business;
  }

  if (activeTab === "pet-sales") {
    reportFilters.species = filters.species;
    reportFilters.business = filters.business;
  }

  try {
    await reportsApi.exportReport(activeTab, format, reportFilters);
  } catch (err) {
    setExportError(
      err instanceof Error
        ? err.message
        : "Could not export this report. Please try again.",
    );
  } finally {
    setExporting(null);
  }
};
 const handleRefresh = () => {
  setRefreshVersion((version) => version + 1);
  setError("");
  setErrorKey("");
};

  const handleFiltersChange = (nextFilters: ReportFilters) => {
    setFilters(nextFilters);
  };

  const handleTabChange = (tab: ReportTab["id"]) => {
    setActiveTab(tab);
  };

  const isBookingTab = activeTab === "service-bookings";
  const currentReport =
    !isBookingTab && pageData && "sections" in pageData
      ? pageData
      : null;

  const currentBookings =
    isBookingTab && pageData && "results" in pageData
      ? pageData.results
      : [];

  const bookingColumns = getBookingColumns(currentBookings);

  return (
    <div className="reports-page">
      <ReportsHeader />

      <ReportsTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <ReportsFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        loading={isLoading}
      />
{!isBookingTab && (
  <div className="reports-export-actions">
    <button
      type="button"
      className="reports-export-button reports-export-excel"
      onClick={() => void handleExport("xlsx")}
      disabled={isLoading || Boolean(currentError) || exporting !== null}
    >
      {exporting === "xlsx" ? "Exporting Excel..." : "Export Excel"}
    </button>

    <button
      type="button"
      className="reports-export-button reports-export-pdf"
      onClick={() => void handleExport("pdf")}
      disabled={isLoading || Boolean(currentError) || exporting !== null}
    >
      {exporting === "pdf" ? "Exporting PDF..." : "Export PDF"}
    </button>
  </div>
)}

{exportError && (
  <div className="reports-export-error" role="alert">
    {exportError}
  </div>
)}
      {isBookingTab && (
        <div className="reports-booking-filters">
          <div className="reports-filter-field">
            <label htmlFor="reports-booking-status">Booking Status</label>
            <select
              id="reports-booking-status"
              value={bookingStatus}
              onChange={(event) => setBookingStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="reports-filter-field">
            <label htmlFor="reports-booking-search">Search bookings</label>
            <input
              id="reports-booking-search"
              type="search"
              value={bookingSearch}
              onChange={(event) => setBookingSearch(event.target.value)}
              placeholder="Search bookings..."
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="reports-loading">
          <div className="reports-loading-spinner" />
          <p>Loading report...</p>
        </div>
      )}

      {!isLoading && currentError && (
        <ReportErrorState
          message={currentError}
          onRetry={handleRefresh}
        />
      )}

      {!isLoading && !currentError && currentReport && (
        <>
          <div className="reports-generated-at">
            <span>{currentReport.title}</span>
            <span>
              Generated{" "}
              {new Date(currentReport.generated_at).toLocaleString()}
            </span>
          </div>

          <ReportSummaryCards
            items={currentReport.summary}
            currency={currentReport.currency}
          />

          {currentReport.sections.length > 0 ? (
            <div className="reports-sections">
              {currentReport.sections.map((section) => (
                <ReportTable
                  key={section.key}
                  title={section.title}
                  columns={section.columns}
                  rows={section.rows}
                  currency={currentReport.currency}
                />
              ))}
            </div>
          ) : (
            <ReportEmptyState
              title="No report sections available"
              message="There is no detailed report data available for this period."
            />
          )}
        </>
      )}

      {!isLoading &&
        !currentError &&
        isBookingTab &&
        currentBookings.length > 0 && (
          <>
            <div className="reports-generated-at">
              <span>Service Bookings</span>
              <span>{pageData && "count" in pageData ? pageData.count : 0} records</span>
            </div>

            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    {bookingColumns.map((column) => (
                      <th key={column}>{getBookingLabel(column)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentBookings.map((booking, index) => (
                    <tr key={getBookingValue(booking, ["id", "booking_id"]) !== "—"
                      ? getBookingValue(booking, ["id", "booking_id"])
                      : index}>
                      {bookingColumns.map((column) => (
                        <td key={column}>
                          {getBookingValue(booking, [column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      {!isLoading &&
        !currentError &&
        isBookingTab &&
        currentBookings.length === 0 && (
          <ReportEmptyState
            title="No service bookings found"
            message="No bookings match the selected dates and filters."
          />
        )}

      {!isLoading &&
        !currentError &&
        !isBookingTab &&
        !currentReport && (
          <ReportEmptyState
            title="No report data available"
            message="Try refreshing or adjusting your report filters."
          />
        )}
    </div>
  );
};

export default ReportsPage;
