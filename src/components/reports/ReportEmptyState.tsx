
import { FileSearch } from "lucide-react";
import "./Reports.css";

interface ReportEmptyStateProps {
  title?: string;
  message?: string;
}

const ReportEmptyState = ({
  title = "No report data available",
  message = "Try adjusting your date range or filters to see results.",
}: ReportEmptyStateProps) => {
  return (
    <div className="report-state">
      <div className="report-state-icon">
        <FileSearch size={28} />
      </div>

      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
};

export default ReportEmptyState;
