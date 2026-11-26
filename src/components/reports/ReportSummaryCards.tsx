
import type { ReportSummaryItem } from "../../services/reportsApi";
import "./Reports.css";

interface ReportSummaryCardsProps {
  items: ReportSummaryItem[];
  currency?: string;
}

const formatValue = (
  item: ReportSummaryItem,
  currency?: string,
): string => {
  const value = item.value;

  if (item.format === "money") {
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

  if (item.format === "percent") {
    return `${value}%`;
  }

  if (item.format === "count") {
    const amount = Number(value);

    return Number.isFinite(amount)
      ? new Intl.NumberFormat("en-UG").format(amount)
      : String(value);
  }

  return String(value);
};

const ReportSummaryCards = ({
  items,
  currency,
}: ReportSummaryCardsProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="report-summary-grid" aria-label="Report summary">
      {items.map((item) => (
        <article className="report-summary-card" key={item.key}>
          <p className="report-summary-label">{item.label}</p>
          <h2 className="report-summary-value">
            {formatValue(item, currency)}
          </h2>
        </article>
      ))}
    </section>
  );
};

export default ReportSummaryCards;
