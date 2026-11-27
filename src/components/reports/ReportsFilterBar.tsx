import { RefreshCw } from "lucide-react";
import type { ReportFilters, ReportGroupBy } from "../../services/reportsApi";
import "./Reports.css";

interface ReportsFilterBarProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onRefresh: () => void;
  loading: boolean;
}

const ReportsFilterBar = ({
  filters,
  onFiltersChange,
  onRefresh,
  loading,
}: ReportsFilterBarProps) => {
  const handleDateChange = (
    field: "date_from" | "date_to",
    value: string,
  ) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleGroupChange = (value: ReportGroupBy) => {
    onFiltersChange({
      ...filters,
      group_by: value,
    });
  };

  return (
    <div className="reports-filter-bar">
      <div className="reports-filter-group">
        <div className="reports-filter-field">
          <label htmlFor="report-date-from">From</label>
          <input
            id="report-date-from"
            type="date"
            value={filters.date_from ?? ""}
            onChange={(event) =>
              handleDateChange("date_from", event.target.value)
            }
          />
        </div>

        <div className="reports-filter-field">
          <label htmlFor="report-date-to">To</label>
          <input
            id="report-date-to"
            type="date"
            value={filters.date_to ?? ""}
            onChange={(event) =>
              handleDateChange("date_to", event.target.value)
            }
          />
        </div>

        <div className="reports-filter-field">
          <label htmlFor="report-group-by">Group by</label>
          <select
            id="report-group-by"
            value={filters.group_by ?? "day"}
            onChange={(event) =>
              handleGroupChange(event.target.value as ReportGroupBy)
            }
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        className="reports-refresh-button"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw size={16} className={loading ? "spinning" : ""} />
        {loading ? "Refreshing..." : "Refresh Report"}
      </button>
    </div>
  );
};

export default ReportsFilterBar;