
import { ArrowLeft, Bell, Menu, LogOut } from "lucide-react";
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
}: Props) => (
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

      <button
        className="admin-topbar-icon has-dot"
        aria-label="Notifications"
      >
        <Bell size={18} />
      </button>

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
export default AdminTopbar;
