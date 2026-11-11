import { apiRequest } from "./api";

interface MessageResponse {
  detail: string;
}

export function setAdminPassword(token: string, newPassword: string) {
  return apiRequest<MessageResponse>("/auth/admin/set-password/", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export function requestAdminPasswordReset(email: string) {
  return apiRequest<MessageResponse>("/auth/password-reset/request/", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email: email.trim() }),
  });
}

export function confirmAdminPasswordReset(uid: string, token: string, newPassword: string) {
  return apiRequest<MessageResponse>("/auth/password-reset/confirm/", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ uid, token, new_password: newPassword }),
  });
}

export function changeAdminPassword(currentPassword: string, newPassword: string) {
  return apiRequest<MessageResponse>("/auth/change-password/", {
    method: "POST",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

export function clearStoredAdminCredentials() {
  for (const key of ["access", "refresh", "accessToken", "refreshToken", "token", "role", "pawdigree_active_role"]) {
    localStorage.removeItem(key);
  }
}
