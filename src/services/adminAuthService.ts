
import { apiRequest } from "./api";

interface AdminLoginResponse {
  access?: string;
  refresh?: string;
  access_token?: string;
  refresh_token?: string;
  email?: string;
  role?: string;
  user?: {
    email?: string;
    role?: string;
  };
}

export interface AdminAuthTokens {
  access: string;
  refresh: string;
  role: string;
}

export async function adminLogin(
  email: string,
  password: string,
): Promise<AdminAuthTokens> {
  const data = await apiRequest<AdminLoginResponse>(
    "/auth/login/admin/",
    {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    },
  );

  const access = data.access || data.access_token;
  const refresh = data.refresh || data.refresh_token;
  const role = data.role || data.user?.role;

  if (!access || !refresh) {
    throw new Error(
      "The server response did not contain the expected authentication tokens.",
    );
  }

  if (!role) {
    throw new Error(
      "The server did not return an administrator role. Please check the login response.",
    );
  }

  const normalizedRole = role.toUpperCase();

  if (!["ADMIN", "SYSTEM_ADMIN"].includes(normalizedRole)) {
    throw new Error(
      "This account does not have administrator access.",
    );
  }

  return {
    access,
    refresh,
    role: normalizedRole,
  };
}
