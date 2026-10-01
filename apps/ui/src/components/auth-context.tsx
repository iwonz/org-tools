"use client";

import type { SessionBootstrap } from "@org-tools/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthMode = "authenticated" | "loading" | "login" | "setup";

type Credentials = { email: string; password: string };

type AuthContextValue = {
  bootstrap: SessionBootstrap | null;
  changePassword: (currentPassword: string, password: string) => Promise<void>;
  csrfToken: string | null;
  error: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  mode: AuthMode;
  refresh: () => Promise<SessionBootstrap>;
  setup: (input: Credentials & { setupToken: string }) => Promise<void>;
  updateBootstrap: (bootstrap: SessionBootstrap) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const requestJson = async (url: string, init?: RequestInit): Promise<unknown> => {
  const response = await fetch(url, { cache: "no-store", ...init });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code =
      typeof body === "object" && body !== null && "error" in body
        ? (body as { error?: { code?: unknown } }).error?.code
        : null;
    throw new Error(typeof code === "string" ? code : "server_error");
  }
  return body;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AuthMode>("loading");
  const [bootstrap, setBootstrap] = useState<SessionBootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<SessionBootstrap> => {
    try {
      const value = (await requestJson("/api/session")) as SessionBootstrap;
      setBootstrap(value);
      setMode("authenticated");
      setError(null);
      return value;
    } catch (refreshError) {
      if (refreshError instanceof Error && refreshError.message === "unauthenticated") {
        setBootstrap(null);
        setMode("login");
      }
      throw refreshError;
    }
  }, []);

  const resolveAnonymousMode = useCallback(async () => {
    const value = (await requestJson("/api/auth/status")) as { kind: "login" | "setup" };
    setBootstrap(null);
    setMode(value.kind);
  }, []);

  useEffect(() => {
    let active = true;
    void refresh().catch(async () => {
      if (!active) return;
      try {
        await resolveAnonymousMode();
      } catch {
        if (active) setError("server_error");
      }
    });
    return () => {
      active = false;
    };
  }, [refresh, resolveAnonymousMode]);

  const authenticate = useCallback(
    async (url: string, input: object) => {
      setError(null);
      try {
        await requestJson(url, {
          body: JSON.stringify(input),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        await refresh();
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : "server_error");
        throw authError;
      }
    },
    [refresh],
  );

  const login = useCallback(
    (credentials: Credentials) => authenticate("/api/auth/login", credentials),
    [authenticate],
  );
  const setup = useCallback(
    (input: Credentials & { setupToken: string }) => authenticate("/api/auth/setup", input),
    [authenticate],
  );
  const logout = useCallback(async () => {
    if (bootstrap) {
      await requestJson("/api/auth/logout", {
        body: "{}",
        headers: { "Content-Type": "application/json", "X-Org-Tools-CSRF": bootstrap.csrfToken },
        method: "POST",
      }).catch(() => undefined);
    }
    await resolveAnonymousMode();
  }, [bootstrap, resolveAnonymousMode]);
  const changePassword = useCallback(
    async (currentPassword: string, password: string) => {
      if (!bootstrap) throw new Error("unauthenticated");
      setError(null);
      try {
        await requestJson("/api/auth/password", {
          body: JSON.stringify({ currentPassword, password }),
          headers: { "Content-Type": "application/json", "X-Org-Tools-CSRF": bootstrap.csrfToken },
          method: "POST",
        });
        await refresh();
      } catch (passwordError) {
        setError(passwordError instanceof Error ? passwordError.message : "server_error");
        throw passwordError;
      }
    },
    [bootstrap, refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      bootstrap,
      changePassword,
      csrfToken: bootstrap?.csrfToken ?? null,
      error,
      login,
      logout,
      mode,
      refresh,
      setup,
      updateBootstrap: setBootstrap,
    }),
    [bootstrap, changePassword, error, login, logout, mode, refresh, setup],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing.");
  return value;
};
