
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  UserRound,
  ShieldCheck,
  CheckCircle,
  Ban,
  AlertTriangle,
} from "lucide-react";
import {
  adminApi,
  type ManagedUser,
  type ManagedUserStatus,
} from "../../services/adminApi";
import "./UserManagement.css";

type UserListResponse = {
  results?: ManagedUser[];
  users?: ManagedUser[];
  items?: ManagedUser[];
  data?: ManagedUser[] | { results?: ManagedUser[] };
  count?: number;
  total?: number;
  next?: string | null;
  previous?: string | null;
};

const PAGE_SIZE = 10;

function getUserId(user: ManagedUser): number | string | undefined {
  return user.id ?? user.user_id;
}

function getUserName(user: ManagedUser): string {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.username || user.email || "Unnamed user";
}

function getUserStatus(user: ManagedUser): ManagedUserStatus {
  const value = String(
    user.status ?? user.account_status ?? ""
  ).toLowerCase();

  if (value === "suspended") return "suspended";
  if (value === "deactivated" || value === "inactive") {
    return "deactivated";
  }
  if (value === "active") return "active";

  if (user.is_active === false) return "deactivated";

  return "active";
}

function normalizeUsers(payload: unknown): {
  users: ManagedUser[];
  count: number;
  hasNext: boolean;
} {
  if (Array.isArray(payload)) {
    return {
      users: payload as ManagedUser[],
      count: payload.length,
      hasNext: false,
    };
  }

  if (!payload || typeof payload !== "object") {
    return { users: [], count: 0, hasNext: false };
  }

  const response = payload as UserListResponse;

  let users =
    response.results ??
    response.users ??
    response.items ??
    [];

  if (users.length === 0 && Array.isArray(response.data)) {
    users = response.data;
  } else if (
    users.length === 0 &&
    response.data &&
    !Array.isArray(response.data)
  ) {
    users = response.data.results ?? [];
  }

  return {
    users,
    count: response.count ?? response.total ?? users.length,
    hasNext: Boolean(response.next),
  };
}

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminApi.getUsers({
        search: search.trim() || undefined,
        role: role || undefined,
        status: (status || undefined) as ManagedUserStatus | undefined,
        page,
        page_size: PAGE_SIZE,
      });

      const normalized = normalizeUsers(response);

      setUsers(normalized.users);
      setTotal(normalized.count);
      setHasNext(normalized.hasNext);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [search, role, status, page]);

 useEffect(() => {
  void Promise.resolve().then(() => loadUsers());
}, [loadUsers]);
  const changeUserStatus = async (
    user: ManagedUser,
    action: "activate" | "deactivate" | "suspend"
  ) => {
    const userId = getUserId(user);

    if (userId === undefined) {
      setError("This user does not have a valid ID.");
      return;
    }

    const name = getUserName(user);

    if (action === "suspend") {
      const reason = window.prompt(
        `Enter the reason for suspending ${name}:`
      );

      if (reason === null) return;

      if (!reason.trim()) {
        setError("A suspension reason is required.");
        return;
      }

      if (!window.confirm(`Suspend ${name}?`)) return;

      try {
        setError("");
        setSuccess("");
        await adminApi.suspendUser(userId, reason.trim());
        setSuccess(`${name} has been suspended.`);
        await loadUsers();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to suspend this user."
        );
      }

      return;
    }

    const actionLabel =
      action === "activate" ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${actionLabel} ${name}?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      if (action === "activate") {
        await adminApi.activateUser(userId);
      } else {
        await adminApi.deactivateUser(userId);
      }

      setSuccess(
        `${name} has been ${action === "activate" ? "activated" : "deactivated"}.`
      );

      await loadUsers();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : `Unable to ${actionLabel} this user.`
      );
    }
  };

  const updateFilter = (
    filter: "search" | "role" | "status",
    value: string
  ) => {
    setPage(1);

    if (filter === "search") setSearch(value);
    if (filter === "role") setRole(value);
    if (filter === "status") setStatus(value);
  };

  return (
    <main className="user-management-page">
      <header className="user-management-header">
        <div>
          <p className="user-management-eyebrow">PLATFORM ADMINISTRATION</p>
          <h1>User Management</h1>
          <p className="user-management-description">
            View registered users and manage their platform access.
          </p>
        </div>

        <button
          type="button"
          className="user-management-refresh"
          onClick={() => void loadUsers()}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <section className="user-management-summary">
        <div className="user-management-summary-icon">
          <UserRound size={22} />
        </div>
        <div>
          <span>Users on this page</span>
          <strong>{loading ? "—" : users.length}</strong>
        </div>

        <div className="user-management-summary-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <span>Total matching users</span>
          <strong>{loading ? "—" : total}</strong>
        </div>
      </section>

      {error && (
        <div className="user-management-alert user-management-error">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="user-management-alert user-management-success">
          <CheckCircle size={18} />
          {success}
          <button type="button" onClick={() => setSuccess("")}>
            Dismiss
          </button>
        </div>
      )}

      <section className="user-management-panel">
        <div className="user-management-toolbar">
          <label className="user-management-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by name, username or email..."
              value={search}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
            />
          </label>

          <select
            aria-label="Filter by role"
            value={role}
            onChange={(event) => updateFilter("role", event.target.value)}
          >
            <option value="">All roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="VENDOR">Vendor</option>
            <option value="ADMIN">Admin</option>
            <option value="SYSTEM_ADMIN">System Admin</option>
          </select>

          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="user-management-table-wrap">
          <table className="user-management-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Account actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="user-management-empty">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="user-management-empty">
                    No users found. Try changing your search or filters.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const currentStatus = getUserStatus(user);
                  const id = getUserId(user);

                  return (
                    <tr key={id ?? `user-${index}`}>
                      <td>
                        <div className="user-management-name">
                          <span className="user-management-avatar">
                            {getUserName(user).charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>{getUserName(user)}</strong>
                            <small>{user.username || "Registered user"}</small>
                          </div>
                        </div>
                      </td>

                      <td>{user.email || "—"}</td>

                      <td>
                        <span className="user-management-role">
                          {user.role || "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`user-management-status status-${currentStatus}`}
                        >
                          {currentStatus}
                        </span>
                      </td>

                      <td>
                        <div className="user-management-actions">
                          {currentStatus !== "active" && (
                            <button
                              type="button"
                              className="user-action-button action-activate"
                              onClick={() =>
                                void changeUserStatus(user, "activate")
                              }
                            >
                              <CheckCircle size={15} />
                              Activate
                            </button>
                          )}

                          {currentStatus === "active" && (
                            <button
                              type="button"
                              className="user-action-button action-deactivate"
                              onClick={() =>
                                void changeUserStatus(user, "deactivate")
                              }
                            >
                              <Ban size={15} />
                              Deactivate
                            </button>
                          )}

                          {currentStatus !== "suspended" && (
                            <button
                              type="button"
                              className="user-action-button action-suspend"
                              onClick={() =>
                                void changeUserStatus(user, "suspend")
                              }
                            >
                              <AlertTriangle size={15} />
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="user-management-pagination">
          <span>
            Page {page}
            {total > 0 ? ` · ${total} matching users` : ""}
          </span>

          <div>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>

            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
