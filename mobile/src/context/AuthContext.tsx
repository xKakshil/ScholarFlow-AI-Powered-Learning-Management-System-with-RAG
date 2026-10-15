import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import * as Api from "@/lib/api";
import { deleteSecure, getSecure, setSecure } from "@/lib/storage";
import type { AuthUser, Role } from "@/lib/types";

const TOKEN_KEY = "scholarflow_token";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    role: Exclude<Role, "ADMIN">;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function decode(token: string): AuthUser | null {
  try {
    const user = jwtDecode<AuthUser>(token);
    if (user.exp && user.exp * 1000 < Date.now()) return null;
    return user;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    Api.setAuthToken(null);
    setUser(null);
    await deleteSecure(TOKEN_KEY);
  }, []);

  const applyToken = useCallback(async (token: string) => {
    const decoded = decode(token);
    if (!decoded) throw new Error("Received an invalid session token.");
    Api.setAuthToken(token);
    await setSecure(TOKEN_KEY, token);
    setUser(decoded);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await getSecure(TOKEN_KEY);
        const decoded = token ? decode(token) : null;
        if (token && decoded) {
          Api.setAuthToken(token);
          setUser(decoded);
        } else if (token) {
          await deleteSecure(TOKEN_KEY);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    Api.setUnauthorizedHandler(() => {
      signOut();
    });
    return () => Api.setUnauthorizedHandler(null);
  }, [signOut]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { token } = await Api.login(email.trim().toLowerCase(), password);
      await applyToken(token);
    },
    [applyToken],
  );

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async (input) => {
      const email = input.email.trim().toLowerCase();
      await Api.register({ ...input, email, name: input.name.trim() });
      const { token } = await Api.login(email, input.password);
      await applyToken(token);
    },
    [applyToken],
  );

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
