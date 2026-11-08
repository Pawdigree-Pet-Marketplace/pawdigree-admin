import { apiRequest } from "./api";

export interface AdminAccount {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

export interface AdminListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminAccount[];
}

export interface CreateAdminPayload {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface UpdateAdminPayload {
  first_name: string;
  last_name: string;
  phone: string;
}

const ADMIN_ENDPOINT = "/admin/administrators/";

function requireSystemAdmin() {
  const role =
    localStorage.getItem("pawdigree_active_role") ||
    localStorage.getItem("role");

  if (role?.toUpperCase() !== "SYSTEM_ADMIN") {
    throw new Error(
      "Only a SYSTEM_ADMIN account can manage administrators.",
    );
  }
}

export async function getAdministrators(
  page = 1,
): Promise<AdminListResponse> {
  requireSystemAdmin();

  return apiRequest<AdminListResponse>(
    `${ADMIN_ENDPOINT}?page=${page}`,
  );
}

export async function getAdministrator(
  id: number,
): Promise<AdminAccount> {
  requireSystemAdmin();

  return apiRequest<AdminAccount>(`${ADMIN_ENDPOINT}${id}/`);
}

export async function createAdministrator(
  payload: CreateAdminPayload,
): Promise<AdminAccount> {
  requireSystemAdmin();

  return apiRequest<AdminAccount>(ADMIN_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdministrator(
  id: number,
  payload: UpdateAdminPayload,
): Promise<AdminAccount> {
  requireSystemAdmin();

  return apiRequest<AdminAccount>(`${ADMIN_ENDPOINT}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function activateAdministrator(
  id: number,
): Promise<unknown> {
  requireSystemAdmin();

  return apiRequest(`${ADMIN_ENDPOINT}${id}/activate/`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function deactivateAdministrator(
  id: number,
): Promise<unknown> {
  requireSystemAdmin();

  return apiRequest(`${ADMIN_ENDPOINT}${id}/deactivate/`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}