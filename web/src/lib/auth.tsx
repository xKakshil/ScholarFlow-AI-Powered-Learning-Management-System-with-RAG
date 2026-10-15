"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { api, getToken, setToken, setUnauthorizedHandler } from "./api";
import type { AuthUser, Role } from "./types";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    role: Exclude<Role, "ADMIN">;
  }) => Promise<AuthUser>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function decode(token: string): AuthUser | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const data = JSON.parse(atob(payload)) as AuthUser & { exp?: number };
    if (!data.id || !data.role || (data.exp && data.exp * 1000 < Date.now())) return null;
    return { id: data.id, email: data.email, role: data.role };
  } catch {
    return null;
  }
}

export const homeFor = (role: Role) =>
  role === "ADMIN" ? "/admin" : role === "INSTRUCTOR" ? "/teach" : "/courses";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { mutate } = useSWRConfig();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const decoded = token ? decode(token) : null;
    if (token && !decoded) setToken(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the stored session once on mount
    setUser(decoded);
    setReady(true);
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    window.location.assign("/");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const applyToken = useCallback(
    (token: string) => {
      const decoded = decode(token);
      if (!decoded) throw new Error("The server returned an invalid session.");
      setToken(token);
      setUser(decoded);
      void mutate(() => true, undefined, { revalidate: true });
      return decoded;
    },
    [mutate],
  );

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async (email, password) => {
      const { token } = await api.login(email.trim().toLowerCase(), password);
      return applyToken(token);
    },
    [applyToken],
  );

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async (input) => {
      const email = input.email.trim().toLowerCase();
      await api.register({ ...input, email, name: input.name.trim() });
      const { token } = await api.login(email, input.password);
      return applyToken(token);
    },
    [applyToken],
  );

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, signOut }),
    [user, ready, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
