import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Search, Pencil, Trash2, X, RefreshCw, Layers } from "lucide-react";
import { adminApi, type Category } from "../../services/adminApi";
import { ApiError } from "../../services/api";
import "./AdminManagement.css";

const messageFor = (error: unknown) => error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
const isActive = (category: Category) => category.is_active ?? category.active ?? true;

export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setCategories(await adminApi.getCategories()); setError(""); } catch (cause) { setError(messageFor(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let mounted = true;
    adminApi.getCategories().then((items) => { if (mounted) { setCategories(items); setError(""); } }).catch((cause: unknown) => { if (mounted) setError(messageFor(cause)); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const startCreate = () => { setEditing(null); setName(""); setDescription(""); setCreating(true); };
  const startEdit = (category: Category) => { setEditing(category); setName(category.name || ""); setDescription(String(category.description || "")); setCreating(true); };
  const closeForm = () => { setCreating(false); setEditing(null); };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const data = { name: name.trim(), description: description.trim() };
      if (editing) await adminApi.updateCategory(editing.id, data); else await adminApi.createCategory(data);
      closeForm(); await load();
    } catch (cause) { setError(messageFor(cause)); } finally { setSaving(false); }
  };
  const deactivate = async (category: Category) => {
    if (!window.confirm(`Deactivate “${category.name}”?`)) return;
    try { await adminApi.deactivateCategory(category.id); await load(); } catch (cause) { setError(messageFor(cause)); }
  };
  const visible = categories.filter((category) => `${category.name} ${category.description || ""}`.toLowerCase().includes(query.toLowerCase()));

  return <section className="management-page">
    <div className="management-intro"><div><span className="management-eyebrow">LISTINGS</span><h2>Vendor Categories</h2><p>Organize the categories vendors can use for their listings.</p></div>
      <button className="management-primary" onClick={startCreate}><Plus size={17} /> Add category</button></div>
    {error && <div className="management-alert" role="alert">{error}</div>}
    <div className="management-toolbar"><div className="management-search"><Search size={17} /><input aria-label="Search categories" placeholder="Search categories" value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="management-icon-button" onClick={() => { setLoading(true); setError(""); void load(); }} aria-label="Refresh categories"><RefreshCw size={17} /></button><span className="management-count">{categories.length} categories</span></div>
    <div className="management-card">
      {loading ? <div className="management-state">Loading categories…</div> : visible.length === 0 ? <div className="management-state"><Layers size={26} /><strong>{query ? "No matching categories" : "No categories yet"}</strong><span>{query ? "Try another search." : "Add a category to get started."}</span></div> :
      <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Category</th><th>Description</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{visible.map((category) => <tr key={category.id}><td className="management-name">{category.name}</td><td className="management-description">{category.description || "—"}</td><td><span className={`management-status ${isActive(category) ? "is-active" : "is-inactive"}`}>{isActive(category) ? "Active" : "Inactive"}</span></td><td><div className="management-actions"><button className="management-icon-button" onClick={() => startEdit(category)} aria-label={`Edit ${category.name}`}><Pencil size={16} /></button>{isActive(category) && <button className="management-icon-button danger" onClick={() => void deactivate(category)} aria-label={`Deactivate ${category.name}`}><Trash2 size={16} /></button>}</div></td></tr>)}</tbody></table></div>}
    </div>
    {creating && <div className="management-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><form className="management-modal" onSubmit={save}><div className="management-modal-head"><div><span className="management-eyebrow">CATEGORY DETAILS</span><h3>{editing ? "Edit category" : "Add category"}</h3></div><button type="button" className="management-icon-button" onClick={closeForm} aria-label="Close"><X size={19} /></button></div><label>Category name<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Grooming" /></label><label>Description <span className="optional-label">(optional)</span><textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What belongs in this category?" /></label>{error && <div className="management-alert" role="alert">{error}</div>}<div className="management-modal-actions"><button className="management-secondary" type="button" onClick={closeForm}>Cancel</button><button className="management-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create category"}</button></div></form></div>}
  </section>;
}




