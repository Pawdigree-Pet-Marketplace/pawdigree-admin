import { useEffect } from "react";
import { Link } from "react-router-dom";
import lightLogo from "../../assets/logos/lightmode-logo.svg";
import {
  LayoutDashboard, Users, Flag, BadgeCheck, PawPrint, ShoppingBag,
  ConciergeBell, Layers, ShoppingCart, MessageCircleWarning, BarChart3,
  ClipboardList, ClipboardCheck, Bell, UserRound, Settings, X, PanelLeftClose,
} from "lucide-react";
import "./AdminSidebar.css";

const NAV = [
  { title: "DASHBOARD", items: [{ label: "Dashboard", path: "/admin", Icon: LayoutDashboard }] },
  { title: "USER MANAGEMENT", items: [
    { label: "Users & Moderation", path: "/admin/users", Icon: Users },
    { label: "Flagged Accounts", path: "/admin/flagged", Icon: Flag },
  ] },
  { title: "VENDOR MANAGEMENT", items: [{ label: "Vendor Verification", path: "/admin/vendors", Icon: BadgeCheck }] },
  { title: "LISTINGS", items: [
    { label: "Pet Listings", path: "/admin/listings/pets", Icon: PawPrint },
    { label: "Approval Queue", path: "/admin/listings/approval", Icon: ClipboardCheck },
    { label: "Merch Listings", path: "/admin/listings/merch", Icon: ShoppingBag },
    { label: "Services Listings", path: "/admin/listings/services", Icon: ConciergeBell },
    { label: "Vendor Categories", path: "/admin/listings/categories", Icon: Layers },
  ] },
  { title: "COMMERCE & SUPPORT", items: [
    { label: "Orders & Payments", path: "/admin/orders", Icon: ShoppingCart },
    { label: "Support & Disputes", path: "/admin/support", Icon: MessageCircleWarning },
  ] },
  { title: "SYSTEM", items: [
    { label: "Reports & Analytics", path: "/admin/reports", Icon: BarChart3 },
    { label: "Audit Logs", path: "/admin/audit", Icon: ClipboardList },
    { label: "Notifications", path: "/admin/notifications", Icon: Bell },
    { label: "Admin Profile", path: "/admin/profile", Icon: UserRound },
    { label: "Settings", path: "/admin/settings", Icon: Settings },
  ] },
];

export const AdminSidebar = ({ isOpen, onClose, currentPath = "/admin", isCollapsed = false, onToggleCollapse }: { isOpen: boolean; onClose: () => void; currentPath?: string; isCollapsed?: boolean; onToggleCollapse: () => void }) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = previousOverflow;
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);
  return <>
    <div className={`admin-sidebar-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
    <aside className={`admin-sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "is-collapsed" : ""}`}>
      <div className="admin-sidebar-head">
        <Link to="/admin" className="admin-sidebar-brand" onClick={onClose} aria-label="Pawdigree dashboard">
          <img src={lightLogo} alt="Pawdigree" className="admin-logo-img" />
        </Link>
        <button className="admin-sidebar-collapse" onClick={onToggleCollapse} aria-expanded={!isCollapsed} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}><PanelLeftClose size={18} /></button>
        <button className="admin-sidebar-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
      </div>
      <nav className="admin-sidebar-nav" aria-label="Admin navigation">{NAV.map((group) => <div key={group.title} className="admin-sidebar-group"><p className="admin-sidebar-group-title">{group.title}</p>{group.items.map(({ label, path, Icon }) => <Link key={path} to={path} onClick={onClose} title={isCollapsed ? label : undefined} className={`admin-sidebar-link ${currentPath === path || (path === "/admin" && ["/", "/dashboard", "/admin/dashboard"].includes(currentPath)) ? "active" : ""}`} aria-current={currentPath === path ? "page" : undefined}><Icon size={18} /><span>{label}</span></Link>)}</div>)}</nav>
      <div className="admin-sidebar-foot"><span>© Admin v1.2</span><span>•</span><span>PAWDIGREE</span></div>
    </aside>
  </>;
};
