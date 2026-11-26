
import type {
  ReportColumn,
  ReportRow,
} from "../../services/reportsApi";
import "./Reports.css";

interface ReportTableProps {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  currency?: string;
}

const formatCellValue = (
  value: string | number | null,
  column: ReportColumn,
  currency?: string,
): string => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (column.format === "money") {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return String(value);
    }

    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: currency || "UGX",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (column.format === "count") {
    const amount = Number(value);

    return Number.isFinite(amount)
      ? new Intl.NumberFormat("en-UG").format(amount)
      : String(value);
  }

  if (column.format === "percent") {
    return `${value}%`;
  }

  return String(value);
};

const ReportTable = ({
  title,
  columns,
  rows,
  currency,
}: ReportTableProps) => {
  return (
    <section className="report-table-section">
      <div className="report-section-heading">
        <h2>{title}</h2>
        <span>{rows.length} records</span>
      </div>

      {columns.length === 0 ? (
        <p className="report-table-empty">No columns are available.</p>
      ) : (
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} scope="col">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="report-table-empty">
                    No records found for this period.
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => (
                  <tr key={`${title}-${rowIndex}`}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {formatCellValue(
                          row[column.key] ?? null,
                          column,
                          currency,
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ReportTable;
