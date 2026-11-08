import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  UserPlus,
  ShieldCheck,
  Users,
  Pencil,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  activateAdministrator,
  deactivateAdministrator,
  getAdministrators,
  getAdministrator,
  updateAdministrator,
  type AdminAccount,
} from "../../services/adminManagementApi";
import "../AdminManagement.css";

export default function AdminManagement() {
  const role =
    localStorage.getItem("pawdigree_active_role") ||
    localStorage.getItem("role") ||
    "";

  const isSystemAdmin = role.toUpperCase() === "SYSTEM_ADMIN";

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(isSystemAdmin);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await getAdministrators(page);
      setAdmins(response.results);
      setTotalCount(response.count);
      setHasNext(Boolean(response.next));
      setHasPrevious(Boolean(response.previous));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load administrator accounts.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isSystemAdmin) {
      void loadAdmins();
    }
  }, [isSystemAdmin, loadAdmins]);

  const filteredAdmins = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesSearch =
        `${admin.first_name} ${admin.last_name}`
          .toLowerCase()
          .includes(search) ||
        admin.email.toLowerCase().includes(search) ||
        admin.username.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && admin.is_active) ||
        (statusFilter === "INACTIVE" && !admin.is_active);

      return admin.role === "ADMIN" && matchesSearch && matchesStatus;
    });
  }, [admins, searchTerm, statusFilter]);

  const activeCount = admins.filter(
    (admin) => admin.role === "ADMIN" && admin.is_active,
  ).length;

  const inactiveCount = admins.filter(
    (admin) => admin.role === "ADMIN" && !admin.is_active,
  ).length;

  async function handleEdit(admin: AdminAccount) {
    setError("");
    setMessage("");

    try {
      // Retrieve the latest account details before editing.
      const details = await getAdministrator(admin.id);
      setEditingAdmin(details);
      setFirstName(details.first_name);
      setLastName(details.last_name);
      setPhone(details.phone || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load administrator.",
      );
    }
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAdmin) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateAdministrator(editingAdmin.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      });

      setEditingAdmin(null);
      setMessage("Administrator details updated successfully.");
      await loadAdmins();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update administrator.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(admin: AdminAccount) {
    const action = admin.is_active ? "deactivate" : "activate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${admin.first_name} ${admin.last_name}?`,
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      if (admin.is_active) {
        await deactivateAdministrator(admin.id);
      } else {
        await activateAdministrator(admin.id);
      }

      setMessage(`Administrator ${action}d successfully.`);
      await loadAdmins();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not ${action} administrator.`,
      );
    }
  }

  if (!isSystemAdmin) {
    return (
      <main className="admin-management-page">
        <section className="admin-card">
          <h2>Access restricted</h2>
          <p>
            Only a SYSTEM_ADMIN account can view and manage administrator
            accounts.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-management-page">
      <section className="admin-management-heading">
        <div>
          <p className="admin-management-breadcrumb">
            Admin / User Management / Admin Management
          </p>
          <h1>Admin Management</h1>
          <p className="admin-management-description">
            Manage administrator accounts and their profile information.
          </p>
        </div>

        <Link to="/adminForm" className="admin-add-button">
          <UserPlus size={18} />
          <span>Add Admin</span>
        </Link>
      </section>

      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="admin-success-message" role="status">
          {message}
        </div>
      )}

      <section className="admin-management-stats">
        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            <Users size={21} />
          </div>
          <div>
            <p>Total Administrators</p>
            <h2>{totalCount}</h2>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon active">
            <ShieldCheck size={21} />
          </div>
          <div>
            <p>Active on this page</p>
            <h2>{activeCount}</h2>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon inactive">
            <Users size={21} />
          </div>
          <div>
            <p>Inactive on this page</p>
            <h2>{inactiveCount}</h2>
          </div>
        </article>
      </section>

      <section className="admin-management-table-card">
        <div className="admin-table-heading">
          <div>
            <h2>Administrator Accounts</h2>
            <p>View and manage registered administrators.</p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => void loadAdmins()}
            disabled={loading}
          >
            <RefreshCw size={16} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="admin-table-toolbar">
          <label className="admin-management-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by name, email or username..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <select
            className="admin-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by account status"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="admin-management-table-wrapper">
          <table className="admin-management-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Date Joined</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    Loading administrator accounts...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon">
                        <Users size={27} />
                      </div>
                      <h3>No administrator accounts found</h3>
                      <p>
                        Try changing your search or status filter, or add a
                        new administrator.
                      </p>
                      <Link to="/adminForm" className="admin-empty-add-link">
                        <UserPlus size={16} />
                        Add an administrator
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div className="admin-person-cell">
                        <div className="admin-avatar">
                          {admin.first_name.charAt(0)}
                          {admin.last_name.charAt(0)}
                        </div>
                        <div>
                          <strong>
                            {admin.first_name} {admin.last_name}
                          </strong>
                          <span>{admin.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{admin.username}</td>
                    <td>{admin.phone || "—"}</td>
                    <td>
                      <span className="admin-role-label">{admin.role}</span>
                    </td>
                    <td>
                      <span
                        className={`admin-status-label ${
                          admin.is_active ? "is-active" : "is-inactive"
                        }`}
                      >
                        {admin.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {admin.date_joined
                        ? new Date(admin.date_joined).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-row-action"
                        title="Edit administrator"
                        aria-label={`Edit ${admin.first_name} ${admin.last_name}`}
                        onClick={() => void handleEdit(admin)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-row-action"
                        title={admin.is_active ? "Deactivate" : "Activate"}
                        aria-label={
                          admin.is_active
                            ? `Deactivate ${admin.username}`
                            : `Activate ${admin.username}`
                        }
                        onClick={() => void handleStatusChange(admin)}
                      >
                        {admin.is_active ? (
                          <XCircle size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-footer">
          <span>
            Showing {filteredAdmins.length} of {totalCount} administrators
          </span>

          <div className="admin-pagination">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!hasPrevious || loading}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!hasNext || loading}
              aria-label="Next page"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {editingAdmin && (
        <div className="admin-modal-backdrop">
          <section
            className="admin-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-admin-title"
          >
            <div className="admin-edit-modal-heading">
              <div>
                <h2 id="edit-admin-title">Edit Administrator</h2>
                <p>Update the administrator's profile details.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                aria-label="Close edit form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <label>
                First Name
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </label>

              <label>
                Last Name
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </label>

              <label>
                Phone
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn-save"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-cancel"
                  onClick={() => setEditingAdmin(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
