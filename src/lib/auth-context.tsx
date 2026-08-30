"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  token: string;
  userId: string;
  roleLevel: string;
  portalRole: string;
  displayName: string;
  orgId: string;
  googleEmail?: string;
  expiresAt?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (orgId: string, password: string, googleEmail?: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const stored = localStorage.getItem("ntro_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check expiry
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          localStorage.removeItem("ntro_session");
        } else {
          setUser(parsed);
        }
      } catch {
        localStorage.removeItem("ntro_session");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (orgId: string, password: string, googleEmail?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, password, googleEmail }),
      });
      const data = await res.json();
      if (data.success) {
        const authUser: AuthUser = {
          token: data.token,
          userId: data.user.id,
          roleLevel: data.user.roleLevel,
          portalRole: data.user.portalRole,
          displayName: data.user.displayName,
          orgId: data.user.orgId,
          googleEmail: data.user.googleEmail,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        setUser(authUser);
        localStorage.setItem("ntro_session", JSON.stringify(authUser));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("ntro_session");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin: user?.portalRole === "ADMIN" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAuth({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (!isLoading && adminOnly && user?.portalRole !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router, adminOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;
  if (adminOnly && user.portalRole !== "ADMIN") return null;

  return <>{children}</>;
}

export function authHeaders(user: AuthUser | null): HeadersInit {
  return user ? { Authorization: `Bearer ${user.token}` } : {};
}
