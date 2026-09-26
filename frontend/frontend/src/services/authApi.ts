import type { AuthTokenResponse, AuthUser, BroadcastNotification } from "../types/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export function isBackendConfigured(): boolean {
  return Boolean(API_BASE);
}

export function getApiBase(): string {
  return API_BASE ?? "";
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE) {
    throw new ApiError("No backend configured (VITE_API_BASE_URL unset) — using local demo mode.", 0);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // send/receive the httpOnly refresh cookie
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore parse failure, fall back to statusText */
    }
    throw new ApiError(typeof detail === "string" ? detail : JSON.stringify(detail), res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function mapUser(u: { id: string; email: string | null; display_name: string; role: string; has_password: boolean }): AuthUser {
  return { id: u.id, email: u.email, displayName: u.display_name, role: u.role as AuthUser["role"], hasPassword: u.has_password };
}

function mapTokenResponse(r: { access_token: string; token_type: string; expires_in_minutes: number; user: Parameters<typeof mapUser>[0] }): AuthTokenResponse {
  return { accessToken: r.access_token, tokenType: r.token_type, expiresInMinutes: r.expires_in_minutes, user: mapUser(r.user) };
}

export const authApi = {
  async register(email: string, password: string, displayName: string): Promise<AuthTokenResponse> {
    const r = await request<Parameters<typeof mapTokenResponse>[0]>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    return mapTokenResponse(r);
  },

  async login(email: string, password: string, rememberMe: boolean): Promise<AuthTokenResponse> {
    const r = await request<Parameters<typeof mapTokenResponse>[0]>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });
    return mapTokenResponse(r);
  },

  async loginWithGoogle(idToken: string, rememberMe: boolean): Promise<AuthTokenResponse> {
    const r = await request<Parameters<typeof mapTokenResponse>[0]>("/api/auth/login/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken, remember_me: rememberMe }),
    });
    return mapTokenResponse(r);
  },

  async refresh(): Promise<AuthTokenResponse> {
    const r = await request<Parameters<typeof mapTokenResponse>[0]>("/api/auth/refresh", { method: "POST" });
    return mapTokenResponse(r);
  },

  async logout(): Promise<void> {
    await request("/api/auth/logout", { method: "POST" });
  },

  async me(accessToken: string): Promise<AuthUser> {
    const r = await request<Parameters<typeof mapUser>[0]>("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return mapUser(r);
  },

  async forgotPassword(email: string): Promise<{ message: string; resetLink?: string }> {
    const r = await request<{ message: string; reset_link?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { message: r.message, resetLink: r.reset_link };
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },

  async listNotifications(): Promise<BroadcastNotification[]> {
    const rows = await request<{ id: string; user_id: string | null; request_id: string | null; title: string; body: string | null; read: boolean; created_at: string }[]>(
      "/api/notifications",
    );
    return rows.map((n) => ({ id: n.id, userId: n.user_id, requestId: n.request_id, title: n.title, body: n.body, read: n.read, createdAt: n.created_at }));
  },
};

export { ApiError };
