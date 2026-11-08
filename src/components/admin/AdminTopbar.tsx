import { ArrowLeft, Bell, Menu } from "lucide-react";
import "./AdminTopbar.css";

interface Props {
  onMenuClick: () => void;
  title?: string;
  breadcrumb?: string;
  showBack?: boolean;
  onBack?: () => void;
  avatarUrl?: string; // optional - will use default if not provided
}

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=Super+Admin&background=E6F2F0&color=2A7F6F&bold=true";

const AdminTopbar = ({
  onMenuClick,
<<<<<<< Updated upstream
  title = "Dashboard Overview",
  breadcrumb = "Admin / Dashboard",
  showBack = false,
=======
  onLogout,
  title,
  breadcrumb,
  showBack,
>>>>>>> Stashed changes
  onBack,
  avatarUrl,
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
      <div className="admin-topbar-titles">
        <span className="crumb">{breadcrumb}</span>
        <h1 className="page-title">{title}</h1>
      </div>
    </div>
    <div className="admin-topbar-right">
      <span className="admin-topbar-badge">Super Admin</span>
      <button className="admin-topbar-icon has-dot" aria-label="Notifications">
        <Bell size={18} />
      </button>
      <button className="admin-topbar-profile" aria-label="Profile">
        <img
          src={avatarUrl || DEFAULT_AVATAR}
          alt="Admin avatar"
          className="admin-topbar-avatar"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
          }}
        />
      </button>
    </div>
  </header>
);
export default AdminTopbar;