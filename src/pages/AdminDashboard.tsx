import { Link } from "react-router-dom";
import {
  Users,
  Store,
  ShieldCheck,
  Flag,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import "./AdminDashboard.css";

//to do (this is a mock display), replace with admin api when the backend is ready
const data = {
  stats: [
    {
      label: "Total Users",
      value: "24,318",
      trend: "4.2%",
      up: true,
      icon: Users,
    },
    {
      label: "Active Vendors",
      value: "1,204",
      trend: "2.1%",
      up: true,
      icon: Store,
    },
    {
      label: "Pending Verifications",
      value: "38",
      trend: "6 new",
      up: false,
      icon: ShieldCheck,
    },
    {
      label: "Flagged Listings",
      value: "12",
      trend: "3 today",
      up: false,
      icon: Flag,
    },
    {
      label: "Today's Orders",
      value: "286",
      trend: "8.4%",
      up: true,
      icon: ShoppingBag,
    },
    {
      label: "Total Revenue",
      value: "UGX 42.6M",
      trend: "5.7%",
      up: true,
      icon: Wallet,
    },
  ],
  orders: [
    { d: "Mon", v: 110 },
    { d: "Tue", v: 62 },
    { d: "Wed", v: 175 },
    { d: "Thu", v: 135 },
    { d: "Fri", v: 68 },
    { d: "Sat", v: 195 },
    { d: "Sun", v: 138 },
  ],
  revenue: [
    { d: "Mon", v: 72 },
    { d: "Tue", v: 32 },
    { d: "Wed", v: 48 },
    { d: "Thu", v: 65 },
    { d: "Fri", v: 82 },
    { d: "Sat", v: 38 },
    { d: "Sun", v: 68 },
  ],
  flagged: [
    { user: "Grace N.", reason: "Spam listings", severity: "High" },
    { user: "Tom O.", reason: "Fake reviews", severity: "Med" },
    { user: "Ivan K.", reason: "Abusive msgs", severity: "High" },
    { user: "Ruth A.", reason: "Duplicate acct", severity: "Low" },
  ],
  pending: [
    {
      business: "Kololo Pet Clinic",
      category: "Services",
      submitted: "2 days ago",
    },
    {
      business: "Furry Friends Shop",
      category: "Merch",
      submitted: "1 day ago",
    },
    { business: "Nakawa Kennels", category: "Pets", submitted: "3 hrs ago" },
    {
      business: "VetCare Bugolobi",
      category: "Services",
      submitted: "5 hrs ago",
    },
  ],
};

export const AdminDashboard = () => {
  const maxOrder = Math.max(...data.orders.map((o) => o.v));
  const maxRev = Math.max(...data.revenue.map((r) => r.v));

  // Revenue axes padding so line fits inside card
  const W = 320;
  const H = 180;
  const padL = 28;
  const padB = 24;
  const padT = 12;
  const padR = 4;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const revPoints = data.revenue
    .map((r, i) => {
      const x = padL + (i / (data.revenue.length - 1)) * chartW;
      const y = padT + (1 - r.v / maxRev) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="dash-page">
      <div className="dash-stats-grid">
        {data.stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="dash-stat-card">
              <div className="dash-stat-dot">
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <div className="dash-stat-label">{s.label}</div>
              <div className="dash-stat-value">{s.value}</div>
              <div className={`dash-stat-trend ${s.up ? "up" : "down"}`}>
                {s.up ? "▲" : "▼"} {s.trend}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dash-charts-grid">
        {/* ORDERS - BAR WITH AXES */}
        <div className="dash-card">
          <div className="dash-card-title">Orders over time</div>
          <div className="dash-chart-wrap">
            <div className="dash-y-axis">
              <span>{maxOrder}</span>
              <span>{Math.round(maxOrder * 0.75)}</span>
              <span>{Math.round(maxOrder * 0.5)}</span>
              <span>{Math.round(maxOrder * 0.25)}</span>
              <span>0</span>
            </div>
            <div className="dash-bars-axis-wrap">
              <div className="dash-grid-lines">
                <div className="dash-grid-line" />
                <div className="dash-grid-line" />
                <div className="dash-grid-line" />
                <div className="dash-grid-line" />
                <div className="dash-grid-line solid" />
              </div>
              <div className="dash-bars">
                {data.orders.map((o, i) => (
                  <div key={i} className="dash-bar-col">
                    <div className="dash-bar-value">{o.v}</div>
                    <div
                      className={`dash-bar ${i === 1 || i === 4 ? "coral" : ""}`}
                      style={{ height: `${(o.v / maxOrder) * 100}%` }}
                    />
                    <span className="dash-bar-label">{o.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* REVENUE - LINE WITH AXES */}
        <div className="dash-card">
          <div className="dash-card-title">Revenue over time</div>
          <div className="dash-line-wrap">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="dash-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <line
                x1={padL}
                y1={padT}
                x2={W - padR}
                y2={padT}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <line
                x1={padL}
                y1={padT + chartH * 0.25}
                x2={W - padR}
                y2={padT + chartH * 0.25}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <line
                x1={padL}
                y1={padT + chartH * 0.5}
                x2={W - padR}
                y2={padT + chartH * 0.5}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <line
                x1={padL}
                y1={padT + chartH * 0.75}
                x2={W - padR}
                y2={padT + chartH * 0.75}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <line
                x1={padL}
                y1={padT + chartH}
                x2={W - padR}
                y2={padT + chartH}
                stroke="var(--charcoal)"
                strokeWidth="1"
                opacity={0.2}
              />
              <line
                x1={padL}
                y1={padT}
                x2={padL}
                y2={padT + chartH}
                stroke="var(--charcoal)"
                strokeWidth="1"
                opacity={0.2}
              />
              <polyline
                fill="none"
                stroke="var(--coral)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={revPoints}
              />
              {data.revenue.map((r, i) => {
                const x = padL + (i / (data.revenue.length - 1)) * chartW;
                const y = padT + (1 - r.v / maxRev) * chartH;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="var(--coral)"
                    stroke="var(--white)"
                    strokeWidth="2"
                  />
                );
              })}
              {data.revenue.map((r, i) => {
                const x = padL + (i / (data.revenue.length - 1)) * chartW;
                return (
                  <text
                    key={i}
                    x={x}
                    y={H - 2}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="var(--gray)"
                    fontFamily="var(--font-body)"
                    fontWeight="600"
                  >
                    {r.d}
                  </text>
                );
              })}
              <text
                x={2}
                y={padT + 4}
                fontSize="9"
                fill="var(--gray)"
                fontFamily="var(--font-body)"
              >
                {maxRev}
              </text>
              <text
                x={2}
                y={padT + chartH * 0.25 + 4}
                fontSize="9"
                fill="var(--gray)"
                fontFamily="var(--font-body)"
              >
                {Math.round(maxRev * 0.75)}
              </text>
              <text
                x={2}
                y={padT + chartH * 0.5 + 4}
                fontSize="9"
                fill="var(--gray)"
                fontFamily="var(--font-body)"
              >
                {Math.round(maxRev * 0.5)}
              </text>
              <text
                x={2}
                y={padT + chartH + 4}
                fontSize="9"
                fill="var(--gray)"
                fontFamily="var(--font-body)"
              >
                0
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="dash-tables-grid">
        <div className="dash-table-block">
          <div className="dash-table-header">
            <h4>Recent Flagged Accounts</h4>
            <Link to="/admin/flagged">View all ›</Link>
          </div>
          <div className="dash-card dash-table">
            <div className="dash-tr dash-tr-head">
              <span>USER</span>
              <span>REASON</span>
              <span>SEVERITY</span>
            </div>
            {data.flagged.map((r, i) => (
              <div key={i} className="dash-tr">
                <span className="dash-cell">{r.user}</span>
                <span className="dash-cell">{r.reason}</span>
                <span className="dash-cell dash-sev">{r.severity}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="dash-table-block">
          <div className="dash-table-header">
            <h4>Pending Vendor Approvals</h4>
            <Link to="/admin/vendors">View all ›</Link>
          </div>
          <div className="dash-card dash-table">
            <div className="dash-tr dash-tr-head dash-tr-vendor">
              <span>BUSINESS</span>
              <span>CATEGORY</span>
              <span>SUBMITTED</span>
            </div>
            {data.pending.map((r, i) => (
              <div key={i} className="dash-tr dash-tr-vendor">
                <span className="dash-cell">{r.business}</span>
                <span className="dash-cell">{r.category}</span>
                <span className="dash-cell">{r.submitted}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-footer">© Admin v1.2 | Last sync: 2m ago</div>
    </div>
  );
};
