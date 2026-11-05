const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://pawdigree-bckd.onrender.com")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export type ApiRecord = Record<string, unknown>;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = "ApiError"; this.status = status; }
}

function getAccessToken() { return localStorage.getItem("access") || localStorage.getItem("accessToken") || ""; }

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipAuth = false, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  if (requestOptions.body && !(requestOptions.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (skipAuth) headers.delete("Authorization");
  else if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  const endpointPath = path.startsWith("/") ? path : `/${path}`;
  try { response = await fetch(`${API_BASE_URL}/api${endpointPath}`, { ...requestOptions, headers }); }
  catch { throw new ApiError("Could not connect to the server. Check the API URL and try again.", 0); }
  if (!response.ok) {
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
