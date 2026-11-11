import { Link } from "react-router-dom";
import { LayoutDashboard, Store, Layers, ShieldCheck } from "lucide-react";
import { isSuperAdmin } from "../../services/adminRoles";
import "./AdminBottomNav.css";

export const AdminBottomNav = ({ currentPath = "/admin" }: { currentPath?: string }) => {
  const items = [
    { label: "Dashboard", path: "/admin/dashboard", Icon: LayoutDashboard },
    { label: "Vendors", path: "/admin/vendors", Icon: Store },
    { label: "Categories", path: "/admin/listings/categories", Icon: Layers },
    ...(isSuperAdmin() ? [{ label: "Admins", path: "/admin/management", Icon: ShieldCheck }] : []),
  ];
  return <div className="admin-bottom-wrapper"><nav className="admin-bottom-nav" aria-label="Admin navigation">{items.map(({ label, path, Icon }) => <Link key={path} to={path} className={`admin-bottom-link ${currentPath === path || (path === "/admin" && ["/", "/dashboard", "/admin/dashboard"].includes(currentPath)) ? "active" : ""}`} aria-current={currentPath === path ? "page" : undefined}><Icon size={20} strokeWidth={currentPath === path ? 2.5 : 1.8} /><span>{label}</span></Link>)}</nav></div>;
};
