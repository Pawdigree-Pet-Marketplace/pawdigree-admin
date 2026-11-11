const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://142.93.86.141:8000")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export type ApiRecord = Record<string, unknown>;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function tokenType(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    return (JSON.parse(decoded) as { token_type?: string }).token_type ?? null;
  } catch {
    return null;
  }
}

function getAccessToken(): string {
  const candidates = [
    localStorage.getItem("access"),
    localStorage.getItem("accessToken"),
    localStorage.getItem("token"),
  ].filter((value): value is string => Boolean(value));

  const typedAccess = candidates.find((token) => tokenType(token) === "access");
  if (typedAccess) return typedAccess;

  // Keep compatibility with older clients and tests that used opaque tokens,
  // while never sending a JWT explicitly marked as a refresh token as a Bearer token.
  return candidates.find((token) => tokenType(token) === null && token !== localStorage.getItem("token")) ?? "";
}

let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const storedRefresh = [
      localStorage.getItem("refresh"),
      localStorage.getItem("refreshToken"),
      localStorage.getItem("access"),
      localStorage.getItem("accessToken"),
      localStorage.getItem("token"),
    ].filter((value): value is string => Boolean(value));
    const refresh = storedRefresh.find((token) => tokenType(token) === "refresh");
    if (!refresh) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) return null;

      const tokens = await response.json() as { access?: string; refresh?: string };
      if (!tokens.access || tokenType(tokens.access) !== "access") return null;

      localStorage.setItem("access", tokens.access);
      if (tokens.refresh) localStorage.setItem("refresh", tokens.refresh);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token");
      return tokens.access;
    } catch {
      return null;
    }
  })().finally(() => { refreshInFlight = null; });

  return refreshInFlight;
}

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function fetchApiResponse(path: string, options: RequestInit, token: string): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  else headers.delete("Authorization");
  const endpointPath = path.startsWith("/") ? path : `/${path}`;

  try {
    return await fetch(`${API_BASE_URL}/api${endpointPath}`, { ...options, headers });
  } catch {
    throw new ApiError("Could not connect to the server. Check the API URL and try again.", 0);
  }
}

async function throwApiError(response: Response): Promise<never> {
  let message = `Request failed (${response.status}).`;
  try {
    const payload = await response.json() as unknown;
    if (typeof payload === "string") message = payload;
    else if (payload && typeof payload === "object") {
      const data = payload as ApiRecord;
      message = String(data.detail || data.message || Object.values(data).flatMap((value) => Array.isArray(value) ? value : [value]).find((value) => typeof value === "string") || message);
    }
  } catch { /* Keep the status-based message when the response is not JSON. */ }
  throw new ApiError(message, response.status);
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipAuth = false, ...requestOptions } = options;
  let token = skipAuth ? "" : getAccessToken();

  if (!skipAuth && !token) token = await refreshAccessToken() ?? "";
  let response = await fetchApiResponse(path, requestOptions, token);

  // A short-lived access token may expire while the admin is reviewing a queue.
  // Refresh once and retry the original request with the newly issued access token.
  if (!skipAuth && response.status === 401 && token) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken && refreshedToken !== token) {
      token = refreshedToken;
      response = await fetchApiResponse(path, requestOptions, token);
    }
  }

  if (!response.ok) await throwApiError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const data = payload as ApiRecord;
    for (const key of ["results", "items", "data", "categories", "pets"]) if (Array.isArray(data[key])) return data[key] as T[];
  }
  return [];
}
