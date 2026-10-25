import { apiRequest, type ApiRecord, unwrapList } from "./api";

export interface Category extends ApiRecord { id: number | string; name: string; description?: string; is_active?: boolean; active?: boolean; }
export interface PendingPet extends ApiRecord { id: number | string; name?: string; species?: string; breed?: string; age?: string | number; price?: string | number; created_at?: string; }

export const adminApi = {
  async getCategories() { return unwrapList<Category>(await apiRequest<unknown>("/categories/")); },
  createCategory(data: { name: string; description: string }) { return apiRequest<Category>("/categories/", { method: "POST", body: JSON.stringify(data) }); },
  updateCategory(id: Category["id"], data: { name: string; description: string }) { return apiRequest<Category>(`/categories/${id}/`, { method: "PATCH", body: JSON.stringify(data) }); },
  deactivateCategory(id: Category["id"]) { return apiRequest<void>(`/categories/${id}/`, { method: "DELETE" }); },
  async getPendingPets() { return unwrapList<PendingPet>(await apiRequest<unknown>("/pets/admin/pending/")); },
  approvePet(id: PendingPet["id"]) { return apiRequest<unknown>(`/pets/admin/${id}/approve/`, { method: "POST" }); },
  rejectPet(id: PendingPet["id"], reason: string) { return apiRequest<unknown>(`/pets/admin/${id}/reject/`, { method: "POST", body: JSON.stringify({ reason }) }); },
};
