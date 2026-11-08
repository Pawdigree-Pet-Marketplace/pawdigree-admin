import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import lightLogo from "../../assets/logos/lightmode-logo.svg";
import {
  LayoutDashboard,
  Users,
  Flag,
  BadgeCheck,
  PawPrint,
  ShoppingBag,
  ConciergeBell,
  Layers,
  ShoppingCart,
  MessageCircleWarning,
  BarChart3,
  ClipboardList,
  ClipboardCheck,
  Bell,
  UserRound,
  Settings,
  X,
} from "lucide-react";
import "./AdminSidebar.css";

const NAV = [
  {
    title: "DASHBOARD",
    items: [{ label: "Dashboard", path: "/admin", Icon: LayoutDashboard }],
  },
  {
    title: "USER MANAGEMENT",
    items: [
      { label: "Users & Moderation", path: "/admin/users", Icon: Users },
      { label: "Flagged Accounts", path: "/admin/flagged", Icon: Flag },
    ],
  },
  {
    title: "VENDOR MANAGEMENT",
    items: [
      {
        label: "Vendor Verification",
        path: "/admin/vendors",
        Icon: BadgeCheck,
      },
    ],
  },
  {
    title: "LISTINGS",
    items: [
      { label: "Pet Listings", path: "/admin/listings/pets", Icon: PawPrint },
      { label: "Approval Queue", path: "/admin/listings/approval", Icon: ClipboardCheck },
      {
        label: "Merch Listings",
        path: "/admin/listings/merch",
        Icon: ShoppingBag,
      },
      {
        label: "Services Listings",
        path: "/admin/listings/services",
        Icon: ConciergeBell,
      },
      {
        label: "Vendor Categories",
        path: "/admin/listings/categories",
        Icon: Layers,
      },
    ],
  },
  {
    title: "COMMERCE & SUPPORT",
    items: [
      { label: "Orders & Payments", path: "/admin/orders", Icon: ShoppingCart },
      {
        label: "Support & Disputes",
        path: "/admin/support",
        Icon: MessageCircleWarning,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Reports & Analytics", path: "/admin/reports", Icon: BarChart3 },
      { label: "Audit Logs", path: "/admin/audit", Icon: ClipboardList },
      { label: "Notifications", path: "/admin/notifications", Icon: Bell },
      { label: "Admin Profile", path: "/admin/profile", Icon: UserRound },
      {
        label: "Settings",
        path: "/admin/settings",
        Icon: Settings,
      },
    ],
  },
];

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const AdminSidebar = ({
  isOpen,
  onClose,
  currentPath = "/admin",
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
}) => {
  const [lastSync] = useState<Date>(() => new Date());
  const [, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div
        className={`admin-sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />
      <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
        <div className="admin-sidebar-head">
          <Link to="/admin" className="admin-sidebar-brand">
            <img
              src={lightLogo}
              alt="Pawdigree"
              className="admin-logo-img"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </Link>
          <button className="admin-sidebar-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <nav className="admin-sidebar-nav">
          {NAV.map((g) => (
            <div key={g.title} className="admin-sidebar-group">
              <p className="admin-sidebar-group-title">{g.title}</p>
              {g.items.map(({ label, path, Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`admin-sidebar-link ${currentPath === path ? "active" : ""}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <span>© Admin v1.2</span>
          <span>•</span>
          <span>Last sync: {timeAgo(lastSync)}</span>
        </div>
      </aside>
    </>
  );
};
