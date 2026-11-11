import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, unwrapList } from "../services/api";
import { adminLogin } from "../services/adminAuthService";
import { adminApi } from "../services/adminApi";
import {
  changeAdminPassword,
  confirmAdminPasswordReset,
  requestAdminPasswordReset,
  setAdminPassword,
} from "../services/adminPasswordService";

const fetchPath = (callIndex: number) =>
  new URL(String(vi.mocked(fetch).mock.calls[callIndex][0])).pathname;

describe("apiRequest", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("constructs the API URL, sends JSON and bearer auth, and parses a response", async () => {
    localStorage.setItem("access", "test-token");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await expect(
      apiRequest("/categories/", {
        method: "POST",
        body: JSON.stringify({ name: "Dogs" }),
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/api/categories/");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer test-token",
    );
    expect(new Headers(init?.headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("supports accessToken and paths without a leading slash", async () => {
    localStorage.setItem("accessToken", "fallback-token");
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 200 }));

    await apiRequest("categories/");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/api/categories/");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer fallback-token",
    );
  });

  it("normalizes a configured API URL that already includes the /api prefix", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test/api///");
    vi.resetModules();
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 200 }));

    const { apiRequest: configuredApiRequest } =
      await import("../services/api");
    await configuredApiRequest("/categories/");

    expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe(
      "https://api.example.test/api/categories/",
    );
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("sends the admin login request to the Django auth route through the shared helper", async () => {
    localStorage.setItem("access", "stale-refresh-or-invalid-token");
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          access: "access-token",
          refresh: "refresh-token",
          role: "ADMIN",
        }),
        { status: 200 },
      ),
    );

    await expect(
      adminLogin(" admin@example.test ", "password"),
    ).resolves.toEqual({
      access: "access-token",
      refresh: "refresh-token",
      role: "ADMIN",
    });
   
const [url, init] = vi.mocked(fetch).mock.calls[0];

    expect(new URL(String(url)).pathname).toBe("/api/auth/login/admin/");

    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      email: "admin@example.test",
      password: "password",
    });
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });

  it("returns undefined for 204 and extracts server error messages", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(apiRequest("/categories/1/")).resolves.toBeUndefined();

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not allowed" }), { status: 403 }),
    );
    await expect(apiRequest("/categories/")).rejects.toMatchObject({
      name: "ApiError",
      message: "Not allowed",
      status: 403,
    });
  });

  it("connects marketplace product moderation and adoption decisions to backend routes", async () => {
    localStorage.setItem("access", "admin-token");
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "APPROVED" }), { status: 200 }));

    await expect(adminApi.getMerchandise()).resolves.toEqual([]);
    await adminApi.decideAdoptionApplication("application-id", "APPROVED", "Reviewed");

    expect(fetchPath(0)).toBe("/api/products/");
    const [decisionUrl, decisionInit] = vi.mocked(fetch).mock.calls[1];
    expect(new URL(String(decisionUrl)).pathname).toBe("/api/adoptions/applications/application-id/decision/");
    expect(decisionInit?.method).toBe("PATCH");
    expect(JSON.parse(String(decisionInit?.body))).toEqual({ status: "APPROVED", decision_reason: "Reviewed" });
  });

  it("uses the backend's account-scoped notification and profile routes", async () => {
    localStorage.setItem("access", "admin-token");
    vi.mocked(fetch).mockImplementation(async () => new Response(JSON.stringify({ unread: 0, results: [] }), { status: 200 }));

    await adminApi.getMyNotifications();
    await adminApi.getUnreadNotificationCount();
    await adminApi.markNotificationRead(12);
    await adminApi.markAllNotificationsRead();
    await adminApi.getCurrentAdminUser();

    expect(vi.mocked(fetch).mock.calls.map(([url]) => new URL(String(url)).pathname + new URL(String(url)).search)).toEqual([
      "/api/notification/?page=1",
      "/api/notification/unread-count/",
      "/api/notification/12/read/",
      "/api/notification/mark-all-read/",
      "/api/auth/current-user/",
    ]);
  });

  it("sends password management payloads to the supplied auth endpoints", async () => {
    vi.mocked(fetch).mockImplementation(async () => new Response(JSON.stringify({ detail: "ok" }), { status: 200 }));

    await setAdminPassword("invite-token", "NewPassword123!");
    await requestAdminPasswordReset("admin@example.test");
    await confirmAdminPasswordReset("encoded-uid", "reset-token", "NewPassword123!");
    localStorage.setItem("access", "admin-token");
    await changeAdminPassword("CurrentPassword123!", "NewPassword123!");

    const calls = vi.mocked(fetch).mock.calls;
    expect(calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
      "/api/auth/admin/set-password/",
      "/api/auth/password-reset/request/",
      "/api/auth/password-reset/confirm/",
      "/api/auth/change-password/",
    ]);
    expect(JSON.parse(String(calls[0][1]?.body))).toEqual({ token: "invite-token", new_password: "NewPassword123!" });
    expect(JSON.parse(String(calls[1][1]?.body))).toEqual({ email: "admin@example.test" });
    expect(JSON.parse(String(calls[2][1]?.body))).toEqual({ uid: "encoded-uid", token: "reset-token", new_password: "NewPassword123!" });
    expect(JSON.parse(String(calls[3][1]?.body))).toEqual({ current_password: "CurrentPassword123!", new_password: "NewPassword123!" });
    expect(new Headers(calls[0][1]?.headers).has("Authorization")).toBe(false);
    expect(new Headers(calls[3][1]?.headers).get("Authorization")).toBe("Bearer admin-token");
  });

  it("wraps network failures and unwraps common list payloads", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("offline"));
    await expect(apiRequest("/categories/")).rejects.toEqual(
      expect.objectContaining({ name: "ApiError", status: 0 }),
    );
    expect(unwrapList({ results: [1, 2] })).toEqual([1, 2]);
    expect(unwrapList("invalid")).toEqual([]);
    expect(new ApiError("bad", 400).status).toBe(400);
  });
});
