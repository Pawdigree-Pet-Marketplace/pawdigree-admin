import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { adminApi, type AdminNotification } from "../services/adminApi";
import { ApiError } from "../services/api";
import "./auth/AdminManagement.css";

export function AdminNotificationsPage() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [response, count] = await Promise.all([
        adminApi.getMyNotifications(page), adminApi.getUnreadNotificationCount(),
      ]);
      setItems(response.results);
      setHasNext(Boolean(response.next));
      setHasPrevious(Boolean(response.previous));
      setUnread(count.unread);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function markRead(item: AdminNotification) {
    try {
      await adminApi.markNotificationRead(item.notification_id);
      setItems((current) => current.map((notice) => notice.notification_id === item.notification_id ? { ...notice, is_read: true } : notice));
      setUnread((count) => Math.max(0, count - 1));
      window.dispatchEvent(new Event("admin-notifications-updated"));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not mark this notification as read.");
    }
  }

  async function markAllRead() {
    try {
      await adminApi.markAllNotificationsRead();
      setItems((current) => current.map((notice) => ({ ...notice, is_read: true })));
      setUnread(0);
      window.dispatchEvent(new Event("admin-notifications-updated"));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not mark notifications as read.");
    }
  }

  return <main className="admin-management-page">
    <section className="admin-management-heading"><div><p className="admin-management-breadcrumb">Admin / Personal</p><h1>Notifications</h1><p className="admin-management-description">Your account has {unread} unread notifications.</p></div><div className="admin-notification-actions"><button type="button" className="admin-refresh-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> {loading ? "Loading…" : "Refresh"}</button><button type="button" className="admin-refresh-button" onClick={() => void markAllRead()} disabled={unread === 0}><CheckCheck size={16} /> Mark all read</button></div></section>
    {error && <div className="login-error" role="alert">{error}</div>}
    <section className="admin-management-table-card"><div className="admin-table-heading"><div><h2>Recent notifications</h2><p>These are notifications for the signed-in account only.</p></div></div>
      {loading ? <div className="admin-notification-state">Loading notifications…</div> : items.length === 0 ? <div className="admin-notification-state"><Bell size={24} /><strong>No notifications</strong></div> : <ul className="admin-notification-list">{items.map((item) => <li key={item.notification_id} className={item.is_read ? "is-read" : "is-unread"}><div><span className="admin-notification-type">{item.type.replaceAll("_", " ")}</span><p>{item.message}</p><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>{item.type === "LISTING_PENDING" && item.reference_id != null && <Link to="/admin/listings/pets" onClick={() => { if (!item.is_read) void markRead(item); }}>Open listing queue</Link>}</div>{!item.is_read && <button type="button" className="admin-refresh-button" onClick={() => void markRead(item)}>Mark read</button>}</li>)}</ul>}
      <div className="admin-table-footer admin-directory-footer"><span>Page {page}</span><div className="admin-pagination"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={!hasPrevious || loading}><ChevronLeft size={17} />Previous</button><button type="button" onClick={() => setPage((value) => value + 1)} disabled={!hasNext || loading}>Next<ChevronRight size={17} /></button></div></div>
    </section>
  </main>;
}
