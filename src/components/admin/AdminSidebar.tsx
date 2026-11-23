import { useEffect } from "react";
import { Link } from "react-router-dom";
import lightLogo from "../../assets/logos/lightmode-logo.svg";
import {
  BadgeCheck, Banknote, Bell, CalendarDays, ChartNoAxesCombined,
  ClipboardCheck, ClipboardList, Flag, LayoutDashboard, Layers,
  MessageCircle, PawPrint, Settings, Shield, ShoppingBag,
  ShoppingCart, Store, UserRound, Users, Wrench, X, PanelLeftClose,
} from "lucide-react";
import { isSuperAdmin } from "../../services/adminRoles";
import "./AdminSidebar.css";

const ADMIN_NAV = [
  { title: "OVERVIEW", items: [{ label: "Dashboard", path: "/admin/dashboard", Icon: LayoutDashboard }] },
  { title: "USER MANAGEMENT", items: [
    
    { label: "Customers", path: "/admin/customers", Icon: Users },
    { label: "Vendors", path: "/admin/vendors/list", Icon: Store },
    { label: "Vendor Applications", path: "/admin/vendors", Icon: BadgeCheck },
  ] },
  { title: "MARKETPLACE MANAGEMENT", items: [
    { label: "Pet Listings", path: "/admin/listings/pets", Icon: PawPrint },
    { label: "Merchandise", path: "/admin/listings/merch", Icon: ShoppingBag },
    { label: "Services", path: "/admin/listings/services", Icon: Wrench },
    { label: "Categories", path: "/admin/listings/categories", Icon: Layers },
    { label: "Listing Approvals", path: "/admin/listings/approval", Icon: ClipboardCheck },
  ] },
  { title: "MARKETPLACE OPERATIONS", items: [
    { label: "Adoption Applications", path: "/admin/adoptions", Icon: PawPrint },
    { label: "Bookings", path: "/admin/bookings", Icon: CalendarDays },
    { label: "Orders", path: "/admin/orders", Icon: ShoppingCart },
    { label: "Payments & Transactions", path: "/admin/payments", Icon: Banknote },
  ] },
  { title: "TRUST & SUPPORT", items: [
    { label: "Reviews & Reports", path: "/admin/reviews", Icon: Flag },
    { label: "Customer Support", path: "/admin/support", Icon: MessageCircle },
  ] },
  { title: "INSIGHTS", items: [{ label: "Reports & Analytics", path: "/admin/reports", Icon: ChartNoAxesCombined }] },
  { title: "PERSONAL", items: [
    { label: "Notifications", path: "/admin/notifications", Icon: Bell },
    { label: "My Profile", path: "/admin/profile", Icon: UserRound },
    { label: "Security", path: "/admin/settings/security", Icon: Settings },
  ] },
];

const SUPER_ADMIN_NAV = [
  { title: "PLATFORM ADMINISTRATION", items: [
    { label: "Admin Management", path: "/admin/management", Icon: Users },
    { label: "Roles & Permissions", path: "/admin/roles", Icon: Shield },
    { label: "Audit Logs", path: "/admin/audit", Icon: ClipboardList },
  ] },
  { title: "SYSTEM", items: [
    { label: "System Settings", path: "/admin/system-settings", Icon: Settings },
    { label: "Platform Configuration", path: "/admin/configuration", Icon: Wrench },
  ] },
];

type NavItem = { label: string; path: string; Icon: typeof LayoutDashboard };

export const AdminSidebar = ({ isOpen, onClose, currentPath = "/admin", isCollapsed = false, onToggleCollapse }: { isOpen: boolean; onClose: () => void; currentPath?: string; isCollapsed?: boolean; onToggleCollapse: () => void }) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = previousOverflow;
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  const nav = isSuperAdmin()
  ? [
      ...ADMIN_NAV.map((group) =>
        group.title === "USER MANAGEMENT"
          ? {
              ...group,
              items: [
                ...group.items,
                {
                  label: "Users",
                  path: "/admin/users",
                  Icon: Users,
                },
              ],
            }
          : group
      ),
      ...SUPER_ADMIN_NAV,
    ]
  : ADMIN_NAV;
  const isActive = (path: string) => currentPath === path ||
    (path === "/admin/vendors" && currentPath === "/admin/vendor-applications") ||
    (path === "/admin/dashboard" && ["/", "/dashboard", "/admin"].includes(currentPath));

  return <>
    <div className={`admin-sidebar-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
    <aside className={`admin-sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "is-collapsed" : ""}`}>
      <div className="admin-sidebar-head">
        <Link to="/admin/dashboard" className="admin-sidebar-brand" onClick={onClose} aria-label="Pawdigree dashboard">
          <img src={lightLogo} alt="Pawdigree" className="admin-logo-img" />
        </Link>
        <button className="admin-sidebar-collapse" onClick={onToggleCollapse} aria-expanded={!isCollapsed} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}><PanelLeftClose size={18} /></button>
        <button className="admin-sidebar-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
      </div>
      <nav className="admin-sidebar-nav" aria-label="Admin navigation">{nav.map((group) => <div key={group.title} className="admin-sidebar-group"><p className="admin-sidebar-group-title">{group.title}</p>{group.items.map(({ label, path, Icon }: NavItem) => <Link key={`${group.title}-${label}`} to={path} onClick={onClose} title={isCollapsed ? label : undefined} className={`admin-sidebar-link ${isActive(path) ? "active" : ""}`} aria-current={currentPath === path ? "page" : undefined}><Icon size={18} /><span>{label}</span></Link>)}</div>)}</nav>
      <div className="admin-sidebar-foot"><span>© Admin v1.2</span><span>•</span><span>PAWDIGREE</span></div>
    </aside>
  </>;
};
