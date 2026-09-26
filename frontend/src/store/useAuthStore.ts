import { create } from "zustand";
import type { AuthUser } from "../types/auth";
import { authApi, isBackendConfigured } from "../services/authApi";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;

  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  loginWithGoogle: (idToken: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  tryRestoreSession: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; resetLink?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ message: string }>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: "idle",
  error: null,

  register: async (email, password, displayName) => {
    set({ status: "loading", error: null });
    try {
      const r = await authApi.register(email, password, displayName);
      set({ user: r.user, accessToken: r.accessToken, status: "authenticated" });
    } catch (e) {
      set({ status: "unauthenticated", error: e instanceof Error ? e.message : "Registration failed" });
      throw e;
    }
  },

  login: async (email, password, rememberMe) => {
    set({ status: "loading", error: null });
    try {
      const r = await authApi.login(email, password, rememberMe);
      set({ user: r.user, accessToken: r.accessToken, status: "authenticated" });
    } catch (e) {
      set({ status: "unauthenticated", error: e instanceof Error ? e.message : "Sign in failed" });
      throw e;
    }
  },

  loginWithGoogle: async (idToken, rememberMe) => {
    set({ status: "loading", error: null });
    try {
      const r = await authApi.loginWithGoogle(idToken, rememberMe);
      set({ user: r.user, accessToken: r.accessToken, status: "authenticated" });
    } catch (e) {
      set({ status: "unauthenticated", error: e instanceof Error ? e.message : "Google sign-in failed" });
      throw e;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      /* best-effort — clear local state regardless */
    }
    set({ user: null, accessToken: null, status: "unauthenticated" });
  },

  tryRestoreSession: async () => {
    if (!isBackendConfigured() || get().status === "authenticated") return;
    set({ status: "loading" });
    try {
      const r = await authApi.refresh();
      set({ user: r.user, accessToken: r.accessToken, status: "authenticated" });
    } catch {
      set({ status: "unauthenticated" });
    }
  },

  forgotPassword: (email) => authApi.forgotPassword(email),
  resetPassword: (token, newPassword) => authApi.resetPassword(token, newPassword),

  clearError: () => set({ error: null }),
}));
