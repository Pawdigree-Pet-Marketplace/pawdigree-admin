import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  PawPrint,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import {
  reportsApi,
  type ReportGroupBy,
  type ReportResponse,
  type ReportRow,
} from "../../services/reportsApi";

import "./AnalyticsPage.css";

interface AnalyticsFilters {
  date_from: string;
  date_to: string;
  group_by: ReportGroupBy;
}

const getLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDefaultFilters = (): AnalyticsFilters => {
  const today = new Date();
  const startDate = new Date(today);

  startDate.setDate(today.getDate() - 29);

  return {
    date_from: getLocalDate(startDate),
    date_to: getLocalDate(today),
    group_by: "day",
  };
};

const formatCount = (value: string | number) =>
  Number(value || 0).toLocaleString("en-UG");

const formatMoney = (value: string | number, currency = "UGX") => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatSummaryValue = (
  value: string | number,
  format?: string,
  currency = "UGX",
) => {
  if (format === "money") {
    return formatMoney(value, currency);
  }

  if (format === "count") {
    return formatCount(value);
  }

  return String(value);
};

interface MetricCardProps {
  label: string;
  value: string;
 icon: ReactNode;
  description: string;
  variant: string;
}

function MetricCard({
  label,
  value,
  icon,
  description,
  variant,
}: MetricCardProps) {
  return (
    <article className={`analytics-metric-card ${variant}`}>
      <div className="analytics-metric-top">
        <span className="analytics-metric-label">{label}</span>
        <span className="analytics-metric-icon">{icon}</span>
      </div>

      <div className="analytics-metric-value">{value}</div>

      <p className="analytics-metric-description">{description}</p>
    </article>
  );
}

interface TrendChartProps {
  title: string;
  description: string;
  rows: ReportRow[];
  firstKey: string;
  secondKey: string;
  firstLabel: string;
  secondLabel: string;
  firstColor: string;
  secondColor: string;
  money?: boolean;
  currency?: string;
}

function TrendChart({
  title,
  description,
  rows,
  firstKey,
  secondKey,
  firstLabel,
  secondLabel,
  firstColor,
  secondColor,
  money = false,
  currency = "UGX",
}: TrendChartProps) {
  const chartWidth = 900;
  const chartHeight = 250;
  const chartTop = 15;
  const chartBottom = 215;
  const chartLeft = 12;
  const chartRight = 888;

  const firstValues = rows.map((row) =>
    Number(row[firstKey] ?? 0),
  );

  const secondValues = rows.map((row) =>
    Number(row[secondKey] ?? 0),
  );

  const maximum = Math.max(
    ...firstValues,
    ...secondValues,
    1,
  );

  const getPoints = (values: number[]) =>
    values
      .map((value, index) => {
        const x =
          rows.length <= 1
            ? chartWidth / 2
            : chartLeft +
              (index / (rows.length - 1)) *
                (chartRight - chartLeft);

        const y =
          chartBottom -
          (value / maximum) * (chartBottom - chartTop);

        return `${x},${y}`;
      })
      .join(" ");

  const dateLabels = useMemo(() => {
    if (rows.length === 0) return [];

    const indexes = [
      0,
      Math.floor((rows.length - 1) / 2),
      rows.length - 1,
    ];

    return [...new Set(indexes)].map((index) => ({
      index,
      label: String(rows[index].period ?? ""),
    }));
  }, [rows]);

  const displayValue = (value: number) =>
    money
      ? formatMoney(value, currency)
      : formatCount(value);

  return (
    <section className="analytics-chart-card">
      <div className="analytics-chart-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <TrendingUp size={21} />
      </div>

      <div className="analytics-chart-legend">
        <span>
          <i style={{ backgroundColor: firstColor }} />
          {firstLabel}
        </span>

        <span>
          <i style={{ backgroundColor: secondColor }} />
          {secondLabel}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="analytics-chart-empty">
          No trend data is available for this period.
        </div>
      ) : (
        <>
          <div className="analytics-chart-area">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label={`${title} trend chart`}
              preserveAspectRatio="none"
            >
              {[0, 1, 2, 3, 4].map((line) => {
                const y =
                  chartTop +
                  (line / 4) * (chartBottom - chartTop);

                return (
                  <line
                    key={line}
                    x1={chartLeft}
                    y1={y}
                    x2={chartRight}
                    y2={y}
                    className="analytics-chart-gridline"
                  />
                );
              })}

              <polyline
                points={getPoints(firstValues)}
                fill="none"
                stroke={firstColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <polyline
                points={getPoints(secondValues)}
                fill="none"
                stroke={secondColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {firstValues.map((value, index) => {
                const x =
                  rows.length <= 1
                    ? chartWidth / 2
                    : chartLeft +
                      (index / (rows.length - 1)) *
                        (chartRight - chartLeft);

                const y =
                  chartBottom -
                  (value / maximum) *
                    (chartBottom - chartTop);

                return (
                  <circle
                    key={`first-${index}`}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={firstColor}
                  >
                    <title>
                      {rows[index].period}: {firstLabel}{" "}
                      {displayValue(value)}
                    </title>
                  </circle>
                );
              })}

              {secondValues.map((value, index) => {
                const x =
                  rows.length <= 1
                    ? chartWidth / 2
                    : chartLeft +
                      (index / (rows.length - 1)) *
                        (chartRight - chartLeft);

                const y =
                  chartBottom -
                  (value / maximum) *
                    (chartBottom - chartTop);

                return (
                  <circle
                    key={`second-${index}`}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={secondColor}
                  >
                    <title>
                      {rows[index].period}: {secondLabel}{" "}
                      {displayValue(value)}
                    </title>
                  </circle>
                );
              })}
            </svg>
          </div>

          <div className="analytics-chart-dates">
            {dateLabels.map(({ index, label }) => (
              <span key={index}>{label}</span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(
    getDefaultFilters,
  );

  const [report, setReport] = useState<ReportResponse | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    reportsApi
      .getReport("overview", filters)
      .then((response) => {
        if (!cancelled) {
          setReport(response);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load platform analytics.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const summary = report?.summary ?? [];

  const trendRows = useMemo(() => {
    return (
      report?.sections.find(
        (section) => section.key === "trend",
      )?.rows ?? []
    );
  }, [report]);

  const cards = [
    {
      key: "new_users",
      icon: <Users size={21} />,
      description: "New accounts registered",
      variant: "teal",
    },
    {
      key: "listings",
      icon: <PawPrint size={21} />,
      description: "New pet listings created",
      variant: "coral",
    },
    {
      key: "applications",
      icon: <ClipboardList size={21} />,
      description: "Adoption applications received",
      variant: "purple",
    },
    {
      key: "product_orders",
      icon: <ShoppingBag size={21} />,
      description: "Product orders placed",
      variant: "blue",
    },
    {
      key: "product_net_sales",
      icon: <Wallet size={21} />,
      description: "Product net sales",
      variant: "neutral",
    },
    {
      key: "pet_orders",
      icon: <PawPrint size={21} />,
      description: "Pet sale orders placed",
      variant: "coral",
    },
    {
      key: "pet_net_sales",
      icon: <TrendingUp size={21} />,
      description: "Pet net sales",
      variant: "teal",
    },
  ];

  const handleFilterChange = (
    key: keyof AnalyticsFilters,
    value: string,
  ) => {
    setLoading(true);
    setError("");

    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleRefresh = () => {
    setLoading(true);
    setError("");

    setFilters((previous) => ({ ...previous }));
  };

  const currency = report?.currency ?? "UGX";

  return (
    <div className="analytics-page">
      <div className="analytics-page-header">
        <div>
          <span className="analytics-eyebrow">
            PLATFORM INSIGHTS
          </span>
          <h1>Analytics</h1>
          <p>
            Get a visual overview of activity and performance
            across Pawdigree.
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "analytics-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      <section className="analytics-filter-panel">
        <div className="analytics-filter-title">
          <CalendarDays size={19} />
          <span>Reporting period</span>
        </div>

        <div className="analytics-filter-controls">
          <label>
            From
            <input
              type="date"
              value={filters.date_from}
              max={filters.date_to}
              onChange={(event) =>
                handleFilterChange(
                  "date_from",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={filters.date_to}
              min={filters.date_from}
              onChange={(event) =>
                handleFilterChange(
                  "date_to",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Group trends by
            <select
              value={filters.group_by}
              onChange={(event) =>
                handleFilterChange(
                  "group_by",
                  event.target.value,
                )
              }
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div className="analytics-error">
          <AlertCircle size={20} />
          <div>
            <strong>We couldn't load analytics.</strong>
            <p>{error}</p>
            <span>
              Check your connection and administrator login,
              then try refreshing.
            </span>
          </div>
        </div>
      )}

      {loading && !report ? (
        <div className="analytics-loading">
          <RefreshCw size={24} className="analytics-spinning" />
          <p>Loading platform analytics...</p>
        </div>
      ) : (
        <>
          <div className="analytics-section-heading">
            <div>
              <h2>Platform overview</h2>
              <p>
                Key figures for the selected reporting period
              </p>
            </div>

            {report && (
              <span className="analytics-period-label">
                {report.filters.date_from as string} –{" "}
                {report.filters.date_to as string}
              </span>
            )}
          </div>

          {report && (
            <div className="analytics-metrics-grid">
              {cards.map((card) => {
                const item = summary.find(
                  (entry) => entry.key === card.key,
                );

                return (
                  <MetricCard
                    key={card.key}
                    label={item?.label ?? card.key}
                    value={
                      item
                        ? formatSummaryValue(
                            item.value,
                            item.format,
                            currency,
                          )
                        : "—"
                    }
                    icon={card.icon}
                    description={card.description}
                    variant={card.variant}
                  />
                );
              })}
            </div>
          )}

          <div className="analytics-section-heading analytics-trends-heading">
            <div>
              <h2>Platform trends</h2>
              <p>
                Follow user growth, listings and sales over time
              </p>
            </div>
          </div>

          {report && (
            <div className="analytics-charts-grid">
              <TrendChart
                title="User and listing activity"
                description="Daily new users compared with new pet listings"
                rows={trendRows}
                firstKey="new_users"
                secondKey="new_listings"
                firstLabel="New users"
                secondLabel="New listings"
                firstColor="#216C68"
                secondColor="#FB8665"
              />

              <TrendChart
                title="Sales performance"
                description="Product and pet net sales over time"
                rows={trendRows}
                firstKey="product_sales"
                secondKey="pet_sales"
                firstLabel="Product sales"
                secondLabel="Pet sales"
                firstColor="#216C68"
                secondColor="#FB8665"
                money
                currency={currency}
              />
            </div>
          )}

          {loading && report && (
            <p className="analytics-updating">
              Updating analytics...
            </p>
          )}

          {report && (
            <p className="analytics-generated">
              Report generated:{" "}
              {new Date(report.generated_at).toLocaleString(
                "en-UG",
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}