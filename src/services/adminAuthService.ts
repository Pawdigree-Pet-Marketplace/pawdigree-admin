
import { apiRequest } from "./api";

interface AdminLoginResponse {
  email?: string;
  access?: string;
  refresh?: string;
  access_token?: string;
  refresh_token?: string;
}

export interface AdminAuthTokens {
  access: string;
  refresh: string;
}

export async function adminLogin(
  email: string,
  password: string
): Promise<AdminAuthTokens> {
  const data = await apiRequest<AdminLoginResponse>(
    "/auth/login/admin/",
    {
      method: "POST",
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    }
  );

  const access = data.access || data.access_token;
  const refresh = data.refresh || data.refresh_token;

  if (!access || !refresh) {
    throw new Error(
      "Login response did not contain the expected authentication tokens."
    );
  }

  return { access, refresh };
}
