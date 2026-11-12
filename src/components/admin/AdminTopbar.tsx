import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Menu, LogOut } from "lucide-react";
import { adminApi } from "../../services/adminApi";
import "./AdminTopbar.css";

interface Props {
  onMenuClick: () => void;
  onLogout: () => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  roleLabel?: string;
}

const AdminTopbar = ({
  onMenuClick,
  onLogout,
  title = "Dashboard Overview",
  showBack = false,
  onBack,
  roleLabel = "Admin",
}: Props) => {
  const [unread, setUnread] = useState(0);
  const refreshUnread = useCallback(() => {
    void adminApi.getUnreadNotificationCount().then((result) => setUnread(result.unread)).catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshUnread();
    window.addEventListener("focus", refreshUnread);
    window.addEventListener("admin-notifications-updated", refreshUnread);
    return () => {
      window.removeEventListener("focus", refreshUnread);
      window.removeEventListener("admin-notifications-updated", refreshUnread);
    };
  }, [refreshUnread]);

  return (
  <header className="admin-topbar">
    <div className="admin-topbar-left">
      <button
        className="admin-topbar-hamburger"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {showBack && (
        <button className="admin-topbar-back" onClick={onBack}>
          <ArrowLeft size={18} /> <span>Back</span>
        </button>
      )}

      <div className="admin-topbar-titles"><h1 className="page-title">{title}</h1></div>
    </div>

    <div className="admin-topbar-right">
      <span className="admin-topbar-badge"><span className="admin-topbar-status-dot" />{roleLabel}</span>

      <Link to="/admin/notifications" className="admin-topbar-icon" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} title="Notifications">
        <Bell size={18} />{unread > 0 && <span className="admin-notification-badge">{unread > 99 ? "99+" : unread}</span>}
      </Link>

      <button
        className="admin-topbar-icon"
        onClick={onLogout}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut size={18} />
      </button>
    </div>
  </header>
  );
};
export default AdminTopbar;
