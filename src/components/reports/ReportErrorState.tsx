
import { AlertCircle, RefreshCw } from "lucide-react";
import "./Reports.css";

interface ReportErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const ReportErrorState = ({
  message,
  onRetry,
}: ReportErrorStateProps) => {
  return (
    <div className="report-state report-error-state" role="alert">
      <div className="report-state-icon">
        <AlertCircle size={28} />
      </div>

      <h2>Unable to load report</h2>
      <p>{message}</p>

      {onRetry && (
        <button
          type="button"
          className="reports-refresh-button"
          onClick={onRetry}
        >
          <RefreshCw size={16} />
          Try again
        </button>
      )}
    </div>
  );
};

export default ReportErrorState;
