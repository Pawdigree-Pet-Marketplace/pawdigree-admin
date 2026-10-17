import { LayoutDashboard, Users, Store, Settings } from "lucide-react";
import "./AdminBottomNav.css";

export const AdminBottomNav = ({
  currentPath = "/admin",
}: {
  currentPath?: string;
}) => {
  const items = [
    { label: "Dashboard", path: "/admin", Icon: LayoutDashboard },
    { label: "Users", path: "/admin/users", Icon: Users },
    { label: "Vendors", path: "/admin/vendors", Icon: Store },
    { label: "Settings", path: "/admin/settings", Icon: Settings },
  ];
  return (
    <div className="admin-bottom-wrapper">
      <nav className="admin-bottom-nav">
        {items.map(({ label, path, Icon }) => (
          <a
            key={path}
            href={path}
            className={`admin-bottom-link ${currentPath === path ? "active" : ""}`}
          >
            <Icon size={20} strokeWidth={currentPath === path ? 2.5 : 1.8} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};
