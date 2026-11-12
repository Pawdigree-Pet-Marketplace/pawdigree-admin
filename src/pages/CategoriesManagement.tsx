import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Search, Pencil, Trash2, X, RefreshCw, Layers } from "lucide-react";
import { adminApi, type Category, type CategoryKind } from "../services/adminApi";
import { ApiError } from "../services/api";
import "./AdminManagement.css";

const messageFor = (error: unknown) => error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
const kindLabels: Record<CategoryKind, string> = {
  general: "General",
  pets: "Pets",
  merchandise: "Merchandise",
  services: "Services",
};

export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<CategoryKind | "all">("all");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<CategoryKind>("general");
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<Category["id"] | null>(null);

  const load = useCallback(async () => {
    try {
      setCategories(await adminApi.getCategories());
      setError("");
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    adminApi.getCategories()
      .then((items) => { if (mounted) { setCategories(items); setError(""); } })
      .catch((cause: unknown) => { if (mounted) setError(messageFor(cause)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const startCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setKind("general");
    setCreating(true);
  };
  const startEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description || "");
    setKind(category.kind);
    setCreating(true);
  };
  const closeForm = () => { setCreating(false); setEditing(null); };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = { name: name.trim(), description: description.trim(), kind };
      if (editing) await adminApi.updateCategory(editing.id, data);
      else await adminApi.createCategory(data);
      closeForm();
      setLoading(true);
      await load();
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setSaving(false);
    }
  };

  const changeActiveState = async (category: Category) => {
    const action = category.is_active ? "Deactivate" : "Activate";
    if (!window.confirm(`${action} “${category.name}”?`)) return;
    setWorkingId(category.id);
    setError("");
    try {
      if (category.is_active) await adminApi.deactivateCategory(category.id);
      else await adminApi.activateCategory(category.id);
      setLoading(true);
      await load();
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setWorkingId(null);
    }
  };

  const visible = useMemo(() => categories.filter((category) => {
    const matchesSearch = `${category.name} ${category.description || ""}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesSearch && (kindFilter === "all" || category.kind === kindFilter);
  }), [categories, kindFilter, query]);

  return <section className="management-page">
    <div className="management-intro">
      <div><span className="management-eyebrow">LISTINGS</span><h2>Category Management</h2><p>Manage the marketplace categories vendors can select.</p></div>
      <button className="management-primary" type="button" onClick={startCreate}><Plus size={17} /> Add category</button>
    </div>
    {error && <div className="management-alert" role="alert">{error}</div>}
    <div className="management-toolbar">
      <div className="management-search"><Search size={17} /><input aria-label="Search categories" placeholder="Search categories" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <label className="management-filter">Kind
        <select aria-label="Filter categories by kind" value={kindFilter} onChange={(event) => setKindFilter(event.target.value as CategoryKind | "all")}>
          <option value="all">All kinds</option>
          {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <button className="management-icon-button" type="button" onClick={() => { setLoading(true); setError(""); void load(); }} aria-label="Refresh categories"><RefreshCw size={17} /></button>
      <span className="management-count">{categories.length} categories</span>
    </div>
    <div className="management-card">
      {loading ? <div className="management-state" role="status">Loading categories…</div> : visible.length === 0 ? <div className="management-state"><Layers size={26} /><strong>{query || kindFilter !== "all" ? "No matching categories" : "No categories yet"}</strong><span>{query || kindFilter !== "all" ? "Try another search or kind." : "Add a category to get started."}</span></div> :
        <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Category</th><th>Kind</th><th>Description</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{visible.map((category) => <tr key={category.id}>
          <td className="management-name">{category.name}</td><td>{kindLabels[category.kind]}</td><td className="management-description">{category.description || "—"}</td>
          <td><span className={`management-status ${category.is_active ? "is-active" : "is-inactive"}`}>{category.is_active ? "Active" : "Inactive"}</span></td>
          <td><div className="management-actions"><button type="button" className="management-icon-button" onClick={() => startEdit(category)} aria-label={`Edit ${category.name}`}><Pencil size={16} /></button><button type="button" className={`management-icon-button${category.is_active ? " danger" : ""}`} disabled={workingId === category.id} onClick={() => void changeActiveState(category)} aria-label={`${category.is_active ? "Deactivate" : "Activate"} ${category.name}`}>{category.is_active ? <Trash2 size={16} /> : <RefreshCw size={16} />}</button></div></td>
        </tr>)}</tbody></table></div>}
    </div>
    {creating && <div className="management-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) closeForm(); }}><form className="management-modal" onSubmit={save}>
      <div className="management-modal-head"><div><span className="management-eyebrow">CATEGORY DETAILS</span><h3>{editing ? "Edit category" : "Add category"}</h3></div><button type="button" className="management-icon-button" onClick={closeForm} aria-label="Close" disabled={saving}><X size={19} /></button></div>
      <label>Category name<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Grooming" /></label>
      <label>Kind<select aria-label="Category kind" required value={kind} onChange={(event) => setKind(event.target.value as CategoryKind)}>{Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Description <span className="optional-label">(optional)</span><textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What belongs in this category?" /></label>
      {error && <div className="management-alert" role="alert">{error}</div>}
      <div className="management-modal-actions"><button className="management-secondary" type="button" onClick={closeForm} disabled={saving}>Cancel</button><button className="management-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create category"}</button></div>
    </form></div>}
  </section>;
}
