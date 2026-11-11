export const ADMIN_ROLE = "ADMIN";
export const SUPER_ADMIN_ROLE = "SYSTEM_ADMIN";
export const activeRoleStorageKey = "pawdigree_active_role";

export type AdminRole = typeof ADMIN_ROLE | typeof SUPER_ADMIN_ROLE;

export function getActiveAdminRole(): AdminRole | null {
  const role =
    localStorage.getItem(activeRoleStorageKey) || localStorage.getItem("role");
  const normalized = role?.toUpperCase();

  return normalized === ADMIN_ROLE || normalized === SUPER_ADMIN_ROLE
    ? normalized
    : null;
}

export function isSuperAdmin(): boolean {
  return getActiveAdminRole() === SUPER_ADMIN_ROLE;
}
